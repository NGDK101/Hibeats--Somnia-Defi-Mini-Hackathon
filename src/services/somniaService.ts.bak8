import { ethers } from 'ethers';

// Somnia Domain Service (SDS) Configuration
const RPC_URL = "https://dream-rpc.somnia.network";
const CONTRACT_ADDRESS = "0xDB4e0A5E7b0d03aA41cBB7940c5e9Bab06cc7157";
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "reverseLookup",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
];

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// Chain configuration for Somnia Testnet
export const SOMNIA_CHAIN_CONFIG = {
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Testnet Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
};

// Function to get primary Somnia name (.som) for a wallet address
export async function getPrimarySomName(walletAddress: string): Promise<string | null> {
  try {
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    const name = await contract.reverseLookup(walletAddress);
    return name || null;
  } catch (err) {
    // console.error("Somnia name lookup failed:", err);
    return null;
  }
}

// Function to check if a name is available (placeholder - implement if needed)
export async function isNameAvailable(name: string): Promise<boolean> {
  try {
    // This would require additional contract functions
    // For now, return true as placeholder
    return true;
  } catch (err) {
    // console.error("Name availability check failed:", err);
    return false;
  }
}

// Function to register a new Somnia name (placeholder - implement if needed)
export async function registerSomName(
  name: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse | null> {
  try {
    // This would require additional contract functions and signer
    // For now, return null as placeholder
    // console.log(`Registering ${name}.som`);
    return null;
  } catch (err) {
    // console.error("Name registration failed:", err);
    return null;
  }
}

// Utility function to validate Somnia name format
export function isValidSomName(name: string): boolean {
  // Basic validation: alphanumeric, hyphens, 3-32 characters, ends with .som
  const somNameRegex = /^[a-zA-Z0-9-]{3,32}\.som$/;
  return somNameRegex.test(name);
}

// Function to get address from Somnia name (forward lookup - placeholder)
export async function getAddressFromSomName(name: string): Promise<string | null> {
  try {
    // This would require additional contract functions
    // For now, return null as placeholder
    // console.log(`Looking up address for ${name}`);
    return null;
  } catch (err) {
    // console.error("Address lookup failed:", err);
    return null;
  }
}

// Export constants for external use
export { RPC_URL, CONTRACT_ADDRESS, CONTRACT_ABI };
