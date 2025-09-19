import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_FACTORY_ABI } from '@/contracts';
import { isAddress } from 'viem';

export function ContractVerificationTest() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [isChecking, setIsChecking] = useState(false);
  const [verificationResults, setVerificationResults] = useState<any>(null);

  // Try to read basic contract data
  const { data: factoryOwner, error: ownerError } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'owner',
  });

  const { data: directMintFee, error: feeError } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'directMintFee',
  });

  const { data: paused, error: pausedError } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'paused',
  });

  const runContractVerification = async () => {
    setIsChecking(true);
    const results: any = {
      addresses: {},
      contractCode: {},
      readOperations: {},
      networkInfo: {},
      errors: []
    };

    try {
      // 1. Verify all contract addresses are valid
      console.log('🔍 Step 1: Verifying contract addresses...');
      Object.entries(CONTRACT_ADDRESSES).forEach(([name, address]) => {
        const isValid = isAddress(address);
        results.addresses[name] = {
          address,
          isValid,
          status: isValid ? '✅ Valid' : '❌ Invalid'
        };
        if (!isValid) {
          results.errors.push(`Invalid address for ${name}: ${address}`);
        }
      });

      // 2. Check if contracts have bytecode (are deployed)
      console.log('🔍 Step 2: Checking contract deployment...');
      if (publicClient) {
        try {
          const factoryCode = await publicClient.getBytecode({
            address: CONTRACT_ADDRESSES.HIBEATS_FACTORY
          });

          results.contractCode.factory = {
            hasCode: !!factoryCode && factoryCode !== '0x',
            codeLength: factoryCode ? factoryCode.length : 0,
            status: (!!factoryCode && factoryCode !== '0x') ? '✅ Deployed' : '❌ Not Deployed'
          };

          if (!factoryCode || factoryCode === '0x') {
            results.errors.push('Factory contract not deployed or no bytecode found');
          }
        } catch (error) {
          results.contractCode.factory = {
            hasCode: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: '❌ Error'
          };
          results.errors.push(`Error checking Factory contract: ${error instanceof Error ? error.message : 'Unknown'}`);
        }

        // Check NFT contract too
        try {
          const nftCode = await publicClient.getBytecode({
            address: CONTRACT_ADDRESSES.HIBEATS_NFT
          });

          results.contractCode.nft = {
            hasCode: !!nftCode && nftCode !== '0x',
            codeLength: nftCode ? nftCode.length : 0,
            status: (!!nftCode && nftCode !== '0x') ? '✅ Deployed' : '❌ Not Deployed'
          };
        } catch (error) {
          results.contractCode.nft = {
            hasCode: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: '❌ Error'
          };
        }
      }

      // 3. Test read operations
      console.log('🔍 Step 3: Testing contract read operations...');
      results.readOperations = {
        owner: {
          data: factoryOwner,
          error: ownerError,
          status: factoryOwner ? '✅ Success' : '❌ Failed'
        },
        directMintFee: {
          data: directMintFee,
          error: feeError,
          status: directMintFee ? '✅ Success' : '❌ Failed'
        },
        paused: {
          data: paused,
          error: pausedError,
          status: paused !== undefined ? '✅ Success' : '❌ Failed'
        }
      };

      // 4. Network information
      console.log('🔍 Step 4: Getting network information...');
      if (publicClient) {
        try {
          const chainId = await publicClient.getChainId();
          const blockNumber = await publicClient.getBlockNumber();

          results.networkInfo = {
            chainId,
            blockNumber: blockNumber.toString(),
            expectedChainId: 50312,
            isCorrectNetwork: chainId === 50312,
            status: chainId === 50312 ? '✅ Correct Network' : '❌ Wrong Network'
          };

          if (chainId !== 50312) {
            results.errors.push(`Wrong network. Expected 50312 (Somnia Testnet), got ${chainId}`);
          }
        } catch (error) {
          results.networkInfo = {
            error: error instanceof Error ? error.message : 'Unknown error',
            status: '❌ Error'
          };
          results.errors.push(`Network error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }

      console.log('🔍 Contract verification results:', results);
      setVerificationResults(results);

    } catch (error) {
      console.error('❌ Contract verification failed:', error);
      results.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setVerificationResults(results);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const isSuccess = status.includes('✅');
    const isError = status.includes('❌');

    return (
      <Badge variant={isSuccess ? "default" : isError ? "destructive" : "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Contract Verification & Diagnosis
        </CardTitle>
        <CardDescription>
          Deep verification of contract deployment, network connection, and potential minting issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Quick Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 border rounded-lg text-center">
            <div className="font-medium text-white mb-1">Wallet</div>
            <Badge variant={address ? "default" : "secondary"}>
              {address ? '✅ Connected' : '❌ Not Connected'}
            </Badge>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="font-medium text-white mb-1">Factory Owner</div>
            <Badge variant={factoryOwner ? "default" : "secondary"}>
              {factoryOwner ? '✅ Found' : '❌ Not Found'}
            </Badge>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="font-medium text-white mb-1">Mint Fee</div>
            <Badge variant={directMintFee ? "default" : "secondary"}>
              {directMintFee ? '✅ Found' : '❌ Not Found'}
            </Badge>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="font-medium text-white mb-1">Contract Status</div>
            <Badge variant={paused === false ? "default" : "secondary"}>
              {paused === false ? '✅ Active' : paused === true ? '⏸️ Paused' : '❓ Unknown'}
            </Badge>
          </div>
        </div>

        {/* Start Verification */}
        <Button
          onClick={runContractVerification}
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Deep Verification...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Run Contract Verification
            </>
          )}
        </Button>

        {/* Results */}
        {verificationResults && (
          <div className="space-y-6">

            {/* Errors Summary */}
            {verificationResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Issues Found ({verificationResults.errors.length}):</strong>
                  <ul className="mt-2 space-y-1">
                    {verificationResults.errors.map((error: string, index: number) => (
                      <li key={index} className="text-sm">• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Contract Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Addresses Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(verificationResults.addresses).map(([name, info]: [string, any]) => (
                    <div key={name} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-white">{name}</div>
                        <div className="text-xs text-gray-400 font-mono">{info.address}</div>
                      </div>
                      {getStatusBadge(info.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contract Deployment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Deployment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(verificationResults.contractCode).map(([name, info]: [string, any]) => (
                    <div key={name} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-white">{name.toUpperCase()} Contract</div>
                        <div className="text-xs text-gray-400">
                          {info.codeLength ? `Code Length: ${info.codeLength} bytes` : 'No bytecode'}
                          {info.error && <div className="text-red-400">{info.error}</div>}
                        </div>
                      </div>
                      {getStatusBadge(info.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Read Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Read Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(verificationResults.readOperations).map(([name, info]: [string, any]) => (
                    <div key={name} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-white">{name}</div>
                        <div className="text-xs text-gray-400">
                          {info.data !== undefined ? `Value: ${info.data.toString()}` : 'No data'}
                          {info.error && <div className="text-red-400">{info.error.message}</div>}
                        </div>
                      </div>
                      {getStatusBadge(info.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Network Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Network Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-white">Chain ID</div>
                    <div className="text-sm text-gray-400">
                      Current: {verificationResults.networkInfo.chainId || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-400">
                      Expected: {verificationResults.networkInfo.expectedChainId}
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-white">Network Status</div>
                    <div className="text-sm">
                      {getStatusBadge(verificationResults.networkInfo.status)}
                    </div>
                  </div>
                  {verificationResults.networkInfo.blockNumber && (
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-white">Latest Block</div>
                      <div className="text-sm text-gray-400">#{verificationResults.networkInfo.blockNumber}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Recommendations */}
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Troubleshooting Tips:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• If contracts show "Not Deployed": Contract addresses may be wrong</li>
              <li>• If read operations fail: Check network connection to Somnia RPC</li>
              <li>• If wrong network: Switch wallet to Somnia Testnet (Chain ID: 50312)</li>
              <li>• If contract is paused: Contact contract owner to unpause</li>
            </ul>
          </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}

export default ContractVerificationTest;