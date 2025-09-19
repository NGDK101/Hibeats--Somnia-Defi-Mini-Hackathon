import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_GOVERNANCE_ABI } from '../contracts';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { config } from '../config/web3';

export function useGovernance() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Write contract operations
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Create proposal
  const createProposal = async (description: string, duration: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_GOVERNANCE,
        abi: HIBEATS_GOVERNANCE_ABI,
        functionName: 'createProposal',
        args: [description, duration],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast.error('Failed to create proposal');
    } finally {
      setIsLoading(false);
    }
  };

  // Cast vote
  const castVote = async (proposalId: bigint, support: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_GOVERNANCE,
        abi: HIBEATS_GOVERNANCE_ABI,
        functionName: 'castVote',
        args: [proposalId, support],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Failed to cast vote');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute proposal
  const executeProposal = async (proposalId: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setIsLoading(true);
      writeContract({
        address: CONTRACT_ADDRESSES.HIBEATS_GOVERNANCE,
        abi: HIBEATS_GOVERNANCE_ABI,
        functionName: 'executeProposal',
        args: [proposalId],
        chainId: config.chains[0].id,
        account: address,
        chain: config.chains[0],
      });
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error('Failed to execute proposal');
    } finally {
      setIsLoading(false);
    }
  };

  // Get proposal
  const getProposal = (proposalId: bigint) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_GOVERNANCE,
      abi: HIBEATS_GOVERNANCE_ABI,
      functionName: 'getProposal',
      args: [proposalId],
    });
  };

  // Get votes for a proposal and voter
  const getVotes = (proposalId: bigint, voter: `0x${string}`) => {
    return useReadContract({
      address: CONTRACT_ADDRESSES.HIBEATS_GOVERNANCE,
      abi: HIBEATS_GOVERNANCE_ABI,
      functionName: 'getVotes',
      args: [proposalId, voter],
    });
  };

  // Get proposal count
  const { data: proposalCount } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_GOVERNANCE,
    abi: HIBEATS_GOVERNANCE_ABI,
    functionName: 'getProposalCount',
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success('Governance action completed successfully');
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error('Governance error:', error);
      toast.error('Governance action failed');
    }
  }, [error]);

  return {
    createProposal,
    castVote,
    executeProposal,
    getProposal,
    getVotes,
    proposalCount,
    isLoading: isLoading || isPending,
    isConfirming,
    isSuccess,
  };
}
