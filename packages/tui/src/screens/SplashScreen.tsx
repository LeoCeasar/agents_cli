import React, { useState, useEffect } from 'react';
import { Box, Text, render } from 'ink';
import figlet from 'figlet';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    // Simulate loading
    setTimeout(async () => {
      setLoadingComplete(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete();
    }, 2000);
  }, []);

  const getBannerText = () => {
    try {
      return figlet.textSync('Agent Graph', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
      });
    } catch {
      return 'Agent Graph';
    }
  };

  return (
    <Box flexDirection="column" height="100%" justifyContent="center" alignItems="center">
      <Box marginBottom={1}>
        <Text color="cyan">
          {getBannerText()}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="blue" bold>
          {'─' * 40}
        </Text>
      </Box>

      <Box marginBottom={2}>
        <Text color="gray">
          Terminal User Interface
        </Text>
        <Text color="gray">
          for AI Agent Platform
        </Text>
      </Box>

      {loadingComplete ? (
        <Box>
          <Text color="green">✓ Initialization complete!</Text>
          <Text color="gray">Starting application...</Text>
        </Box>
      ) : (
        <Box>
          <Text color="yellow">⏳ Initializing...</Text>
          <Text color="gray">Loading agents and services...</Text>
        </Box>
      )}

      <Box marginTop={2}>
        <Text color="gray" dimColor>
          Version 1.0.0 | Built with ❤️ using React + Ink
        </Text>
      </Box>
    </Box>
  );
};