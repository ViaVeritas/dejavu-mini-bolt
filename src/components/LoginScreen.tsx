import React from 'react';
import { Button } from './ui/button';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo/Title */}
        <div className="text-center mb-12">
          <div className="text-4xl mb-4">🔮</div>
          <h1 className="text-2xl mb-2">DeJaVu Mini</h1>
          <p className="text-muted-foreground">Let Your Future Check On You</p>
        </div>

        {/* Login Buttons */}
        <div className="space-y-4">
          <Button 
            onClick={onLogin}
            className="w-full bg-white text-black border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-3 py-3"
          >
            <div className="w-5 h-5 bg-red-500 rounded-sm"></div>
            Continue with Google
          </Button>
          
          <Button 
            onClick={onLogin}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-3 py-3"
          >
            <div className="w-5 h-5 bg-white rounded-sm"></div>
            Continue with Canvas
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}