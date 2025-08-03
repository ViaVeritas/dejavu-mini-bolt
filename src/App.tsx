import React, { useState } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { ChatScreen } from "./components/ChatScreen";
import { LabScreen } from "./components/LabScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { GoalDetailScreen } from "./components/GoalDetailScreen";
import { Home, FlaskConical, Settings } from "lucide-react";
import { Goal } from "./types/Goal";

type Screen = "login" | "chat" | "lab" | "settings" | "goalDetail";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen("chat");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newMode;
    });
  };

  const handleGoalSelect = (goal: Goal) => {
    setSelectedGoal(goal);
    setCurrentScreen("goalDetail");
  };

  const handleBackFromGoalDetail = () => {
    setSelectedGoal(null);
    setCurrentScreen("lab");
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "chat":
        return <ChatScreen />;
      case "lab":
        return <LabScreen onGoalSelect={handleGoalSelect} />;
      case "goalDetail":
        return selectedGoal ? (
          <GoalDetailScreen 
            goal={selectedGoal} 
            onBack={handleBackFromGoalDetail}
          />
        ) : (
          <LabScreen onGoalSelect={handleGoalSelect} />
        );
      case "settings":
        return (
          <SettingsScreen
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        );
      default:
        return <LabScreen onGoalSelect={handleGoalSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-sm mx-auto">
      {/* Status Bar */}
      <div className="flex justify-between items-center p-2 text-xs text-muted-foreground bg-background">
        <span>4:27</span>
        <div className="flex items-center gap-1">
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-20">{renderScreen()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => setCurrentScreen("chat")}
            className={`flex flex-col items-center p-2 ${
              currentScreen === "chat"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setCurrentScreen("lab")}
            className={`flex flex-col items-center p-2 ${
              currentScreen === "lab"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <FlaskConical size={20} />
            <span className="text-xs mt-1">Lab</span>
          </button>
          <button
            onClick={() => setCurrentScreen("settings")}
            className={`flex flex-col items-center p-2 ${
              currentScreen === "settings"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Settings size={20} />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}