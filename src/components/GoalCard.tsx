import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Goal } from '../types/Goal';

interface GoalCardProps {
  goal: Goal;
  onChatClick?: (goal: Goal) => void;
  onCardClick?: (goal: Goal) => void;
}

export function GoalCard({ goal, onChatClick, onCardClick }: GoalCardProps) {
  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking chat button
    onChatClick?.(goal);
  };

  const handleCardClick = () => {
    onCardClick?.(goal);
  };

  return (
    <div 
      className="bg-card border-2 border-border rounded-xl p-4 flex items-center justify-between w-56 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleCardClick}
    >
      <div>
        <h3 className="font-medium text-sm">{goal.title}</h3>
        <p className="text-xs text-muted-foreground">{goal.goalCount} goals</p>
      </div>
      <button 
        className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
        onClick={handleChatClick}
      >
        <MessageCircle className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}