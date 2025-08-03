import React, { useState } from 'react';
import { Plus, MessageCircle, User } from 'lucide-react';
import { Button } from './ui/button';
import { GoalCard } from './GoalCard';

interface Goal {
  id: string;
  title: string;
  goalCount: number;
  type: 'input' | 'output';
}

export function LabScreen() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: '1', title: 'CSE201 Project 4', goalCount: 13, type: 'output' },
    { id: '2', title: 'Complete database overhaul', goalCount: 10, type: 'output' },
    { id: '3', title: '$5K in MRR', goalCount: 4, type: 'output' },
    { id: '4', title: 'Rest and Sleep', goalCount: 5, type: 'input' },
    { id: '5', title: 'Hydration and Nutrition', goalCount: 4, type: 'input' },
    { id: '6', title: 'Recreation', goalCount: 3, type: 'input' },
  ]);

  const outputGoals = goals.filter(g => g.type === 'output');
  const inputGoals = goals.filter(g => g.type === 'input');

  const addGoal = (type: 'input' | 'output') => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: type === 'output' ? 'New Output Category' : 'New Input Category',
      goalCount: 0,
      type
    };
    
    if (type === 'input') {
      // Add input goals at the beginning (top of the list)
      const otherGoals = goals.filter(g => g.type === 'output');
      const existingInputGoals = goals.filter(g => g.type === 'input');
      setGoals([...otherGoals, newGoal, ...existingInputGoals]);
    } else {
      // Add output goals at the end of output list
      setGoals(prev => [...prev, newGoal]);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-md mx-auto relative px-4 py-6">
        
        {/* Right-side connection line for outputs */}
        <div className="absolute right-4 top-6 w-0.5 bg-border" style={{ height: `${(outputGoals.length + 1) * 72 + 80}px` }}></div>
        
        {/* Left-side connection line for inputs */}
        <div className="absolute left-4 w-0.5 bg-border" style={{ 
          top: `${(outputGoals.length + 1) * 72 + 160}px`, 
          height: `${(inputGoals.length + 1) * 72 + 40}px` 
        }}></div>

        {/* Output Goals */}
        <div className="space-y-4 mb-8">
          {outputGoals.map((goal, index) => (
            <div key={goal.id} className="relative">
              <div className="pr-12">
                <GoalCard goal={goal} />
              </div>
              
              {/* Horizontal line connecting to right side */}
              <div className="absolute top-1/2 right-4 w-8 h-0.5 bg-border transform -translate-y-1/2"></div>
            </div>
          ))}
          
          {/* Add Output Button */}
          <div className="relative">
            <div className="flex justify-center pr-12">
              <Button
                onClick={() => addGoal('output')}
                variant="outline"
                size="sm"
                className="rounded-full flex items-center gap-2"
              >
                <div className="w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                add output category
              </Button>
            </div>
            
            {/* Connection to right side */}
            <div className="absolute top-1/2 right-4 w-8 h-0.5 bg-border transform -translate-y-1/2"></div>
          </div>
        </div>

        {/* Curved connection from right side to central hub */}
        <div className="absolute right-4 w-16 h-16" style={{ top: `${(outputGoals.length + 1) * 72 + 64}px` }}>
          <svg width="64" height="64" className="absolute top-0 right-0">
            <path
              d="M 0 0 Q 0 32 32 32 Q 64 32 64 64"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>

        {/* Central Hub */}
        <div className="flex justify-center mb-8 relative z-10">
          <div className="relative">
            {/* Central AI Hub */}
            <div className="w-20 h-16 bg-card border-2 border-border rounded-xl flex items-center justify-center relative">
              <User className="w-8 h-8 text-muted-foreground" />
              
              {/* Chat Button */}
              <button className="absolute -top-2 -right-2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center">
                <MessageCircle className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Curved connection from central hub to left side */}
        <div className="absolute left-4 w-16 h-16" style={{ top: `${(outputGoals.length + 1) * 72 + 128}px` }}>
          <svg width="64" height="64" className="absolute top-0 left-0">
            <path
              d="M 64 0 Q 64 32 32 32 Q 0 32 0 64"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              fill="none"
            />
          </svg>
        </div>

        {/* Add Input Button */}
        <div className="relative mb-8">
          <div className="flex justify-center pl-12">
            <Button
              onClick={() => addGoal('input')}
              variant="outline"
              size="sm"
              className="rounded-full flex items-center gap-2"
            >
              <div className="w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              add input category
            </Button>
          </div>
          
          {/* Connection to left side */}
          <div className="absolute top-1/2 left-4 w-8 h-0.5 bg-border transform -translate-y-1/2"></div>
        </div>

        {/* Input Goals */}
        <div className="space-y-4">
          {inputGoals.map((goal, index) => (
            <div key={goal.id} className="relative">
              <div className="pl-12">
                <GoalCard goal={goal} />
              </div>
              
              {/* Horizontal line connecting to left side */}
              <div className="absolute top-1/2 left-4 w-8 h-0.5 bg-border transform -translate-y-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}