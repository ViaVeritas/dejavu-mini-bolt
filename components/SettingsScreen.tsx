import React from 'react';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Bell, Link, Palette } from 'lucide-react';

interface SettingsScreenProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SettingsScreen({ isDarkMode, onToggleDarkMode }: SettingsScreenProps) {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-medium mb-6">Settings</h1>

        {/* Notifications Section */}
        <div className="bg-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-purple-500" />
            <h2 className="font-medium">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Enable Notifications</h3>
                <p className="text-sm text-muted-foreground">Receive proactive check-ins and reminders</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Check in randomly once every</h3>
                <span className="text-sm text-muted-foreground">1 hour</span>
              </div>
              <Slider 
                defaultValue={[1]} 
                max={24} 
                min={1} 
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Reminder Time</h3>
                <span className="text-sm text-muted-foreground">15 minutes before deadline</span>
              </div>
              <Slider 
                defaultValue={[15]} 
                max={60} 
                min={5} 
                step={5}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Sound</h3>
                <p className="text-sm text-muted-foreground">Play notification sounds</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Vibration</h3>
                <p className="text-sm text-muted-foreground">Vibrate on notifications</p>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="bg-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Link className="w-5 h-5 text-purple-500" />
            <h2 className="font-medium">Integrations</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Sync</h3>
                <p className="text-sm text-muted-foreground">Connect your email for better insights</p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Calendar Sync</h3>
                <p className="text-sm text-muted-foreground">Sync goals with your calendar</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-card rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="font-medium">Appearance</h2>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-medium">Dark Mode</h3>
            <Switch checked={isDarkMode} onCheckedChange={onToggleDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}