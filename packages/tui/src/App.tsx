import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { MenuScreen } from './screens/MenuScreen.js';
import { ChatScreen } from './screens/ChatScreen.js';
import { DashboardScreen } from './screens/DashboardScreen.js';
import { AgentConfigScreen } from './screens/AgentConfigScreen.js';
import { SplashScreen } from './screens/SplashScreen.js';

type ScreenType = 'splash' | 'menu' | 'chat' | 'dashboard' | 'config';

interface AppProps {
  context: any;
}

export const App: React.FC<AppProps> = ({ context }) => {
  const { exit } = useApp();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 3 seconds, then show menu
    setTimeout(() => {
      setShowSplash(false);
      setCurrentScreen('menu');
    }, 3000);
  }, []);

  const handleScreenSelect = (screen: 'chat' | 'dashboard' | 'config') => {
    setCurrentScreen(screen);
  };

  const handleExit = () => {
    setCurrentScreen('menu');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onComplete={() => setCurrentScreen('menu')} />;
      case 'menu':
        return <MenuScreen onExit={exit} onSelectScreen={handleScreenSelect} />;
      case 'chat':
        return (
          <ChatScreen
            onExit={handleExit}
            context={context}
            mode="multi"
            availableAgents={['code', 'debug', 'test', 'doc', 'architect', 'security']}
          />
        );
      case 'dashboard':
        return <DashboardScreen onExit={handleExit} context={context} />;
      case 'config':
        return <AgentConfigScreen onExit={handleExit} context={context} />;
      default:
        return <MenuScreen onExit={exit} onSelectScreen={handleScreenSelect} />;
    }
  };

  if (showSplash) {
    return render(<SplashScreen onComplete={() => setShowSplash(false)} />);
  }

  return render(renderScreen());
};