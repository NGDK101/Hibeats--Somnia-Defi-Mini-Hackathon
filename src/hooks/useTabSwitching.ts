import { useState, useCallback } from 'react';

interface UseTabSwitchingProps {
  initialTab?: string;
  switchDelay?: number; // Delay to show loading animation
}

export const useTabSwitching = ({ 
  initialTab = 'create', 
  switchDelay = 300 
}: UseTabSwitchingProps = {}) => {
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [fromTab, setFromTab] = useState<string | undefined>();
  const [toTab, setToTab] = useState<string | undefined>();

  const switchTab = useCallback(async (newTab: string) => {
    if (newTab === currentTab) return;

    // Set loading state
    setIsLoading(true);
    setFromTab(currentTab);
    setToTab(newTab);

    // Simulate loading delay for smooth animation
    await new Promise(resolve => setTimeout(resolve, switchDelay));

    // Update tab
    setCurrentTab(newTab);
    
    // Clear loading state
    setTimeout(() => {
      setIsLoading(false);
      setFromTab(undefined);
      setToTab(undefined);
    }, 100);
  }, [currentTab, switchDelay]);

  return {
    currentTab,
    isLoading,
    fromTab,
    toTab,
    switchTab
  };
};

export default useTabSwitching;