import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Platform, TouchableOpacity, View, Text } from 'react-native';

// CODE SMELL: Dynamic imports with 'any' types - creates type safety issues
// Consider using proper conditional imports with type guards
let GestureHandlerRootView: any;
let AsyncStorage: any;
let AppState: any;
let Notifications: any;
let ensurePermissionsAndChannel: any;
let GoogleSignin: any;
let proactiveCheckInManager: any;

if (Platform.OS !== 'web') {
  // Only import native modules on mobile platforms
  const gestureHandler = require('react-native-gesture-handler');
  GestureHandlerRootView = gestureHandler.GestureHandlerRootView;
  
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
  AppState = require('react-native').AppState;
  Notifications = require('expo-notifications');
  ensurePermissionsAndChannel = require('./utils/notifications').ensurePermissionsAndChannel;
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  proactiveCheckInManager = require('./utils/proactiveCheckIn').proactiveCheckInManager;
} else {
  // Web fallbacks
  GestureHandlerRootView = ({ children, ...props }: any) => React.createElement('div', props, children);
  AsyncStorage = {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key))
  };
  AppState = { addEventListener: () => ({ remove: () => {} }) };
  Notifications = { addNotificationResponseReceivedListener: () => ({ remove: () => {} }) };
  ensurePermissionsAndChannel = () => {};
  GoogleSignin = { configure: () => {} };
  proactiveCheckInManager = {
    setAppState: () => {},
    handleNotificationResponse: () => {},
    stop: () => {},
    setLoginState: () => {},
    onCentralHubActive: () => {},
    onCentralHubInactive: () => {}
  };
}

// Import screens
import LoginScreen from './screens/LoginScreen';
import ChatScreen from './screens/ChatScreen';
import LabScreen from './screens/LabScreen';
import SettingsScreen from './screens/SettingsScreen';
import TestScreen from './screens/TestScreen';
import WebPlaceholder from './components/WebPlaceholder';

const Tab = createBottomTabNavigator();

// Create Dark Mode Context
interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => Promise<void>;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load dark mode preference on app startup
  useEffect(() => {
    loadDarkModePreference();
    
    if (Platform.OS !== 'web') {
      // Initialize notifications permissions/channel
      ensurePermissionsAndChannel();
      // Initialize Google Sign-In
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Use Web client ID for webClientId parameter
      });
      
      // Listen for app state changes
      const handleAppStateChange = (nextAppState: any) => {
        proactiveCheckInManager.setAppState(nextAppState);
      };
      
      const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      
      // Listen for notification responses (when user taps notification)
      const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        proactiveCheckInManager.handleNotificationResponse(response.notification.request.content.data);
      });
      
      // Cleanup
      return () => {
        appStateSubscription?.remove();
        notificationResponseSubscription.remove();
        proactiveCheckInManager.stop();
      };
    }
  }, []);

  const loadDarkModePreference = async () => {
    try {
      const darkModePreference = await AsyncStorage.getItem('dark_mode');
      if (darkModePreference !== null) {
        setIsDarkMode(JSON.parse(darkModePreference));
      }
    } catch (error) {
      console.error('Error loading dark mode preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    // Initialize proactive check-ins now that user is logged in
    proactiveCheckInManager.setLoginState(true);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    // Stop proactive check-ins when user logs out
    proactiveCheckInManager.setLoginState(false);
  };

  // Wrapper component for SettingsScreen
  const SettingsScreenWrapper = () => (
    <SettingsScreen onSignOut={handleSignOut} />
  );

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('dark_mode', JSON.stringify(newDarkMode));
    } catch (error) {
      console.error('Error saving dark mode preference:', error);
    }
  };

  // Custom theme colors
  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#8B5CF6',
      background: '#1F2937',
      card: '#374151',
    },
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#007AFF',
      background: '#F9FAFB',
      card: '#FFFFFF',
    },
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  if (!isLoggedIn) {
    return (
      <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB' }}>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          <LoginScreen onLogin={handleLogin} />
        </GestureHandlerRootView>
      </DarkModeContext.Provider>
    );
  }

  const handleNavigationStateChange = (state: any) => {
    // Get the active tab name
    if (state && state.routes && state.index !== undefined) {
      const activeRoute = state.routes[state.index];
      const activeRouteName = activeRoute.name;
      
      // Track Central Hub (Chat tab) activity
      if (activeRouteName === 'Chat') {
        proactiveCheckInManager.onCentralHubActive();
      } else {
        proactiveCheckInManager.onCentralHubInactive();
      }
    }
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      <GestureHandlerRootView style={{ 
        flex: 1, 
        backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
        ...(Platform.OS === 'web' && {
          height: '100vh',
          width: '100vw',
        }),
      }}>
        <NavigationContainer 
          theme={isDarkMode ? customDarkTheme : customLightTheme}
          onStateChange={Platform.OS === 'web' ? undefined : handleNavigationStateChange}
        >
          <StatusBar style={isDarkMode ? "light" : "dark"} />
          <Tab.Navigator
            sceneContainerStyle={Platform.OS === 'web' ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 60,
              backgroundColor: 'transparent'
            } : undefined}
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'home';

                if (route.name === 'Chat') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Lab') {
                  iconName = focused ? 'flask' : 'flask-outline';
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline';
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: isDarkMode ? '#8B5CF6' : '#007AFF',
              tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
              headerShown: false,
              tabBarStyle: {
                backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
                borderTopColor: isDarkMode ? '#4B5563' : '#E5E7EB',
                ...(Platform.OS === 'web' && {
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  zIndex: 1000,
                }),
              },
              tabBarLabelStyle: {
                color: isDarkMode ? '#D1D5DB' : '#374151',
              },
            })}
          >
            <Tab.Screen name="Chat" component={Platform.OS === 'web' ? () => (
              <WebPlaceholder title="Chat" description="Future Self Chat - Available on mobile" />
            ) : ChatScreen} />
            <Tab.Screen name="Lab" component={Platform.OS === 'web' ? () => (
              <WebPlaceholder title="Lab" description="Planning Lab - Available on mobile" />
            ) : LabScreen} />
            <Tab.Screen name="Settings" component={Platform.OS === 'web' ? () => (
              <WebPlaceholder title="Settings" description="App Settings - Available on mobile" />
            ) : SettingsScreenWrapper} />
          </Tab.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
    </DarkModeContext.Provider>
  );
}
