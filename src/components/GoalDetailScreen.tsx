import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Plus, Calendar, Clock, Check, Edit2, Trash2 } from 'lucide-react';
import { Goal, IndividualGoal } from '../types/Goal';

interface GoalDetailScreenProps {
  goal: Goal;
  onBack: () => void;
}

export function GoalDetailScreen({ goal, onBack }: GoalDetailScreenProps) {
  // Mock individual goals for now - in a real app this would come from a database
  const [individualGoals, setIndividualGoals] = useState<IndividualGoal[]>([
    {
      id: '1',
      title: 'Complete project proposal',
      description: 'Write and submit the initial project proposal',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      completed: true,
      categoryId: goal.id
    },
    {
      id: '2',
      title: 'Set up development environment',
      description: 'Install necessary tools and dependencies',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      completed: true,
      categoryId: goal.id
    },
    {
      id: '3',
      title: 'Design database schema',
      description: 'Create the database structure and relationships',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      completed: false,
      categoryId: goal.id
    },
    {
      id: '4',
      title: 'Implement core features',
      description: 'Build the main functionality of the application',
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      completed: false,
      categoryId: goal.id
    },
    {
      id: '5',
      title: 'Testing and debugging',
      description: 'Thoroughly test the application and fix any issues',
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      completed: false,
      categoryId: goal.id
    }
  ]);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDeadline, setEditDeadline] = useState('');

  const completedGoals = individualGoals.filter(g => g.completed);
  const progressPercentage = (completedGoals.length / individualGoals.length) * 100;

  const addNewGoal = () => {
    if (!newGoalTitle.trim()) return;

    const newGoal: IndividualGoal = {
      id: Date.now().toString(),
      title: newGoalTitle,
      description: newGoalDescription,
      deadline: newGoalDeadline ? new Date(newGoalDeadline) : undefined,
      completed: false,
      categoryId: goal.id
    };

    setIndividualGoals(prev => [...prev, newGoal]);
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalDeadline('');
    setIsAddingGoal(false);
  };

  const toggleGoalCompletion = (goalId: string) => {
    setIndividualGoals(prev => 
      prev.map(g => 
        g.id === goalId ? { ...g, completed: !g.completed } : g
      )
    );
  };

  const deleteGoal = (goalId: string) => {
    setIndividualGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const startEditingGoal = (goal: IndividualGoal) => {
    setEditingGoal(goal.id);
    setEditTitle(goal.title);
    setEditDescription(goal.description || '');
    setEditDeadline(goal.deadline ? goal.deadline.toISOString().slice(0, 16) : '');
  };

  const saveEditedGoal = () => {
    if (!editingGoal || !editTitle.trim()) return;

    setIndividualGoals(prev => 
      prev.map(g => 
        g.id === editingGoal 
          ? {
              ...g,
              title: editTitle,
              description: editDescription,
              deadline: editDeadline ? new Date(editDeadline) : undefined
            }
          : g
      )
    );
    
    setEditingGoal(null);
    setEditTitle('');
    setEditDescription('');
    setEditDeadline('');
  };

  const cancelEditing = () => {
    setEditingGoal(null);
    setEditTitle('');
    setEditDescription('');
    setEditDeadline('');
  };

  const formatDeadline = (deadline?: Date) => {
    if (!deadline) return 'No deadline';
    return deadline.toLocaleDateString() + ' ' + deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="font-medium">{goal.title}</h1>
            <p className="text-sm text-muted-foreground">
              {completedGoals.length} of {individualGoals.length} goals completed
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="p-4 space-y-3">
        {individualGoals.map((individualGoal, index) => (
          <div key={individualGoal.id} className="relative">
            {/* Connection Line */}
            {index < individualGoals.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
            )}
            
            {/* Goal Item */}
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${
              individualGoal.completed 
                ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                : 'bg-card border-border'
            }`}>
              {/* Completion Circle */}
              <button
                onClick={() => toggleGoalCompletion(individualGoal.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 ${
                  individualGoal.completed
                    ? 'bg-green-500 border-green-500'
                    : 'border-muted-foreground hover:border-purple-500'
                }`}
              >
                {individualGoal.completed && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* Goal Content - Editable */}
              <div className="flex-1 min-w-0">
                {editingGoal === individualGoal.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="font-medium"
                    />
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="min-h-16"
                    />
                    <Input
                      type="datetime-local"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveEditedGoal} size="sm">
                        Save
                      </Button>
                      <Button onClick={cancelEditing} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className={`font-medium ${individualGoal.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {individualGoal.title}
                    </h3>
                    {individualGoal.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {individualGoal.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDeadline(individualGoal.deadline)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              {editingGoal !== individualGoal.id && (
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8"
                    onClick={() => startEditingGoal(individualGoal)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 text-destructive hover:text-destructive"
                    onClick={() => deleteGoal(individualGoal.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add New Goal */}
        {isAddingGoal ? (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <Input
              placeholder="Goal title"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
            <Textarea
              placeholder="Goal description (optional)"
              value={newGoalDescription}
              onChange={(e) => setNewGoalDescription(e.target.value)}
              className="min-h-20"
            />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="datetime-local"
                value={newGoalDeadline}
                onChange={(e) => setNewGoalDeadline(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addNewGoal} className="flex-1">
                Add Goal
              </Button>
              <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAddingGoal(true)}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Goal
          </Button>
        )}
      </div>
    </div>
  );
}