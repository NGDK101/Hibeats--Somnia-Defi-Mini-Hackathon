import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Factory, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, HIBEATS_FACTORY_ABI } from '@/contracts';
import { useFactoryMint } from '@/hooks/useFactoryMint';
import { formatEther } from 'viem';

export function FactoryMintTest() {
  const { address } = useAccount();
  const [isTestingMint, setIsTestingMint] = useState(false);
  const [testResults, setTestResults] = useState<{
    canAccessContract: boolean;
    canReadFee: boolean;
    directMintFee?: string;
    testMintResult?: { success: boolean; error?: string };
  } | null>(null);

  const factoryMint = useFactoryMint();

  // Read direct mint fee
  const { data: directMintFee, error: feeError } = useReadContract({
    address: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
    abi: HIBEATS_FACTORY_ABI,
    functionName: 'directMintFee',
  });

  const runFactoryTest = async () => {
    setIsTestingMint(true);

    try {
      const results = {
        canAccessContract: !!CONTRACT_ADDRESSES.HIBEATS_FACTORY,
        canReadFee: !!directMintFee && !feeError,
        directMintFee: directMintFee ? formatEther(directMintFee) : 'Unknown',
      };

      // Test actual minting with dummy data
      if (address && directMintFee) {
        try {
          const testParams = {
            to: address,
            metadataURI: 'data:application/json;base64,eyJuYW1lIjoiVGVzdCBORlQiLCJkZXNjcmlwdGlvbiI6IlRlc3QgbWV0YWRhdGEifQ==',
            aiTrackId: `test_${Date.now()}`,
            taskId: `test_task_${Date.now()}`,
            genre: 'Test',
            duration: 30,
            modelUsed: 'Test',
            isRemixable: true,
            royaltyRate: 500, // 5%
            prompt: 'Test prompt',
            tags: 'test,mint',
            aiCreatedAt: Math.floor(Date.now() / 1000),
          };

          console.log('🧪 Testing Factory mint with params:', testParams);
          const mintResult = await factoryMint.directMint(testParams);

          setTestResults({
            ...results,
            testMintResult: mintResult
          });
        } catch (mintError) {
          console.error('❌ Factory mint test failed:', mintError);
          setTestResults({
            ...results,
            testMintResult: {
              success: false,
              error: mintError instanceof Error ? mintError.message : 'Unknown mint error'
            }
          });
        }
      } else {
        setTestResults(results);
      }

    } catch (error) {
      console.error('Factory test failed:', error);
      setTestResults({
        canAccessContract: false,
        canReadFee: false,
        testMintResult: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

    setIsTestingMint(false);
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (success: boolean, text: string) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(success)}
        {text}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-5 w-5" />
          Factory Contract Test
        </CardTitle>
        <CardDescription>
          Test Factory contract access and direct minting functionality (no authorization required)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Current Status</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Wallet Connected</span>
              <Badge variant={address ? "default" : "secondary"}>
                {address ? '✅' : '❌'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Factory Address</span>
              <Badge variant={CONTRACT_ADDRESSES.HIBEATS_FACTORY ? "default" : "secondary"}>
                {CONTRACT_ADDRESSES.HIBEATS_FACTORY ? '✅' : '❌'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Can Read Fee</span>
              <Badge variant={directMintFee && !feeError ? "default" : "secondary"}>
                {directMintFee && !feeError ? '✅' : '❌'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Direct Mint Fee</span>
              <Badge variant={directMintFee ? "default" : "secondary"}>
                {directMintFee ? `${formatEther(directMintFee)} STT` : 'Unknown'}
              </Badge>
            </div>
          </div>

          {/* Error details */}
          {feeError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Fee Error:</strong> {feeError.message || 'Unknown error reading fee'}
              </AlertDescription>
            </Alert>
          )}

          {!CONTRACT_ADDRESSES.HIBEATS_FACTORY && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Config Error:</strong> Factory contract address not set. Please check .env file.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Button
          onClick={runFactoryTest}
          disabled={isTestingMint || !address}
          className="w-full"
        >
          {isTestingMint ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing Factory Mint...
            </>
          ) : (
            <>
              <Factory className="h-4 w-4 mr-2" />
              Test Factory Mint (No Auth Required)
            </>
          )}
        </Button>

        {!address && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Please connect your wallet to test Factory minting functionality.
            </AlertDescription>
          </Alert>
        )}

        {testResults && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Test Results</h4>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Contract Access</span>
                {getStatusBadge(testResults.canAccessContract, testResults.canAccessContract ? '✅ Success' : '❌ Failed')}
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Fee Reading</span>
                {getStatusBadge(testResults.canReadFee, testResults.canReadFee ? '✅ Success' : '❌ Failed')}
              </div>

              {testResults.directMintFee && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>Direct Mint Fee:</strong> {testResults.directMintFee} STT
                </div>
              )}

              {testResults.testMintResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Test Mint Transaction</span>
                    {getStatusBadge(testResults.testMintResult.success, testResults.testMintResult.success ? '✅ Success' : '❌ Failed')}
                  </div>

                  {testResults.testMintResult.error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {testResults.testMintResult.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {testResults.testMintResult.success && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        🎉 Factory minting works! No authorization required. Users can mint NFTs directly.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Factory Contract Info</h4>
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded space-y-1">
            <div><strong>Address:</strong> {CONTRACT_ADDRESSES.HIBEATS_FACTORY}</div>
            <div><strong>Network:</strong> Somnia Testnet (Chain ID: 50312)</div>
            <div><strong>Function:</strong> directMint (payable)</div>
            <div><strong>Authorization:</strong> Not required ✅</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FactoryMintTest;