import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useDarkMode } from '../App';
import { aiService } from '../utils/aiService';
import { eventBus, CategoryCreationEvent } from '../utils/eventBus';
import { getThemeColors } from '../config/theme';
import { DEFAULT_INITIAL_MESSAGE } from '../config/defaultGoals';

interface StageProgress {
  mainStage: 'SETUP' | 'EXECUTION' | 'REVIEW';
  progress: number;
  currentPhase?: string;
  dailyPhase?: string;
  reviewPhase?: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export default function ChatScreen() {
  const { isDarkMode } = useDarkMode();
  const palette = getThemeColors(isDarkMode);

  const [messages, setMessages] = useState<Message[]>([DEFAULT_INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stageProgress, setStageProgress] = useState<StageProgress>({
    mainStage: 'SETUP',
    progress: 0,
    currentPhase: 'Understanding'
  });
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize AI service on component mount
  useEffect(() => {
    const initAI = async () => {
      const isConfigured = await aiService.initialize();
      if (!isConfigured) {
        // console.log('AI service not configured - using fallback responses');
      }
    };
    initAI();
  }, []);

  // Listen for category creation events
  useEffect(() => {
    const handleCategoryCreated = (event: CategoryCreationEvent) => {
      // Add a message telling the user to check the Lab screen
      const labMessage: Message = {
        id: Date.now().toString(),
        text: "🎯 Perfect! I've organized your strategy into categories. Navigate to the Lab screen to see your personalized categories and start working on your progress paths.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, labMessage]);
    };

    eventBus.on('CATEGORY_CREATED', handleCategoryCreated);

    return () => {
      eventBus.off('CATEGORY_CREATED', handleCategoryCreated);
    };
  }, []);

  const sendMessage = async () => {
    // console.log('🔴 CHATSCREEN sendMessage called with:', inputText.trim());
    if (inputText.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      // Add user message
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsLoading(true);

      // Add loading message
      const loadingMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '',
        isUser: false,
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages(prev => [...prev, loadingMessage]);

      try {
        // Get conversation history for context
        const conversationHistory = messages
          .filter(msg => !msg.isLoading)
          .map(msg => ({
            role: msg.isUser ? 'user' as const : 'assistant' as const,
            content: msg.text
          }));

        // Send to viaRAG.ai with setup chat type
        // console.log('🔴 ABOUT TO CALL aiService.sendMessage with:', userMessage.text);
        let aiResponse;
        try {
          aiResponse = await aiService.sendMessage(
            userMessage.text,
            'User is chatting with their future self assistant',
            conversationHistory,
            { type: 'setup' }
          );
          // console.log('🔴 aiService.sendMessage completed successfully');
        } catch (error) {
          console.error('🔴 ERROR in aiService.sendMessage:', error);
          throw error;
        }

        // Update stage progress based on AI response
        updateStageProgress(aiResponse.response);

        // Remove loading message and add AI response
        setMessages(prev => {
          const withoutLoading = prev.filter(msg => !msg.isLoading);
          return [...withoutLoading, {
            id: (Date.now() + 2).toString(),
            text: aiResponse.response,
            isUser: false,
            timestamp: new Date(),
          }];
        });

      } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove loading message and add error response
        setMessages(prev => {
          const withoutLoading = prev.filter(msg => !msg.isLoading);
          return [...withoutLoading, {
            id: (Date.now() + 2).toString(),
            text: "I'm having trouble connecting right now. Please try again in a moment.",
            isUser: false,
            timestamp: new Date(),
          }];
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const updateStageProgress = (aiResponse: string) => {
    // Extract stage and phase information from AI response
    const stageMatch = aiResponse.match(/\[(SETUP|EXECUTION|REVIEW)\s*•\s*(\d+)%\]/);
    const phaseMatch = aiResponse.match(/\[Phase\s+(\d+)\/5\s*•\s*(\d+)%\]/);
    const dailyMatch = aiResponse.match(/\[Day\s+(\d+)\/6\s*•\s*(\d+)%\]/);
    const reviewMatch = aiResponse.match(/\[Review\s+(\d+)\/6\s*•\s*(\d+)%\]/);
    
    if (stageMatch) {
      const mainStage = stageMatch[1] as 'SETUP' | 'EXECUTION' | 'REVIEW';
      const progress = parseInt(stageMatch[2]);
      
      setStageProgress(prev => ({
        ...prev,
        mainStage,
        progress
      }));
    } else if (phaseMatch) {
      const phaseNum = parseInt(phaseMatch[1]);
      const progress = parseInt(phaseMatch[2]);
      const phaseNames = ['Understanding', 'Weight', 'Vision', 'Maintenance', 'Integration'];
      
      setStageProgress(prev => ({
        ...prev,
        progress,
        currentPhase: phaseNames[phaseNum - 1]
      }));
    } else if (dailyMatch) {
      const dayNum = parseInt(dailyMatch[1]);
      const progress = parseInt(dailyMatch[2]);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      
      setStageProgress(prev => ({
        ...prev,
        progress,
        dailyPhase: dayNames[dayNum - 1]
      }));
    } else if (reviewMatch) {
      const reviewNum = parseInt(reviewMatch[1]);
      const progress = parseInt(reviewMatch[2]);
      const reviewNames = ['Sunday Review', 'Monday Review', 'Tuesday Review', 'Wednesday Review', 'Thursday Review', 'Friday Review'];
      
      setStageProgress(prev => ({
        ...prev,
        progress,
        reviewPhase: reviewNames[reviewNum - 1]
      }));
    }
    
    // Also check if we need to update stage based on current day
    const today = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    
    // If it's Saturday, we should be in REVIEW stage
    if (dayOfWeek === 'Saturday') {
      setStageProgress(prev => ({
        ...prev,
        mainStage: 'REVIEW',
        progress: 0
      }));
    }
    // If it's not Saturday and we're past setup, we should be in EXECUTION stage
    else if (stageProgress.mainStage === 'SETUP' && stageProgress.progress >= 100) {
      const executionProgress = {
        'Sunday': 16.67,
        'Monday': 33.33,
        'Tuesday': 50,
        'Wednesday': 66.67,
        'Thursday': 83.33,
        'Friday': 100
      };
      
      setStageProgress(prev => ({
        ...prev,
        mainStage: 'EXECUTION',
        progress: executionProgress[dayOfWeek as keyof typeof executionProgress] || 0
      }));
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: palette.bg }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { backgroundColor: palette.card, borderBottomColor: palette.border }]}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Future Self Chat</Text>
        <Text style={[styles.headerSubtitle, { color: palette.muted }]}>Let your future guide you</Text>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, { color: palette.muted }]}>
              {stageProgress.mainStage}
            </Text>
            <Text style={[styles.progressPercentage, { color: palette.accent }]}>
              {stageProgress.mainStage === 'EXECUTION' 
                ? `Week 1 • ${Math.round(stageProgress.progress)}% complete`
                : `${Math.round(stageProgress.progress)}%`
              }
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: palette.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: palette.accent,
                  width: `${stageProgress.progress}%`
                }
              ]} 
            />
          </View>
        </View>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble,
              message.isUser 
                ? [styles.userMessage, { backgroundColor: palette.accent }] 
                : [styles.aiMessage, { backgroundColor: palette.card, borderColor: palette.border }]
            ]}
          >
            {message.isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={palette.accent} />
                <Text style={[styles.loadingText, { color: palette.muted }]}>
                  Future you is thinking...
                </Text>
              </View>
            ) : (
              <>
                <Text style={[
                  styles.messageText,
                  message.isUser ? { color: '#fff' } : { color: palette.text }
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.timestamp,
                  message.isUser ? { color: '#fff', textAlign: 'right' } : { color: palette.muted }
                ]}>
                  {formatTime(message.timestamp)}
                </Text>
              </>
            )}
          </View>
        ))}
      </ScrollView>
      
      <View style={[styles.inputContainer, { backgroundColor: palette.card, borderTopColor: palette.border }]}>
        <TextInput
          style={[
            styles.textInput,
            { 
              backgroundColor: palette.bg, 
              color: palette.text, 
              borderColor: palette.border 
            }
          ]}
          placeholder="Ask your future self..."
          placeholderTextColor={palette.muted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: inputText.trim() && !isLoading ? palette.accent : palette.inactive 
            }
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 16,
    padding: 16,
    borderRadius: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
}); 