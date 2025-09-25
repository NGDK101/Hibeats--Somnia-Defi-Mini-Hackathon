import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/web3';
import { HIBEATS_PROFILE_ABI } from '@/contracts/HiBeatsProfileABI';
import { useEffect, useState } from 'react';

interface FollowButtonProps {
  creatorAddress: string;
  currentUserAddress: string;
  onFollow: (creatorAddress: string, e: React.MouseEvent) => void;
  onUnfollow: (creatorAddress: string) => void;
  disabled?: boolean;
  transactionHash?: `0x${string}`;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  creatorAddress,
  currentUserAddress,
  onFollow,
  onUnfollow,
  disabled = false,
  transactionHash
}) => {
  const [isFollowing, setIsFollowing] = useState(false);

  // Check following status from smart contract
  const { data: followingData, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_PROFILE,
    abi: HIBEATS_PROFILE_ABI,
    functionName: 'isFollowing',
    args: [currentUserAddress as `0x${string}`, creatorAddress as `0x${string}`],
  });

  useEffect(() => {
    if (followingData !== undefined) {
      setIsFollowing(followingData as boolean);
    }
  }, [followingData, creatorAddress, currentUserAddress]);

  // Refetch when transaction hash changes (transaction completed)
  useEffect(() => {
    if (transactionHash) {
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [transactionHash, refetch]);

  // Refetch periodically to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 3000); // Refetch every 3 seconds

    return () => clearInterval(interval);
  }, [refetch, creatorAddress]);

  return (
    <Button
      size="sm"
      variant={isFollowing ? "outline" : "default"}
      disabled={disabled}
      className={`flex-1 h-7 text-xs rounded-full transition-all ${
        isFollowing
          ? 'bg-green-500/20 border-green-500 text-green-400 hover:bg-red-500/20 hover:border-red-500 hover:text-red-400'
          : 'bg-primary text-black hover:bg-primary/80'
      }`}
      onClick={(e) => {
        if (isFollowing) {
          e.stopPropagation();
          onUnfollow(creatorAddress);
        } else {
          onFollow(creatorAddress, e);
        }
      }}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-3 h-3 mr-1" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-3 h-3 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
};