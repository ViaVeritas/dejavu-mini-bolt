import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  Keyboard
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { CalendarDays, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { 
  Path, 
  Circle, 
  Rect,
  G,
  Line
} from 'react-native-svg';
import { useDarkMode } from '../App';

// Visual constants to keep alignment precise
const PATH_PADDING = 20;
const LINE_WIDTH = 2;
const LINE_HALF = LINE_WIDTH / 2;
const START_MARKER_SIZE = 22;
const START_MARKER_STROKE = 3;
const START_TOP_SPACING = 72; // Position circle closer to the first goal (more space above)
const END_MARKER_SIZE = 24;
const END_MARKER_STROKE = 3;

// Utility functions for deadline formatting
const formatDeadline = (deadline: Date) => {
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff < 0) return 'Overdue';
  if (daysDiff === 0) return `Today at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (daysDiff === 1) return `Tomorrow at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (daysDiff <= 7) return `${daysDiff} days`;
  
  return `${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const getDeadlineColor = (deadline: Date, completed: boolean) => {
  if (completed) return '#4CAF50';
  
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff < 0) return '#ff4444'; // Overdue - red
  if (daysDiff <= 1) return '#ff8800'; // Due today/tomorrow - orange
  if (daysDiff <= 3) return '#ffaa00'; // Due within 3 days - amber
  return '#666'; // Normal deadline - gray
};

interface Goal {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
  deadline?: Date;
}

interface GoalDetailScreenProps {
  categoryTitle: string;
  categoryType: 'input' | 'output';
  onBack: () => void;
  onChatClick: () => void;
}

// Track layouts for precise connector placement
type RowLayout = { y: number };
type NodeLayout = { x: number; width: number; height: number };

// Goal Node Component
const GoalNode = ({ goal, onToggle, onEdit, colors, onLayout }: {
  goal: Goal;
  onToggle: (goalId: string) => void;
  onEdit: (goal: Goal) => void;
  colors: any;
  onLayout: (e: any) => void;
}) => {
  return (
    <View style={styles.goalNodeContainer}>
      <TouchableOpacity 
        style={[
          styles.goalNode, 
          { backgroundColor: colors.card, borderColor: colors.border, shadowColor: '#000' },
          goal.completed && { borderColor: '#4CAF50', backgroundColor: colors.card }
        ]}
        onPress={() => onToggle(goal.id)}
        onLayout={onLayout}
      >
        <View style={styles.goalNodeContent}>
          <Text style={[styles.goalNodeTitle, { color: goal.completed ? '#4CAF50' : colors.text }, goal.completed && styles.goalNodeTitleCompleted]}>
            {goal.title}
          </Text>
          <Text style={[styles.goalNodeDescription, { color: goal.completed ? '#888' : colors.muted }]}>
            {goal.description}
          </Text>
          {goal.deadline && (
            <Text style={[styles.goalNodeDeadline, { color: getDeadlineColor(goal.deadline, goal.completed) }]}>
              📅 {formatDeadline(goal.deadline)}
            </Text>
          )}
        </View>
        <View style={[styles.goalNodeIcon, { backgroundColor: goal.completed ? '#4CAF50' : colors.surface }]}>
          <Text style={[styles.goalNodeIconText, { color: colors.muted }]}>
            {goal.completed ? '✓' : '○'}
          </Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.editButton, { backgroundColor: colors.accent }]}
        onPress={() => onEdit(goal)}
      >
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function GoalDetailScreen({ categoryTitle, categoryType, onBack, onChatClick }: GoalDetailScreenProps) {
  const { isDarkMode } = useDarkMode();
  const colors = isDarkMode
    ? { bg: '#111827', card: '#1F2937', text: '#F9FAFB', muted: '#9CA3AF', border: '#374151', surface: '#111827', accent: '#8B5CF6' }
    : { bg: '#f8f9fa', card: '#fff', text: '#333', muted: '#666', border: '#e0e0e0', surface: '#f0f0f0', accent: '#8B5CF6' };

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  
  // Deadline state
  const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(undefined);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Layout tracking for connector placement
  const [rowLayouts, setRowLayouts] = useState<Record<string, RowLayout>>({});
  const [nodeLayouts, setNodeLayouts] = useState<Record<string, NodeLayout>>({});
  const [createdAt, setCreatedAt] = useState<string>('');

  useEffect(() => { loadGoals(); }, []);
  useEffect(() => { if (!isLoading) saveGoals(); }, [goals, isLoading]);
  
  
  useEffect(() => {
    // load or set createdAt once
    (async () => {
      const key = `category_created_${categoryTitle}_${categoryType}`;
      let value = await AsyncStorage.getItem(key);
      if (!value) {
        value = new Date().toISOString();
        await AsyncStorage.setItem(key, value);
      }
      setCreatedAt(value);
    })();
  }, [categoryTitle, categoryType]);

  const loadGoals = async () => {
    try {
      const storageKey = `goals_${categoryTitle}_${categoryType}`;
      const savedGoals = await AsyncStorage.getItem(storageKey);
      if (savedGoals) {
        const parsedGoals = JSON.parse(savedGoals);
        const goalsWithDates = parsedGoals;
        setGoals(goalsWithDates);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    } finally { 
      setIsLoading(false); 
    }
  };

  const saveGoals = async () => { 
    try { 
      const storageKey = `goals_${categoryTitle}_${categoryType}`; 
      await AsyncStorage.setItem(storageKey, JSON.stringify(goals)); 
    } catch (e) { 
      console.error('Error saving goals:', e); 
    } 
  };

  const toggleGoal = (goalId: string) => { 
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g)); 
  };

  const handleDateConfirm = (date: Date) => {
    const currentDate = selectedDeadline || new Date();
    const newDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      currentDate.getHours(),
      currentDate.getMinutes()
    );
    setSelectedDeadline(newDate);
    setDatePickerVisible(false);
  };

  const handleTimeConfirm = (time: Date) => {
    const currentDate = selectedDeadline || new Date();
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate(),
      time.getHours(),
      time.getMinutes()
    );
    setSelectedDeadline(newDate);
    setTimePickerVisible(false);
  };

  const addGoal = () => {
    if (newGoalTitle.trim()) {
      const newGoal: Goal = { 
        id: Date.now().toString(), 
        title: newGoalTitle.trim(), 
        description: newGoalDescription.trim(), 
        completed: false, 
        order: goals.length + 1,
        deadline: selectedDeadline
      };
      setGoals(prev => [...prev, newGoal]);
      
      // Reset state
      setNewGoalTitle(''); 
      setNewGoalDescription(''); 
      setSelectedDeadline(undefined);
      setShowAddModal(false);
    }
  };

  const editGoal = (goal: Goal) => { 
    setEditingGoal(goal); 
    setNewGoalTitle(goal.title); 
    setNewGoalDescription(goal.description); 
    setSelectedDeadline(goal.deadline);
    setShowEditModal(true); 
  };

  const saveEdit = () => { 
    if (editingGoal && newGoalTitle.trim()) { 
      setGoals(prev => prev.map(g => g.id === editingGoal.id ? { 
        ...g, 
        title: newGoalTitle.trim(), 
        description: newGoalDescription.trim(),
        deadline: selectedDeadline
      } : g)); 
      
      // Reset all state
      setNewGoalTitle(''); 
      setNewGoalDescription(''); 
      setSelectedDeadline(undefined);
      setEditingGoal(null); 
      setShowEditModal(false);
    } 
  };

  const deleteGoal = (goalId: string) => { 
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' }, 
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => { 
          setGoals(prev => prev.filter(g => g.id !== goalId)); 
        } 
      }
    ]); 
  };

  const completedCount = goals.filter(goal => goal.completed).length;
  const progressPercentage = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;



  // Build connector specs from measured layouts
  const connectorSpecs = React.useMemo(() => {
    const specs: Array<{ key: string; left: number; top: number; height: number; solid: boolean }> = [];
    if (goals.length === 0) return specs;

    // Adjacent goal connectors
    for (let i = 0; i < goals.length - 1; i += 1) {
      const gA = goals[i];
      const gB = goals[i + 1];
      const rowA = rowLayouts[gA.id];
      const nodeA = nodeLayouts[gA.id];
      const rowB = rowLayouts[gB.id];
      const nodeB = nodeLayouts[gB.id];
      if (!rowA || !nodeA || !rowB || !nodeB) continue;
      const gapTop = rowA.y + nodeA.height; // bottom of A card
      const gapBottom = rowB.y; // top of next row
      const top = gapTop + 6; // extend just a bit below A
      const height = Math.max(8, gapBottom - top - 6); // end a bit above B
      const centerX = PATH_PADDING + nodeA.x + nodeA.width / 2 - LINE_HALF; // center the 2px line on cx
      specs.push({ key: `${gA.id}->${gB.id}`, left: centerX, top, height, solid: gA.completed && gB.completed });
    }

    const allCompleted = goals.every(g => g.completed);
    const first = goals[0];
    const last = goals[goals.length - 1];

    // Measure and create start connector (O -> first goal)
    let startHeightForParity: number | null = null;
    if (first && rowLayouts[first.id] && nodeLayouts[first.id]) {
      const row = rowLayouts[first.id];
      const node = nodeLayouts[first.id];
      const cx = PATH_PADDING + node.x + node.width / 2;
      const anchorTop = Math.max(row.y - START_TOP_SPACING, 0);
      // Start just below the circle stroke bottom for visibility
      const top = anchorTop + START_MARKER_SIZE - START_MARKER_STROKE / 2 + 2;
      const available = Math.max(0, row.y - top); // remaining gap to first card
      const height = Math.max(8, available - 1); // extend to the card edge (no visible gap)
      startHeightForParity = height;
      const solid = !!first.completed; // solid if first goal completed
      specs.push({ key: `start->${first.id}`, left: cx - LINE_HALF, top, height, solid });
    }

    // Connector from last goal to end marker (make its height match the start connector)
    if (last && rowLayouts[last.id] && nodeLayouts[last.id]) {
      const row = rowLayouts[last.id];
      const node = nodeLayouts[last.id];
      const cx = PATH_PADDING + node.x + node.width / 2;
      const lineTop = row.y + node.height + 8; // start just below last goal
      const anchorTop = row.y + node.height + 20; // where X will be drawn
      const available = Math.max(0, anchorTop - lineTop - END_MARKER_STROKE / 2);
      const target = startHeightForParity ?? available; // fall back if start height missing
      const height = Math.max(8, Math.min(available, target));
      const solid = allCompleted; // solid only when all goals completed
      specs.push({ key: `${last.id}->end`, left: cx - LINE_HALF, top: lineTop, height, solid });
    }

    return specs;
  }, [goals, rowLayouts, nodeLayouts]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={[styles.backButtonText, { color: colors.accent }]}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>{categoryTitle}</Text>
            <Text style={[styles.categoryType, { color: colors.muted }]}> 
              {categoryType === 'input' ? 'Input Category' : 'Output Category'}
            </Text>
          </View>
          <TouchableOpacity style={styles.chatButton} onPress={onChatClick}>
            <Text style={styles.chatButtonText}>💬</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading goals...</Text>
        </View>
      </View>
    );
  }

  const createdAtText = createdAt ? new Date(createdAt).toLocaleDateString() : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>{categoryTitle}</Text>
          <Text style={[styles.categoryType, { color: colors.muted }]}> 
            {categoryType === 'input' ? 'Input Category' : 'Output Category'}
          </Text>
        </View>
        <TouchableOpacity style={styles.chatButton} onPress={onChatClick}>
          <Text style={styles.chatButtonText}>💬</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.progressContainer, { backgroundColor: colors.card }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%`, backgroundColor: '#4CAF50' }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.muted }]}> 
          {completedCount} of {goals.length} goals completed
        </Text>
      </View>

      <ScrollView style={styles.goalsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.pathContainer}>
          {/* Connectors overlay */}
          <View style={styles.connectorsOverlay} pointerEvents="none">
            {/* Start anchor (O) */}
            {goals[0] && nodeLayouts[goals[0].id] && rowLayouts[goals[0].id] && (() => {
              const first = goals[0];
              const row = rowLayouts[first.id]!;
              const node = nodeLayouts[first.id]!;
              const cx = PATH_PADDING + node.x + node.width / 2;
              const top = Math.max(row.y - START_TOP_SPACING, 0);
              const size = START_MARKER_SIZE;
              const ringColor = first.completed ? '#4CAF50' : colors.border;
              const fillColor = colors.surface;
              return (
                <>
                  <Svg width={size} height={size} style={{ position: 'absolute', left: cx - size / 2, top }}>
                    <Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill={fillColor} stroke={ringColor} strokeWidth={START_MARKER_STROKE} />
                  </Svg>
                  <Text
                    style={{
                      position: 'absolute',
                      left: cx + START_MARKER_SIZE / 2 + 8,
                      top: top + START_MARKER_SIZE / 2 - 8, // vertically align with circle center
                      color: colors.muted,
                      fontSize: 12,
                    }}
                  >
                    {createdAtText ? `Created ${createdAtText}` : 'Category path'}
                  </Text>
                </>
              );
            })()}

            {connectorSpecs.map(spec => (
              <View
                key={spec.key}
                style={{
                  position: 'absolute',
                  left: spec.left,
                  top: spec.top,
                  height: spec.height,
                  borderLeftWidth: 2,
                  borderLeftColor: spec.solid ? '#4CAF50' : colors.border,
                  borderStyle: spec.solid ? 'solid' as const : 'dashed' as const,
                }}
              />
            ))}

            {/* End marker (X) */}
            {goals.length > 0 && (() => {
              const allCompleted = goals.every(g => g.completed);
              const last = goals[goals.length - 1];
              const row = rowLayouts[last.id];
              const node = nodeLayouts[last.id];
              if (!row || !node) return null;
              const cx = PATH_PADDING + node.x + node.width / 2;
              const top = row.y + node.height + 20;
              const size = END_MARKER_SIZE;
              const stroke = allCompleted ? '#4CAF50' : colors.border;
              return (
                <>
                  <Svg width={size} height={size} style={{ position: 'absolute', left: cx - size / 2, top }}>
                    <Line x1={2} y1={2} x2={size - 2} y2={size - 2} stroke={stroke} strokeWidth={END_MARKER_STROKE} />
                    <Line x1={size - 2} y1={2} x2={2} y2={size - 2} stroke={stroke} strokeWidth={END_MARKER_STROKE} />
                  </Svg>
                  <Text style={{ position: 'absolute', left: cx + 12, top, color: colors.muted, fontSize: 12 }}>
                    Dig here for treasure!
                  </Text>
                </>
              );
            })()}
          </View>

          {goals.map((goal) => (
            <View
              key={goal.id}
              style={styles.goalRow}
              onLayout={(e) => {
                const { y } = e.nativeEvent.layout;
                setRowLayouts(prev => ({ ...prev, [goal.id]: { y } }));
              }}
            >
              <GoalNode
                goal={goal}
                onToggle={toggleGoal}
                onEdit={editGoal}
                colors={colors}
                onLayout={(e) => {
                  const { x, width, height } = e.nativeEvent.layout;
                  setNodeLayouts(prev => ({ ...prev, [goal.id]: { x, width, height } }));
                }}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.addGoalButton, { backgroundColor: colors.accent }]} 
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addGoalButtonText}>+ Add New Goal</Text>
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Goal</Text>
                  <TextInput 
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]} 
                    placeholder="Goal title" 
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#999'} 
                    value={newGoalTitle} 
                    onChangeText={setNewGoalTitle} 
                  />
                  <TextInput 
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]} 
                    placeholder="Goal description (optional)" 
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#999'} 
                    value={newGoalDescription} 
                    onChangeText={setNewGoalDescription} 
                    multiline 
                  />
                  
                  {/* Deadline Section */}
                  <View style={styles.deadlineSection}>
                    <Text style={[styles.deadlineLabel, { color: colors.text }]}>Set Deadline (Optional)</Text>
                    
                    {/* Deadline Display */}
                    {selectedDeadline && (
                      <View style={[styles.deadlineDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.deadlineDisplayText, { color: colors.text }]}>
                          📅 {formatDeadline(selectedDeadline)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Date and Time Buttons */}
                    <View style={styles.dateTimeButtons}>
                      <TouchableOpacity 
                        style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setDatePickerVisible(true)}
                      >
                        <CalendarDays size={16} color={colors.accent} />
                        <Text style={[styles.dateTimeButtonText, { color: colors.text }]}>
                          {selectedDeadline ? selectedDeadline.toLocaleDateString() : 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setTimePickerVisible(true)}
                      >
                        <Clock size={16} color={colors.accent} />
                        <Text style={[styles.dateTimeButtonText, { color: colors.text }]}>
                          {selectedDeadline ? selectedDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Clear Deadline Button */}
                    {selectedDeadline && (
                      <TouchableOpacity 
                        style={[styles.clearDeadlineButton, { backgroundColor: colors.surface }]}
                        onPress={() => setSelectedDeadline(undefined)}
                      >
                        <Text style={[styles.clearDeadlineText, { color: colors.muted }]}>Clear Deadline</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.surface }]} 
                      onPress={() => { 
                        setShowAddModal(false); 
                        setSelectedDeadline(undefined);
                      }}
                    >
                      <Text style={[styles.modalButtonText, { color: colors.muted }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.addButtonModal, { backgroundColor: colors.accent }]} 
                      onPress={addGoal}
                    >
                      <Text style={styles.addButtonTextModal}>Add</Text>
                    </TouchableOpacity>
                  </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Goal</Text>
                  <TextInput 
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]} 
                    placeholder="Goal title" 
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#999'} 
                    value={newGoalTitle} 
                    onChangeText={setNewGoalTitle} 
                  />
                  <TextInput 
                    style={[styles.modalInput, { borderColor: colors.border, color: colors.text }]} 
                    placeholder="Goal description (optional)" 
                    placeholderTextColor={isDarkMode ? '#9CA3AF' : '#999'} 
                    value={newGoalDescription} 
                    onChangeText={setNewGoalDescription} 
                    multiline 
                  />
                  
                  {/* Deadline Section */}
                  <View style={styles.deadlineSection}>
                    <Text style={[styles.deadlineLabel, { color: colors.text }]}>Edit Deadline</Text>
                    
                    {/* Deadline Display */}
                    {selectedDeadline && (
                      <View style={[styles.deadlineDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.deadlineDisplayText, { color: colors.text }]}>
                          📅 {formatDeadline(selectedDeadline)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Date and Time Buttons */}
                    <View style={styles.dateTimeButtons}>
                      <TouchableOpacity 
                        style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setDatePickerVisible(true)}
                      >
                        <CalendarDays size={16} color={colors.accent} />
                        <Text style={[styles.dateTimeButtonText, { color: colors.text }]}>
                          {selectedDeadline ? selectedDeadline.toLocaleDateString() : 'Select Date'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.dateTimeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setTimePickerVisible(true)}
                      >
                        <Clock size={16} color={colors.accent} />
                        <Text style={[styles.dateTimeButtonText, { color: colors.text }]}>
                          {selectedDeadline ? selectedDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Clear Deadline Button */}
                    {selectedDeadline && (
                      <TouchableOpacity 
                        style={[styles.clearDeadlineButton, { backgroundColor: colors.surface }]}
                        onPress={() => setSelectedDeadline(undefined)}
                      >
                        <Text style={[styles.clearDeadlineText, { color: colors.muted }]}>Clear Deadline</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.accent }]} 
                      onPress={() => { if (editingGoal) { deleteGoal(editingGoal.id); setShowEditModal(false); } }}
                    >
                      <Text style={styles.addButtonTextModal}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, { backgroundColor: colors.surface }]} 
                      onPress={() => { 
                        setShowEditModal(false);
                        setSelectedDeadline(undefined); 
                      }}
                    >
                      <Text style={[styles.modalButtonText, { color: colors.muted }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.addButtonModal, { backgroundColor: colors.accent }]} 
                      onPress={saveEdit}
                    >
                      <Text style={styles.addButtonTextModal}>Save</Text>
                    </TouchableOpacity>
                  </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setDatePickerVisible(false)}
        minimumDate={new Date()}
      />
      
      {/* Time Picker */}
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={() => setTimePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 10 },
  backButtonText: { fontSize: 16, color: '#8B5CF6', fontWeight: '500' },
  headerContent: { flex: 1, marginLeft: 10 },
  categoryTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  categoryType: { fontSize: 14, color: '#666', marginTop: 2 },
  chatButton: { padding: 10 },
  chatButtonText: { fontSize: 20 },
  progressContainer: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
  progressBar: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4 },
  progressText: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
  goalsContainer: { flex: 1 },
  pathContainer: { paddingHorizontal: 20, paddingTop: 112, paddingBottom: 24, position: 'relative' },
  connectorsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  goalRow: { position: 'relative', marginBottom: 28 },
  goalNodeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 },
  goalNode: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 20, marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: '#e0e0e0' },
  goalNodeCompleted: { borderColor: '#4CAF50', backgroundColor: '#f8fff8' },
  goalNodeContent: { flex: 1 },
  goalNodeTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  goalNodeTitleCompleted: { color: '#4CAF50', textDecorationLine: 'line-through' },
  goalNodeDescription: { fontSize: 14, color: '#666' },
  goalNodeDescriptionCompleted: { color: '#888' },
  goalNodeDeadline: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  goalNodeIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  goalNodeIconCompleted: { backgroundColor: '#4CAF50' },
  goalNodeIconText: { fontSize: 16, color: '#666', fontWeight: 'bold' },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#8B5CF6', borderRadius: 6, marginTop: 8, zIndex: 10 },
  editButtonText: { fontSize: 12, color: '#fff', fontWeight: '500' },
  addGoalButton: { backgroundColor: '#8B5CF6', marginHorizontal: 20, marginVertical: 20, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  addGoalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, marginHorizontal: 5, alignItems: 'center', backgroundColor: '#f0f0f0' },
  addButtonModal: { backgroundColor: '#8B5CF6' },
  addButtonTextModal: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '500' },
  modalButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
  deleteButton: { backgroundColor: '#ff4444' },
  deleteButtonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666' },
  deadlineSection: { marginBottom: 16 },
  deadlineLabel: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8 },
  deadlineDisplay: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginBottom: 8 },
  deadlineDisplayText: { fontSize: 14, color: '#000', textAlign: 'center' },
  dateTimeButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateTimeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginHorizontal: 4 },
  dateTimeButtonText: { marginLeft: 6, fontSize: 14, color: '#000' },
  clearDeadlineButton: { backgroundColor: '#f8f9fa', borderRadius: 6, padding: 8, alignItems: 'center' },
  clearDeadlineText: { fontSize: 12, color: '#666' },
});
