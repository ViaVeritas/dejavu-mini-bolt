import React from 'react';
import { MessageCircle } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  goalCount: number;
  type: 'input' | 'output';
}

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  return (
    <div className="bg-card border-2 border-border rounded-xl p-4 flex items-center justify-between">
      <div>
        <h3 className="font-medium text-sm">{goal.title}</h3>
        <p className="text-xs text-muted-foreground">{goal.goalCount} goals</p>
      </div>
      <button className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center">
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}