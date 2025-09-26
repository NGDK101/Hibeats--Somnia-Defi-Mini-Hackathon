import { useState, useCallback, useEffect } from 'react';
import { usePublicClient, useEstimateGas } from 'wagmi';
import { formatGwei, parseGwei } from 'viem';

interface GasSettings {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

interface SmartGasConfig {
  contractAddress: `0x${string}`;
  abi: any;
  functionName: string;
  args?: any[];
  value?: bigint;
}

export function useSmartGas() {
  const [gasSettings, setGasSettings] = useState<GasSettings | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const publicClient = usePublicClient();

  // Base gas limits for different operations
  const baseGasLimits = {
    transfer: BigInt(21_000),
    approve: BigInt(50_000),
    mint: BigInt(200_000),
    createProfile: BigInt(300_000),
    updateProfile: BigInt(200_000),
    follow: BigInt(100_000),
    buy: BigInt(250_000),
    sell: BigInt(200_000),
    marketplace: BigInt(250_000),
    complex: BigInt(500_000)
  };

  // Get current network gas price
  const getCurrentGasPrice = useCallback(async (): Promise<bigint> => {
    try {
      if (!publicClient) return parseGwei('10'); // Default fallback
      
      const gasPrice = await publicClient.getGasPrice();
      return gasPrice;
    } catch (error) {
      console.warn('Failed to get gas price, using fallback:', error);
      return parseGwei('10'); // 10 Gwei fallback
    }
  }, [publicClient]);

  // Estimate gas for specific transaction
  const estimateGasForTransaction = useCallback(async (config: SmartGasConfig): Promise<bigint> => {
    try {
      if (!publicClient) return baseGasLimits.complex;

      const gasEstimate = await publicClient.estimateContractGas({
        address: config.contractAddress,
        abi: config.abi,
        functionName: config.functionName,
        args: config.args || [],
        value: config.value,
      });

      // Add 20% buffer to gas estimate
      return gasEstimate + (gasEstimate * BigInt(20)) / BigInt(100);
    } catch (error) {
      console.warn('Gas estimation failed, using base limit:', error);
      
      // Return appropriate base limit based on function name
      if (config.functionName.includes('transfer')) return baseGasLimits.transfer;
      if (config.functionName.includes('approve')) return baseGasLimits.approve;
      if (config.functionName.includes('mint')) return baseGasLimits.mint;
      if (config.functionName.includes('Profile')) return baseGasLimits.createProfile;
      if (config.functionName.includes('follow')) return baseGasLimits.follow;
      
      return baseGasLimits.complex;
    }
  }, [publicClient, baseGasLimits]);

  // Get smart gas settings based on network conditions
  const getSmartGasSettings = useCallback(async (
    operationType: keyof typeof baseGasLimits = 'complex',
    config?: SmartGasConfig
  ): Promise<GasSettings> => {
    setIsEstimating(true);
    
    try {
      // Get current gas price
      const currentGasPrice = await getCurrentGasPrice();
      
      // Determine gas limit
      let gasLimit: bigint;
      if (config) {
        gasLimit = await estimateGasForTransaction(config);
      } else {
        gasLimit = baseGasLimits[operationType];
      }

      // Determine gas price based on network conditions
      let adjustedGasPrice = currentGasPrice;
      
      // Check if network is congested (high gas price)
      const highGasThreshold = parseGwei('50'); // 50 Gwei
      const mediumGasThreshold = parseGwei('20'); // 20 Gwei
      
      if (currentGasPrice > highGasThreshold) {
        // High congestion: use current price + small premium
        adjustedGasPrice = currentGasPrice + parseGwei('5');
        console.log(`🔥 High network congestion detected. Gas price: ${formatGwei(adjustedGasPrice)} Gwei`);
      } else if (currentGasPrice > mediumGasThreshold) {
        // Medium congestion: use current price + small premium
        adjustedGasPrice = currentGasPrice + parseGwei('2');
        console.log(`⚡ Medium network congestion. Gas price: ${formatGwei(adjustedGasPrice)} Gwei`);
      } else {
        // Low congestion: use current price + minimal premium
        adjustedGasPrice = currentGasPrice + parseGwei('1');
        console.log(`✅ Low network congestion. Gas price: ${formatGwei(adjustedGasPrice)} Gwei`);
      }

      const settings: GasSettings = {
        gasLimit,
        gasPrice: adjustedGasPrice,
        maxFeePerGas: adjustedGasPrice,
        maxPriorityFeePerGas: parseGwei('2'), // 2 Gwei priority fee
      };

      setGasSettings(settings);
      return settings;
      
    } catch (error) {
      console.error('Smart gas estimation failed:', error);
      
      // Fallback settings
      const fallbackSettings: GasSettings = {
        gasLimit: baseGasLimits[operationType],
        gasPrice: parseGwei('15'), // 15 Gwei fallback
        maxFeePerGas: parseGwei('15'),
        maxPriorityFeePerGas: parseGwei('2'),
      };
      
      setGasSettings(fallbackSettings);
      return fallbackSettings;
    } finally {
      setIsEstimating(false);
    }
  }, [getCurrentGasPrice, estimateGasForTransaction, baseGasLimits]);

  // Prepare transaction with smart gas
  // Simple function to get just gas settings for spreading into writeContract calls
  const getGasSettings = useCallback(async (operationType?: keyof typeof baseGasLimits) => {
    try {
      const gasPrice = await getCurrentGasPrice();
      
      let gasLimit: bigint;
      if (operationType && baseGasLimits[operationType]) {
        gasLimit = baseGasLimits[operationType];
        // Add 20% buffer for safety
        gasLimit = gasLimit + (gasLimit * BigInt(20)) / BigInt(100);
      } else {
        gasLimit = BigInt(300_000); // Safe default
      }

      return {
        gas: gasLimit,
        gasPrice: gasPrice,
      };
    } catch (error) {
      console.warn('Failed to get smart gas settings, using fallback:', error);
      return {
        gas: BigInt(300_000),
        gasPrice: parseGwei('15'), // 15 Gwei fallback
      };
    }
  }, [getCurrentGasPrice, baseGasLimits]);

  const prepareTransactionWithSmartGas = useCallback(async (
    config: SmartGasConfig,
    operationType?: keyof typeof baseGasLimits
  ) => {
    const gasSettings = await getSmartGasSettings(operationType, config);
    
    return {
      address: config.contractAddress,
      abi: config.abi,
      functionName: config.functionName,
      args: config.args || [],
      value: config.value,
      gas: gasSettings.gasLimit,
      gasPrice: gasSettings.gasPrice,
      maxFeePerGas: gasSettings.maxFeePerGas,
      maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas,
    };
  }, [getSmartGasSettings, baseGasLimits]);

  // Monitor gas prices in real-time
  useEffect(() => {
    const monitorGasPrice = async () => {
      try {
        const currentGasPrice = await getCurrentGasPrice();
        const gasPriceGwei = formatGwei(currentGasPrice);
        
        // Only log significant changes
        if (Math.abs(parseFloat(gasPriceGwei) - 15) > 5) {
          console.log(`⛽ Current network gas price: ${gasPriceGwei} Gwei`);
        }
      } catch (error) {
        // Silently handle monitoring errors
      }
    };

    // Monitor every 30 seconds
    const interval = setInterval(monitorGasPrice, 30000);
    
    // Initial check
    monitorGasPrice();
    
    return () => clearInterval(interval);
  }, [getCurrentGasPrice]);

  return {
    gasSettings,
    isEstimating,
    getSmartGasSettings,
    getGasSettings,
    prepareTransactionWithSmartGas,
    getCurrentGasPrice,
  };
}