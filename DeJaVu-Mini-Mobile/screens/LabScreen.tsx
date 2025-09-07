import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, {
  Path,
  Circle,
  Rect,
  G
} from 'react-native-svg';
import GoalDetailScreen from './GoalDetailScreen';
import ChatPanel from './ChatPanel';
import { useDarkMode } from '../App';
import AIService from '../utils/aiService';
import SharedContextManager, { ChatMessage as SharedChatMessage } from '../utils/sharedContext';
import { eventBus, CategoryCreationEvent, CategoryCreationError, Category } from '../utils/eventBus';
import { categoryManager } from '../utils/categoryManager';
import { progressPathManager } from '../utils/progressPathManager';
import { proactiveCheckInManager } from '../utils/proactiveCheckIn';
import { getThemeColors } from '../config/theme';
import { DEFAULT_INITIAL_GOALS, DEFAULT_GOALS } from '../config/defaultGoals';

interface Goal {
  id: string;
  title: string;
  goalCount: number;
  completedCount: number;
  type: 'input' | 'output';
}

interface ChatTab {
  id: string;
  title: string;
  type: 'central' | 'category';
  categoryId?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface LabScreenProps {
  onGoalSelect?: (goal: Goal) => void;
  onNavigateToGoalDetail?: (goal: Goal) => void;
}

// Category Card Component
const CategoryCard = ({ goal, onChatClick, onCardClick, colors }: {
  goal: Goal;
  onChatClick: (goal: Goal) => void;
  onCardClick: (goal: Goal) => void;
  colors: any;
}) => {
  const progressPercentage = goal.goalCount > 0 ? (goal.completedCount / goal.goalCount) * 100 : 0;
  
  return (
    <View style={[styles.categoryCard, { backgroundColor: colors.cardSoft }]}>
      <TouchableOpacity 
        style={styles.cardContent}
        onPress={() => onCardClick(goal)}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]}>{goal.title}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.progressTrack }]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressPercentage}%`, backgroundColor: colors.accent }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.muted }]}>
            {goal.completedCount}/{goal.goalCount}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.chatButton, { backgroundColor: colors.accent }]}
        onPress={() => onChatClick(goal)}
      >
        <Text style={styles.chatButtonText}>💬</Text>
      </TouchableOpacity>
    </View>
  );
};

// Add Category Button Component
const AddCategoryButton = ({ type, onAdd, colors }: {
  type: 'input' | 'output';
  onAdd: (type: 'input' | 'output') => void;
  colors: any;
}) => {
  return (
    <TouchableOpacity 
      style={[styles.addButton, { backgroundColor: colors.surface }]}
      onPress={() => onAdd(type)}
    >
      <View style={styles.addButtonContent}>
        <Text style={[styles.addButtonIcon, { color: colors.muted }]}>+</Text>
        <Text style={[styles.addButtonText, { color: colors.muted }]}>add {type} category</Text>
      </View>
    </TouchableOpacity>
  );
};

// Central Hub Component
const CentralHub = ({ onChatClick, colors, hasNewMessages }: { onChatClick: () => void; colors: any; hasNewMessages: boolean }) => {
  return (
    <View style={styles.centralHubContainer}>
      <Svg width={80} height={80} style={[styles.centralHubSvg, { backgroundColor: colors.card, shadowColor: '#000' }]}>
        <G transform="translate(40, 40)">
          <Circle cx="0" cy="-8" r="8" fill={colors.accent} />
          <Path 
            d="M -12 18 Q -12 8 -8 4 Q -4 2 0 2 Q 4 2 8 4 Q 12 8 12 18 Z" 
            fill={colors.accent} 
          />
        </G>
      </Svg>
      <TouchableOpacity 
        style={[styles.centralChatButton, { backgroundColor: colors.accent, shadowColor: '#000' }]}
        onPress={onChatClick}
      >
        <Text style={styles.centralChatButtonText}>💬</Text>
      </TouchableOpacity>
      {hasNewMessages && (
        <View style={[styles.notificationBadge, { backgroundColor: '#FF4444' }]}>
          <Text style={styles.notificationBadgeText}>!</Text>
        </View>
      )}
    </View>
  );
};

// Simple arrow component
const Arrow = ({ direction, colors }: { direction: 'up' | 'down'; colors: any }) => {
  return (
    <View style={[styles.arrow, direction === 'up' ? styles.arrowUp : styles.arrowDown]}>
      <View style={[styles.arrowLine, { backgroundColor: colors.muted }]} />
      <View style={[styles.arrowHead, direction === 'up' ? styles.arrowHeadUp : styles.arrowHeadDown, { borderBottomColor: colors.muted }]} />
    </View>
  );
};

export default function LabScreen({ onGoalSelect, onNavigateToGoalDetail }: LabScreenProps) {
  const { isDarkMode } = useDarkMode();
  const colors = getThemeColors(isDarkMode);

  // Initialize shared context manager
  const contextManager = SharedContextManager.getInstance();

  const [goals, setGoals] = useState<Goal[]>(DEFAULT_INITIAL_GOALS);
  
  const goalsRef = useRef(goals);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalDetailModal, setShowGoalDetailModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState<'input' | 'output'>('input');
  
  // Chat state
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [activeTabs, setActiveTabs] = useState<ChatTab[]>([]);
  const [messages, setMessages] = useState<{ [tabId: string]: ChatMessage[] }>({});
  const [requestedActiveTabId, setRequestedActiveTabId] = useState<string | undefined>(undefined);
  const [lastCheckedMessageCount, setLastCheckedMessageCount] = useState<number>(0);

  const outputGoals = goals.filter(goal => goal.type === 'output');
  const inputGoals = goals.filter(goal => goal.type === 'input');

  useEffect(() => { goalsRef.current = goals; }, [goals]);

  // Load shared context on component mount and initialize proactive check-ins
  useEffect(() => {
    const loadContext = async () => {
      await contextManager.loadFromStorage();
      // Small delay to ensure context is loaded before restoring messages
      setTimeout(() => {
        restoreMessagesFromContext();
      }, 100);
      
      // Initialize proactive check-in system
      await proactiveCheckInManager.initialize();
    };
    loadContext();

    // Cleanup on unmount
    return () => {
      proactiveCheckInManager.stop();
    };
  }, []);

  // Load categories from storage
  const loadCategories = useCallback(async () => {
    try {
      // console.log('🔵 Loading categories from storage...');
      const categories = await categoryManager.loadCategories();
      // console.log('🔵 Loaded categories:', categories);
      
      if (categories.length > 0) {
        // Convert categories to goals format
        const categoryGoals: Goal[] = categories.map(cat => ({
          id: cat.id,
          title: cat.title,
          goalCount: 0,
          completedCount: 0,
          type: cat.type
        }));
        // console.log('🔵 Setting goals from loaded categories:', categoryGoals);
        setGoals(categoryGoals);
        return true; // Successfully loaded categories
      } else {
        // console.log('🔵 No categories found in storage');
        return false; // No categories found
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      return false; // Error loading categories
    }
  }, []);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Reload categories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // console.log('🔵 LabScreen focused - reloading categories...');
      loadCategories();
    }, [loadCategories])
  );

  // Event listeners for category creation
  useEffect(() => {
    // console.log('🟠 LabScreen: Setting up CATEGORY_CREATED event listener at', new Date().toISOString());
    
    const handleCategoryCreated = (event: CategoryCreationEvent) => {
      // console.log('🔵 Categories created successfully - updating Lab screen');
      // console.log('🔵 Number of categories:', event.categories.length);
      // console.log('🔵 Categories:', event.categories.map(cat => ({ id: cat.id, title: cat.title, type: cat.type })));
      
      const categoryGoals: Goal[] = event.categories.map(cat => ({
        id: cat.id,
        title: cat.title,
        goalCount: 0,
        completedCount: 0,
        type: cat.type
      }));
      
      // console.log('🔵 Setting goals:', categoryGoals);
      setGoals(categoryGoals);
      
      // Show success message
      Alert.alert(
        'Categories Created!',
        'Your strategy has been organized into categories. Check the Lab screen to see your personalized categories.',
        [{ text: 'OK' }]
      );
    };

    const handleCategoryCreationError = (event: CategoryCreationError) => {
      // console.log('Category creation error:', event);
      Alert.alert(
        'Category Creation Failed',
        event.instructions,
        [{ text: 'OK' }]
      );
    };

    // Register event listeners
    // console.log('🟠 LabScreen: Registering event listeners at', new Date().toISOString());
    eventBus.on('CATEGORY_CREATED', handleCategoryCreated);
    eventBus.on('CATEGORY_CREATION_ERROR', handleCategoryCreationError);
    // console.log('🟠 LabScreen: Event listeners registered');

    // Cleanup
    return () => {
      // console.log('🟠 LabScreen: Cleaning up event listeners at', new Date().toISOString());
      eventBus.off('CATEGORY_CREATED', handleCategoryCreated);
      eventBus.off('CATEGORY_CREATION_ERROR', handleCategoryCreationError);
    };
  }, []);

  // Restore messages from shared context
  const restoreMessagesFromContext = useCallback(async () => {
    try {
      const allChatContexts = await contextManager.getAllChatContexts();
      // console.log('Restoring messages from context:', Object.keys(allChatContexts));
      
      // Restore active tabs
      const restoredTabs: ChatTab[] = [];
      const restoredMessages: { [tabId: string]: ChatMessage[] } = {};
      
      Object.values(allChatContexts).forEach(chatContext => {
        // console.log(`Restoring tab: ${chatContext.tabId} with ${chatContext.messages.length} messages`);
        
        // Create tab
        const tab: ChatTab = {
          id: chatContext.tabId,
          title: chatContext.title,
          type: chatContext.type,
          categoryId: chatContext.categoryId
        };
        restoredTabs.push(tab);
        
        // Convert shared messages to local format
        const localMessages: ChatMessage[] = chatContext.messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          timestamp: msg.timestamp
        }));
        restoredMessages[chatContext.tabId] = localMessages;
      });
      
      setActiveTabs(restoredTabs);
      setMessages(restoredMessages);
      // console.log('Messages restored successfully');
    } catch (error) {
      console.error('Error restoring messages from context:', error);
    }
  }, [contextManager]);

  // Sync local messages with shared context when messages change
  const syncMessagesWithContext = useCallback(async () => {
    try {
      for (const [tabId, tabMessages] of Object.entries(messages)) {
        const chatContext = await contextManager.getChatContext(tabId);
        if (chatContext) {
          // Convert local messages to shared format and update context
          const sharedMessages: SharedChatMessage[] = tabMessages.map(msg => ({
            ...msg,
            tabId,
            categoryId: activeTabs.find(tab => tab.id === tabId)?.categoryId
          }));
          
          await contextManager.updateChatContext(tabId, {
            messages: sharedMessages
          });
        }
      }
    } catch (error) {
      console.error('Error syncing messages with context:', error);
    }
  }, [messages, activeTabs, contextManager]);

  // Sync messages when they change (but not during initial load)
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    
    if (Object.keys(messages).length > 0) {
      syncMessagesWithContext();
    }
  }, [messages, syncMessagesWithContext, isInitialLoad]);

  // Poll for new proactive messages periodically
  useEffect(() => {
    const pollForNewMessages = async () => {
      try {
        const centralTabId = 'central-hub';
        const centralContext = await contextManager.getChatContext(centralTabId);
        
        if (centralContext && centralContext.messages.length > 0) {
          const currentMessages = messages[centralTabId] || [];
          
          // Check if there are new messages
          if (centralContext.messages.length > currentMessages.length) {
            const newMessages = centralContext.messages.slice(currentMessages.length);
            
            // Update local messages with new proactive messages
            setMessages(prev => ({
              ...prev,
              [centralTabId]: [
                ...currentMessages,
                ...newMessages.map(msg => ({
                  id: msg.id,
                  text: msg.text,
                  sender: msg.sender,
                  timestamp: msg.timestamp
                }))
              ]
            }));
          }
        }
      } catch (error) {
        console.error('Error polling for new messages:', error);
      }
    };

    // Poll every 30 seconds for new proactive messages
    const pollInterval = setInterval(pollForNewMessages, 30000);
    
    return () => clearInterval(pollInterval);
  }, [messages, contextManager]);

  const loadGoalCounts = useCallback(async () => {
    try {
      const currentGoals = goalsRef.current;
      const updatedGoals = await Promise.all(
        currentGoals.map(async (goal) => {
          try {
            const storageKey = `goals_${goal.title}_${goal.type}`;
            const storedGoals = await AsyncStorage.getItem(storageKey);
            if (storedGoals) {
              const parsedGoals = JSON.parse(storedGoals);
              const totalCount = parsedGoals.length;
              const completedCount = parsedGoals.filter((g: any) => g.completed).length;
              return { ...goal, goalCount: totalCount, completedCount };
            }
            return goal;
          } catch (error) {
            console.error('Error loading goals for', goal.title, error);
            return goal;
          }
        })
      );
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error in loadGoalCounts:', error);
    }
  }, []);

  const initializeDefaultGoals = useCallback(async () => {

    for (const goal of goals) {
      const storageKey = `goals_${goal.title}_${goal.type}`;
      const existingGoals = await AsyncStorage.getItem(storageKey);
      if (!existingGoals && DEFAULT_GOALS[goal.title]) {
        await AsyncStorage.setItem(
          storageKey,
          JSON.stringify(DEFAULT_GOALS[goal.title])
        );
      }
    }
  }, [goals]);

  useEffect(() => { initializeDefaultGoals().then(loadGoalCounts); }, [initializeDefaultGoals, loadGoalCounts]);
  useEffect(() => { if (!showGoalDetailModal) loadGoalCounts(); }, [showGoalDetailModal, loadGoalCounts]);

  const addGoal = useCallback((type: 'input' | 'output') => { setNewGoalType(type); setShowAddModal(true); }, []);
  const handleAddGoal = () => {
    if (newGoalTitle.trim()) {
      const newGoal: Goal = { 
        id: Date.now().toString(), 
        title: newGoalTitle.trim(), 
        goalCount: 0, 
        completedCount: 0, 
        type: newGoalType
      };
      setGoals(prev => [...prev, newGoal]);
      
      // Also add to category manager
      const newCategory: Category = {
        id: newGoal.id,
        title: newGoal.title,
        type: newGoal.type,
        description: `Manual category: ${newGoal.title}`
      };
      categoryManager.addCategory(newCategory);
      
      setNewGoalTitle('');
      setShowAddModal(false);
    } else {
      Alert.alert('Error', 'Please enter a category name');
    }
  };

  const handleChatClick = async (goal: Goal) => {
    const tabId = `category-${goal.id}`;
    const newTab: ChatTab = { id: tabId, title: goal.title, type: 'category', categoryId: goal.id };
    
    if (!activeTabs.find(tab => tab.id === tabId)) {
      setActiveTabs(prev => [...prev, newTab]);
      setMessages(prev => ({ ...prev, [tabId]: [] }));
      
      // Initialize chat context in shared manager
      await contextManager.updateChatContext(tabId, {
        title: goal.title,
        type: 'category',
        categoryId: goal.id,
        messages: []
      });

      // Create progress path for this category if it doesn't exist
      try {
        await AIService.createProgressPathForCategory(goal.id);
      } catch (error) {
        console.error('Error creating progress path for category:', error);
      }
    }
    setRequestedActiveTabId(tabId);
    setShowChatPanel(true);
  };

  const handleCardClick = (goal: Goal) => { setSelectedGoal(goal); setShowGoalDetailModal(true); };

  const handleCentralChatClick = async () => {
    const tabId = 'central-hub';
    const newTab: ChatTab = { id: tabId, title: 'Central Planning', type: 'central' };
    
    if (!activeTabs.find(tab => tab.id === tabId)) {
      setActiveTabs(prev => [newTab, ...prev]);
      setMessages(prev => ({ ...prev, [tabId]: [] }));
      
      // Initialize central hub context
      await contextManager.updateChatContext(tabId, {
        title: 'Central Planning',
        type: 'central',
        messages: []
      });
    }
    
    // Reset the notification badge when user opens central hub
    const centralMessages = messages['central-hub'] || [];
    setLastCheckedMessageCount(centralMessages.length);
    
    setShowChatPanel(true);
  };

  const handleUpdateTabs = (updatedTabs: ChatTab[]) => {
    setActiveTabs(updatedTabs);
  };

  const handleSendMessage = async (tabId: string, message: string) => {
    const userMessage: ChatMessage = { id: Date.now().toString(), text: message, sender: 'user', timestamp: new Date() };
    setMessages(prev => ({ ...prev, [tabId]: [...(prev[tabId] || []), userMessage] }));

    // Add message to shared context
    const sharedMessage: SharedChatMessage = {
      ...userMessage,
      tabId,
      categoryId: activeTabs.find(tab => tab.id === tabId)?.categoryId
    };
    await contextManager.addMessage(tabId, sharedMessage);
    // console.log(`Saved user message to shared context for tab: ${tabId}`);

    try {
      // Get cross-chat context for AI
      let context = '';
      const currentTab = activeTabs.find(tab => tab.id === tabId);
      
      if (currentTab?.type === 'central') {
        // For central hub, get insights from all other chats
        context = await contextManager.getCentralHubInsights();
      } else {
        // For category chats, get context from other chats
        context = await contextManager.getCrossChatContext(tabId);
      }

      // Determine chat type
      const chatType = currentTab?.type === 'central' 
        ? { type: 'central' as const }
        : { type: 'category' as const, categoryId: currentTab?.categoryId };
      
      const aiResponse = await AIService.sendMessage(
        message, 
        `Context for ${currentTab?.title || 'chat'}: ${context}`,
        [], // conversation history
        chatType // pass chat type
      );
      
      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: aiResponse.response, sender: 'ai', timestamp: new Date() };
      setMessages(prev => ({ ...prev, [tabId]: [...(prev[tabId] || []), aiMessage] }));

      // Add AI message to shared context
      const sharedAIMessage: SharedChatMessage = {
        ...aiMessage,
        tabId,
        categoryId: currentTab?.categoryId
      };
      await contextManager.addMessage(tabId, sharedAIMessage);
      // console.log(`Saved AI message to shared context for tab: ${tabId}`);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), text: 'Sorry, I encountered an error processing your request.', sender: 'ai', timestamp: new Date() };
      setMessages(prev => ({ ...prev, [tabId]: [...(prev[tabId] || []), aiMessage] }));
    }
  };

  const resetAllChats = async () => {
    try {
      // Clear all shared context
      await contextManager.clearAllContext();
      
      // Clear vision file
      await AIService.clearVisionFile();
      
      // Clear categories
      await categoryManager.clearCategories();
      
      // Clear progress paths
      await progressPathManager.clearAllProgressPaths();
      
      // Reset local state
      setActiveTabs([]);
      setMessages({});
      setGoals([
        { id: '1', title: 'CSE201 Project 4', goalCount: 0, completedCount: 0, type: 'output' },
        { id: '2', title: '$5K in MRR', goalCount: 0, completedCount: 0, type: 'output' },
        { id: '3', title: 'Rest and Sleep', goalCount: 0, completedCount: 0, type: 'input' },
        { id: '4', title: 'Exercise', goalCount: 0, completedCount: 0, type: 'input' },
      ]);
      
      Alert.alert('Reset Complete', 'All data has been cleared. You can start fresh.');
    } catch (error) {
      console.error('Error resetting all chats:', error);
      Alert.alert('Reset Error', 'There was an error clearing the data. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.cardRaised, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Planning Lab</Text>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Input-Output Schematic</Text>
          </View>
          <TouchableOpacity 
            style={[styles.resetButton, { backgroundColor: colors.accent }]}
            onPress={resetAllChats}
          >
            <Text style={styles.resetButtonText}>Reset All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Output Section */}
        <View style={[styles.outputSection, { backgroundColor: colors.card, shadowColor: '#000' }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Outputs (Results)</Text>
          <AddCategoryButton type="output" onAdd={addGoal} colors={colors} />
          {outputGoals.map((goal) => (
            <CategoryCard 
              key={goal.id} 
              goal={goal} 
              onChatClick={handleChatClick} 
              onCardClick={handleCardClick} 
              colors={colors}
            />
          ))}
        </View>

        <View style={styles.arrowContainer}>
          <Arrow direction="down" colors={colors} />
        </View>

        {/* Central Hub */}
        <View style={styles.centralSection}>
          <CentralHub 
            onChatClick={handleCentralChatClick} 
            colors={colors} 
            hasNewMessages={(messages['central-hub']?.length || 0) > lastCheckedMessageCount}
          />
        </View>

        <View style={styles.arrowContainer}>
          <Arrow direction="down" colors={colors} />
        </View>

        {/* Input Section */}
        <View style={[styles.inputSection, { backgroundColor: colors.card, shadowColor: '#000' }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Inputs (Resources)</Text>
          <AddCategoryButton type="input" onAdd={addGoal} colors={colors} />
          {inputGoals.map((goal) => (
            <CategoryCard 
              key={goal.id} 
              goal={goal} 
              onChatClick={handleChatClick} 
              onCardClick={handleCardClick} 
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add {newGoalType === 'input' ? 'Input' : 'Output'} Category</Text>
            <TextInput
              style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]}
              placeholder="Category name"
              placeholderTextColor={isDarkMode ? '#9CA3AF' : '#666'}
              value={newGoalTitle}
              onChangeText={setNewGoalTitle}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.muted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.addButtonModal, { backgroundColor: colors.accent }]}
                onPress={handleAddGoal}
              >
                <Text style={styles.addButtonTextModal}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal Detail Modal */}
      <Modal
        visible={showGoalDetailModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedGoal && (
          <GoalDetailScreen
            categoryTitle={selectedGoal.title}
            categoryType={selectedGoal.type}
            onBack={() => setShowGoalDetailModal(false)}
            onChatClick={() => { setShowGoalDetailModal(false); handleChatClick(selectedGoal); }}
          />
        )}
      </Modal>

      {/* Chat Panel */}
      <ChatPanel
        isVisible={showChatPanel}
        onClose={() => setShowChatPanel(false)}
        activeTabs={activeTabs}
        messages={messages}
        onSendMessage={handleSendMessage}
        onUpdateTabs={handleUpdateTabs}
        requestedActiveTabId={requestedActiveTabId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#666' },
  resetButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  resetButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingVertical: 20, paddingHorizontal: 20 },
  arrowsLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  outputSection: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  inputSection: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 16, textAlign: 'center' },
  centralSection: { alignItems: 'center', marginVertical: 30 },
  centralHubContainer: { position: 'relative', alignItems: 'center' },
  centralHubSvg: { backgroundColor: '#fff', borderRadius: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  centralChatButton: { position: 'absolute', top: -10, right: -10, backgroundColor: '#8B5CF6', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  centralChatButtonText: { fontSize: 16, color: '#fff' },
  categoryCard: { flexDirection: 'row', backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 8, alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#000', marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: '#666' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e9ecef', borderRadius: 3, marginRight: 8, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#666', fontWeight: '500', minWidth: 30 },
  chatButton: { backgroundColor: '#8B5CF6', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  chatButtonText: { fontSize: 14, color: '#fff' },
  addButton: { backgroundColor: '#e9ecef', borderRadius: 8, padding: 12, marginBottom: 16 },
  addButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  addButtonIcon: { fontSize: 18, fontWeight: 'bold', color: '#666', marginRight: 8 },
  addButtonText: { fontSize: 16, color: '#666', textTransform: 'lowercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '80%', maxWidth: 300 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 16, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 4 },
  cancelButton: { backgroundColor: '#f8f9fa' },
  cancelButtonText: { color: '#666', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  addButtonModal: { backgroundColor: '#8B5CF6' },
  addButtonTextModal: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  arrowContainer: { alignItems: 'center', marginVertical: 10 },
  arrow: { alignItems: 'center' },
  arrowUp: { transform: [{ rotate: '0deg' }] },
  arrowDown: { transform: [{ rotate: '180deg' }] },
  arrowLine: { width: 2, height: 30, backgroundColor: '#666' },
  arrowHead: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#666' },
  arrowHeadUp: { transform: [{ rotate: '0deg' }] },
  arrowHeadDown: { transform: [{ rotate: '180deg' }] },
  notificationBadge: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF4444', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  notificationBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
}); 