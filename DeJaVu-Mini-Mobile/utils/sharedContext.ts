import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  tabId: string;
  categoryId?: string;
}

export interface ChatContext {
  tabId: string;
  title: string;
  type: 'central' | 'category';
  categoryId?: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export interface SharedContextData {
  allChats: { [tabId: string]: ChatContext };
  centralHubContext: string;
  crossChatInsights: string[];
  lastSync: Date;
}

// CODE SMELL: Singleton pattern with mutable state - can cause issues in testing and concurrency
class SharedContextManager {
  private static instance: SharedContextManager;
  private contextData: SharedContextData = {
    allChats: {},
    centralHubContext: '',
    crossChatInsights: [],
    lastSync: new Date()
  };

  private constructor() {}

  static getInstance(): SharedContextManager {
    if (!SharedContextManager.instance) {
      SharedContextManager.instance = new SharedContextManager();
    }
    return SharedContextManager.instance;
  }

  // Add or update a chat context
  async updateChatContext(tabId: string, context: Partial<ChatContext>): Promise<void> {
    const existing = this.contextData.allChats[tabId] || {
      tabId,
      title: '',
      type: 'category',
      messages: [],
      lastUpdated: new Date()
    };

    this.contextData.allChats[tabId] = {
      ...existing,
      ...context,
      lastUpdated: new Date()
    };

    await this.saveToStorage();
  }

  // Add a message to a specific chat
  async addMessage(tabId: string, message: ChatMessage): Promise<void> {
    if (!this.contextData.allChats[tabId]) {
      this.contextData.allChats[tabId] = {
        tabId,
        title: '',
        type: 'category',
        messages: [],
        lastUpdated: new Date()
      };
    }

    this.contextData.allChats[tabId].messages.push(message);
    this.contextData.allChats[tabId].lastUpdated = new Date();

    await this.saveToStorage();
  }

  // Get all chat contexts
  async getAllChatContexts(): Promise<{ [tabId: string]: ChatContext }> {
    return this.contextData.allChats;
  }

  // Get context for a specific chat
  async getChatContext(tabId: string): Promise<ChatContext | null> {
    return this.contextData.allChats[tabId] || null;
  }

  // Get context from all other chats (for cross-chat communication)
  async getCrossChatContext(excludeTabId: string): Promise<string> {
    const otherChats = Object.values(this.contextData.allChats)
      .filter(chat => chat.tabId !== excludeTabId)
      .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

    if (otherChats.length === 0) {
      return 'No other chat contexts available.';
    }

    const contextParts = otherChats.map(chat => {
      const recentMessages = chat.messages
        .slice(-5) // Last 5 messages
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');

      return `=== ${chat.title} (${chat.type}) ===\n${recentMessages}`;
    });

    return contextParts.join('\n\n');
  }

  // Get insights from all chats for the central hub
  async getCentralHubInsights(): Promise<string> {
    const allChats = Object.values(this.contextData.allChats);
    
    if (allChats.length === 0) {
      return 'No chat contexts available for insights.';
    }

    const insights = allChats.map(chat => {
      const recentMessages = chat.messages.slice(-3); // Last 3 messages
      const userMessages = recentMessages.filter(msg => msg.sender === 'user');
      const aiMessages = recentMessages.filter(msg => msg.sender === 'ai');

      return {
        title: chat.title,
        type: chat.type,
        recentUserInput: userMessages.map(msg => msg.text).join('; '),
        recentAIResponse: aiMessages.map(msg => msg.text).join('; '),
        messageCount: chat.messages.length
      };
    });

    const insightsText = insights.map(insight => 
      `**${insight.title}** (${insight.type}): ${insight.messageCount} messages\n` +
      `Recent user input: ${insight.recentUserInput}\n` +
      `Recent AI response: ${insight.recentAIResponse}`
    ).join('\n\n');

    return insightsText;
  }

  // Get category-specific context
  async getCategoryContext(categoryId: string): Promise<string> {
    const categoryChats = Object.values(this.contextData.allChats)
      .filter(chat => chat.categoryId === categoryId);

    if (categoryChats.length === 0) {
      return `No context available for category ${categoryId}.`;
    }

    const context = categoryChats.map(chat => {
      const recentMessages = chat.messages
        .slice(-10) // Last 10 messages
        .map(msg => `${msg.sender}: ${msg.text}`)
        .join('\n');

      return `=== ${chat.title} ===\n${recentMessages}`;
    });

    return context.join('\n\n');
  }

  // Save context data to AsyncStorage
  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('shared_context_data', JSON.stringify(this.contextData));
    } catch (error) {
      console.error('Error saving shared context:', error);
    }
  }

  // Load context data from AsyncStorage
  async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('shared_context_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        parsed.lastSync = new Date(parsed.lastSync);
        Object.values(parsed.allChats).forEach((chat: any) => {
          chat.lastUpdated = new Date(chat.lastUpdated);
          chat.messages.forEach((msg: any) => {
            msg.timestamp = new Date(msg.timestamp);
          });
        });
        this.contextData = parsed;
      }
    } catch (error) {
      console.error('Error loading shared context:', error);
    }
  }

  // Clear all context data
  async clearAllContext(): Promise<void> {
    this.contextData = {
      allChats: {},
      centralHubContext: '',
      crossChatInsights: [],
      lastSync: new Date()
    };
    await this.saveToStorage();
  }

  // Get summary statistics
  async getContextStats(): Promise<{
    totalChats: number;
    totalMessages: number;
    categories: string[];
    lastActivity: Date | null;
  }> {
    const chats = Object.values(this.contextData.allChats);
    const totalMessages = chats.reduce((sum, chat) => sum + chat.messages.length, 0);
    const categories = [...new Set(chats.map(chat => chat.categoryId).filter(Boolean) as string[])];
    const lastActivity = chats.length > 0 
      ? new Date(Math.max(...chats.map(chat => chat.lastUpdated.getTime())))
      : null;

    return {
      totalChats: chats.length,
      totalMessages,
      categories,
      lastActivity
    };
  }
}

export default SharedContextManager;

