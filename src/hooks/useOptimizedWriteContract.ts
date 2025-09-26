import { useWriteContract } from 'wagmi';
import { useGasOptimization } from './useGasOptimization';
import { useState } from 'react';

// Custom hook that wraps wagmi's useWriteContract with gas optimization
export const useOptimizedWriteContract = () => {
  const { writeContract: wagmiWriteContract, ...rest } = useWriteContract();
  const { getOptimalGasSettings } = useGasOptimization();
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  const writeContractOptimized = async (params: any) => {
    try {
      setIsEstimatingGas(true);

      // Get optimized gas settings
      const gasSettings = await getOptimalGasSettings({
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args,
        value: params.value,
      });

      // For updateProfile, use explicit high gas limit due to complex operations
      let gasLimit = gasSettings?.gas;
      if (params.functionName === 'updateProfile') {
        gasLimit = BigInt(2_500_000); // 2.5M gas for profile updates (increased from 1.5M)
      } else if (params.functionName === 'createProfile') {
        gasLimit = BigInt(5_000_000); // 5M gas for profile creation (based on successful manual setting)
      }

      // Merge gas settings with the original parameters
      const optimizedParams = {
        ...params,
        ...(gasSettings || {}),
        ...(gasLimit && { gas: gasLimit }),
      };

      console.log(`🔧 Optimized gas settings for ${params.functionName}:`, {
        gasLimit: gasLimit?.toString(),
        originalEstimate: gasSettings?.gas?.toString(),
        functionName: params.functionName,
        isHighGasOperation: ['createProfile', 'updateProfile'].includes(params.functionName),
      });

      // Call the original writeContract with optimized parameters
      return wagmiWriteContract(optimizedParams as any);
    } catch (error) {
      console.error('Gas optimization failed, using fallback:', error);
      
      // Fallback with manual gas limits based on function
      let fallbackGas;
      if (params.functionName === 'updateProfile') {
        fallbackGas = BigInt(2_500_000); // Increased fallback for updateProfile
      } else if (params.functionName === 'createProfile') {
        fallbackGas = BigInt(5_000_000); // 5M gas fallback for createProfile
      } else {
        fallbackGas = BigInt(500_000);
      }

      const fallbackParams = {
        ...params,
        gas: fallbackGas,
      };

      console.log(`🔄 Using fallback gas limit: ${fallbackGas.toString()}`);
      return wagmiWriteContract(fallbackParams as any);
    } finally {
      setIsEstimatingGas(false);
    }
  };

  return {
    writeContract: writeContractOptimized,
    isEstimatingGas,
    ...rest,
  };
};