import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hey there! I'm your future self checking in. How are you feeling about your progress today? Remember, I've been where you are now - consistency is key to reaching our goals.",
      sender: 'ai',
      timestamp: new Date(Date.now() - 30000)
    }
  ]);
  const [inputText, setInputText] = useState('');

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
        content: "I understand where you're at right now. From my perspective, I can see that the small steps you take today really add up. What's one thing you'd like to focus on improving this week?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-medium">Future You</h2>
            <p className="text-sm text-muted-foreground">AI Guide • Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Share your thoughts with your future self..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} size="icon" className="bg-purple-500 hover:bg-purple-600">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}