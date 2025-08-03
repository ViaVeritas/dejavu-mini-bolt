import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User } from 'lucide-react';
import { Goal } from '../types/Goal';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface CategoryChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export function CategoryChatPanel({ isOpen, onClose, goal }: CategoryChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  // Initialize with a category-specific welcome message when goal changes
  React.useEffect(() => {
    if (goal && isOpen) {
      setMessages([
        {
          id: '1',
          content: `Hey! I'm here to help you with "${goal.title}". What would you like to work on in this category? I can help you break down your goals and create actionable steps.`,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, [goal, isOpen]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `That's a great point about "${goal?.title}". Let me help you create some specific, actionable goals for this category. What's the most important outcome you want to achieve here?`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  if (!goal) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            {goal.title} Chat
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full mt-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-500' 
                    : 'bg-purple-500'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-card border border-border'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input - Raised from bottom edge */}
          <div className="flex gap-2 mb-4">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Chat about ${goal.title}...`}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
            />
            <Button onClick={sendMessage} size="icon" className="bg-purple-500 hover:bg-purple-600">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}