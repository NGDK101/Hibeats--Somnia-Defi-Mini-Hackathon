import { useCallback, useMemo } from 'react';
import { useAccount, useEstimateGas } from 'wagmi';
import { parseGwei, formatGwei } from 'viem';
import type { Address, Abi } from 'viem';

export interface GasEstimationParams {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}

export interface GasSettings {
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedCost: bigint;
  isEIP1559: boolean;
}

export const useGasOptimization = () => {
  const { address } = useAccount();

  // Somnia network settings (EIP-1559 compatible)
  const networkSettings = useMemo(() => ({
    // Somnia Testnet typical values
    baseFee: parseGwei('0.001'), // Very low base fee for testnet
    priorityFee: parseGwei('0.001'), // Low priority fee
    gasMultiplier: 1.2, // 20% buffer for gas estimation
    maxGasLimit: BigInt(5_000_000), // 5M gas max limit
    minGasLimit: BigInt(21_000), // Standard transfer minimum
    isEIP1559: true, // Somnia supports EIP-1559
  }), []);

  // Estimate gas with optimization
  const estimateGas = useCallback(async (params: GasEstimationParams): Promise<GasSettings | null> => {
    if (!address) {
      console.warn('Wallet not connected for gas estimation');
      return null;
    }

    try {
      console.log('⛽ Estimating gas for:', params.functionName);

      // For Somnia testnet, we'll use conservative estimates since gas estimation
      // might not be fully reliable on testnets
      let gasLimit: bigint;
      
      // Function-specific gas estimates for common operations
      switch (params.functionName) {
        case 'transfer':
        case 'transferFrom':
          gasLimit = BigInt(65_000);
          break;
        case 'approve':
          gasLimit = BigInt(55_000);
          break;
        case 'mint':
        case 'createProfile':
          gasLimit = BigInt(150_000);
          break;
        case 'updateProfile':
          gasLimit = BigInt(100_000);
          break;
        case 'stake':
        case 'unstake':
          gasLimit = BigInt(120_000);
          break;
        case 'listItem':
        case 'buyItem':
          gasLimit = BigInt(200_000);
          break;
        default:
          // Conservative estimate for unknown functions
          gasLimit = BigInt(300_000);
      }

      // Apply buffer
      gasLimit = BigInt(Math.floor(Number(gasLimit) * networkSettings.gasMultiplier));

      // Ensure within limits
      gasLimit = gasLimit > networkSettings.maxGasLimit ? networkSettings.maxGasLimit : gasLimit;
      gasLimit = gasLimit < networkSettings.minGasLimit ? networkSettings.minGasLimit : gasLimit;

      // EIP-1559 gas pricing for modern networks
      const gasSettings: GasSettings = {
        gasLimit,
        maxFeePerGas: networkSettings.baseFee + networkSettings.priorityFee,
        maxPriorityFeePerGas: networkSettings.priorityFee,
        estimatedCost: gasLimit * (networkSettings.baseFee + networkSettings.priorityFee),
        isEIP1559: networkSettings.isEIP1559,
      };

      console.log('✅ Gas estimation complete:', {
        gasLimit: gasLimit.toString(),
        maxFeePerGas: formatGwei(gasSettings.maxFeePerGas!),
        estimatedCostETH: formatGwei(gasSettings.estimatedCost),
      });

      return gasSettings;

    } catch (error) {
      console.error('❌ Gas estimation failed:', error);
      
      // Fallback to safe defaults
      const fallbackGasLimit = BigInt(500_000);
      return {
        gasLimit: fallbackGasLimit,
        maxFeePerGas: networkSettings.baseFee + networkSettings.priorityFee,
        maxPriorityFeePerGas: networkSettings.priorityFee,
        estimatedCost: fallbackGasLimit * (networkSettings.baseFee + networkSettings.priorityFee),
        isEIP1559: networkSettings.isEIP1559,
      };
    }
  }, [address, networkSettings]);

  // Get optimal gas settings for a transaction
  const getOptimalGasSettings = useCallback(async (params: GasEstimationParams) => {
    const estimation = await estimateGas(params);
    
    if (!estimation) {
      return null;
    }

    // Return optimized settings for wagmi writeContract
    return {
      gas: estimation.gasLimit,
      maxFeePerGas: estimation.maxFeePerGas,
      maxPriorityFeePerGas: estimation.maxPriorityFeePerGas,
    };
  }, [estimateGas]);

  // Format gas cost for display
  const formatGasCost = useCallback((gasSettings: GasSettings): string => {
    const costInGwei = formatGwei(gasSettings.estimatedCost);
    const costNumber = parseFloat(costInGwei);
    
    if (costNumber < 0.001) {
      return '< 0.001 Gwei';
    } else if (costNumber < 1) {
      return `${costNumber.toFixed(3)} Gwei`;
    } else {
      return `${costNumber.toFixed(2)} Gwei`;
    }
  }, []);

  // Check if user has enough balance for gas
  const checkGasAffordability = useCallback(async (
    gasSettings: GasSettings, 
    userBalance: bigint
  ): Promise<boolean> => {
    return userBalance >= gasSettings.estimatedCost;
  }, []);

  return {
    estimateGas,
    getOptimalGasSettings,
    formatGasCost,
    checkGasAffordability,
    networkSettings,
  };
};