export const checkMetaMask = () => {
  
  // Check if window.ethereum exists
  if (typeof window.ethereum === 'undefined') {
    console.error('❌ MetaMask not installed!');
    return {
      installed: false,
      error: 'MetaMask is not installed. Please install MetaMask extension.',
    };
  }


  // Check if it's MetaMask
  if (!window.ethereum.isMetaMask) {
    console.warn('⚠️ Ethereum provider exists but is not MetaMask');
  } else {
  }

  // Check connection status
  if (window.ethereum.isConnected()) {
  } else {
    console.warn('⚠️ MetaMask is not connected');
  }

  // Check if accounts are available
  window.ethereum.request({ method: 'eth_accounts' })
    .then((accounts: string[]) => {
      if (accounts.length > 0) {
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

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  (window as any).checkMetaMask = checkMetaMask;
}
