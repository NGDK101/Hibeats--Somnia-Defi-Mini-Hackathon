/**
 * Wallet Persistence Debug Utility
 * Helps diagnose wallet connection issues on page reload
 */

export const debugWalletStorage = () => {
  console.group('🔍 Wallet Storage Debug');

  try {
    // Check all wallet-related localStorage items
    const wagmiData = localStorage.getItem('hibeats.wagmi');
    const rainbowKitData = localStorage.getItem('hibeats.wallet');
    const legacyData = localStorage.getItem('hibeats_wallet_connection');

    console.log('📦 wagmi storage (hibeats.wagmi):', wagmiData ? JSON.parse(wagmiData) : 'Not found');
    console.log('🌈 RainbowKit storage (hibeats.wallet):', rainbowKitData ? JSON.parse(rainbowKitData) : 'Not found');
    console.log('🗄️ Legacy storage (hibeats_wallet_connection):', legacyData ? JSON.parse(legacyData) : 'Not found');

    // Check browser storage support
    console.log('🏬 localStorage supported:', typeof Storage !== 'undefined');
    console.log('🍪 Cookies enabled:', navigator.cookieEnabled);

    // Check if we're in a secure context
    console.log('🔒 Secure context:', window.isSecureContext);
    console.log('🌐 Protocol:', window.location.protocol);

  } catch (error) {
    console.error('❌ Debug error:', error);
  }

  console.groupEnd();
};

export const clearAllWalletStorage = () => {
  console.log('🧹 Clearing all wallet storage...');

  try {
    localStorage.removeItem('hibeats.wagmi');
    localStorage.removeItem('hibeats.wallet');
    localStorage.removeItem('hibeats_wallet_connection');

    // Clear auth storage too
    const authKeys = Object.keys(localStorage).filter(key => key.startsWith('hibeats_auth_'));
    authKeys.forEach(key => localStorage.removeItem(key));

    console.log('✅ All wallet storage cleared');
  } catch (error) {
    console.error('❌ Clear storage error:', error);
  }
};

export const testWalletPersistence = () => {
  console.group('🧪 Testing Wallet Persistence');

  try {
    // Test localStorage functionality
    const testKey = 'hibeats_test';
    const testValue = { test: true, timestamp: Date.now() };

    localStorage.setItem(testKey, JSON.stringify(testValue));
    const retrieved = localStorage.getItem(testKey);

    if (retrieved) {
      const parsed = JSON.parse(retrieved);
      console.log('✅ localStorage works:', parsed);
      localStorage.removeItem(testKey);
    } else {
      console.error('❌ localStorage failed');
    }

  } catch (error) {
    console.error('❌ Persistence test error:', error);
  }

  console.groupEnd();
};

// Auto-run debug on development mode
if (process.env.NODE_ENV === 'development') {
  // Export to window for easy access
  (window as any).walletDebug = {
    debug: debugWalletStorage,
    clear: clearAllWalletStorage,
    test: testWalletPersistence
  };
}