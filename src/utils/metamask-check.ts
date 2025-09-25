// Enhanced MetaMask detection and connection utilities
export const checkMetaMask = () => {
  console.log('🔍 Checking MetaMask installation...');
  
  // Check if window.ethereum exists
  if (typeof window.ethereum === 'undefined') {
    console.error('❌ MetaMask not installed!');
    return {
      installed: false,
      error: 'MetaMask is not installed. Please install MetaMask extension.',
    };
  }

  console.log('✅ window.ethereum exists');

  // Check if it's MetaMask
  if (!window.ethereum.isMetaMask) {
    console.warn('⚠️ Ethereum provider exists but is not MetaMask');
  } else {
    console.log('✅ MetaMask detected');
  }

  // Check connection status
  if (window.ethereum.isConnected()) {
    console.log('✅ MetaMask is connected');
  } else {
    console.warn('⚠️ MetaMask is not connected');
  }

  // Check if accounts are available
  window.ethereum.request({ method: 'eth_accounts' })
    .then((accounts: string[]) => {
      if (accounts.length > 0) {
        console.log('✅ Accounts available:', accounts);
      } else {
        console.warn('⚠️ No accounts connected');
      }
    })
    .catch((err: any) => {
      console.error('❌ Error checking accounts:', err);
    });

  return {
    installed: true,
    isMetaMask: window.ethereum.isMetaMask,
    isConnected: window.ethereum.isConnected(),
  };
};

// Enhanced connection helper
export const connectMetaMask = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    console.log('✅ MetaMask connected:', accounts);
    return { success: true, accounts };
  } catch (error: any) {
    console.error('❌ MetaMask connection failed:', error);
    
    // Handle specific errors
    if (error.code === 4001) {
      return { success: false, error: 'User rejected the connection request' };
    } else if (error.code === -32002) {
      return { success: false, error: 'Connection request is already pending' };
    }
    
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

// Network switching helper
export const switchToSomniaNetwork = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Try to switch to Somnia network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xC488' }], // 50312 in hex
    });

    console.log('✅ Switched to Somnia network');
    return { success: true };
  } catch (switchError: any) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0xC488', // 50312 in hex
              chainName: 'Somnia Testnet',
              nativeCurrency: {
                name: 'STT',
                symbol: 'STT',
                decimals: 18,
              },
              rpcUrls: ['https://dream-rpc.somnia.network'],
              blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
            },
          ],
        });

        console.log('✅ Added and switched to Somnia network');
        return { success: true };
      } catch (addError: any) {
        console.error('❌ Failed to add Somnia network:', addError);
        return { success: false, error: 'Failed to add Somnia network' };
      }
    } else {
      console.error('❌ Failed to switch network:', switchError);
      return { success: false, error: 'Failed to switch to Somnia network' };
    }
  }
};

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).checkMetaMask = checkMetaMask;
  (window as any).connectMetaMask = connectMetaMask;
  (window as any).switchToSomniaNetwork = switchToSomniaNetwork;
}
