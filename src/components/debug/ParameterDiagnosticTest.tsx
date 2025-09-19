import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Wrench, CheckCircle, XCircle, AlertCircle, Code } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useFactoryMint } from '@/hooks/useFactoryMint';
import { CONTRACT_ADDRESSES, HIBEATS_FACTORY_ABI } from '@/contracts';
import { isAddress } from 'viem';

export function ParameterDiagnosticTest() {
  const { address } = useAccount();
  const factoryMint = useFactoryMint();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Test parameters
  const [testParams] = useState({
    to: address || '0x742d35Cc675C4aA3Be9Df0F1B8E9A53B8B9C4e39',
    metadataURI: 'data:application/json;base64,eyJuYW1lIjoiVGVzdCBORlQiLCJkZXNjcmlwdGlvbiI6IlRlc3QgbWV0YWRhdGEifQ==',
    aiTrackId: `test_track_${Date.now()}`,
    taskId: `test_task_${Date.now()}`,
    genre: 'Electronic',
    duration: 30,
    modelUsed: 'V4',
    isRemixable: true,
    royaltyRate: 500, // 5% in basis points
    prompt: 'Test prompt for diagnostic',
    tags: 'test,diagnostic,nft',
    aiCreatedAt: Math.floor(Date.now() / 1000),
  });

  const runParameterDiagnostic = async () => {
    setIsTesting(true);
    const results: any = {
      parameterValidation: {},
      contractCall: {},
      errorAnalysis: {},
      suggestions: [],
    };

    try {
      console.log('🔧 Step 1: Validating parameters...');

      // 1. Parameter validation
      results.parameterValidation = {
        to: {
          value: testParams.to,
          isValid: isAddress(testParams.to),
          status: isAddress(testParams.to) ? '✅ Valid Address' : '❌ Invalid Address'
        },
        metadataURI: {
          value: testParams.metadataURI,
          isValid: testParams.metadataURI.length > 0,
          status: testParams.metadataURI.length > 0 ? '✅ Valid URI' : '❌ Empty URI'
        },
        aiTrackId: {
          value: testParams.aiTrackId,
          isValid: testParams.aiTrackId.length > 0,
          status: testParams.aiTrackId.length > 0 ? '✅ Valid Track ID' : '❌ Empty Track ID'
        },
        taskId: {
          value: testParams.taskId,
          isValid: testParams.taskId.length > 0,
          status: testParams.taskId.length > 0 ? '✅ Valid Task ID' : '❌ Empty Task ID'
        },
        genre: {
          value: testParams.genre,
          isValid: testParams.genre.length > 0,
          status: testParams.genre.length > 0 ? '✅ Valid Genre' : '❌ Empty Genre'
        },
        duration: {
          value: testParams.duration,
          isValid: testParams.duration > 0,
          status: testParams.duration > 0 ? '✅ Valid Duration' : '❌ Invalid Duration'
        },
        modelUsed: {
          value: testParams.modelUsed,
          isValid: testParams.modelUsed.length > 0,
          status: testParams.modelUsed.length > 0 ? '✅ Valid Model' : '❌ Empty Model'
        },
        royaltyRate: {
          value: testParams.royaltyRate,
          isValid: testParams.royaltyRate >= 0 && testParams.royaltyRate <= 10000,
          status: (testParams.royaltyRate >= 0 && testParams.royaltyRate <= 10000) ?
            '✅ Valid Rate (0-10000 basis points)' : '❌ Invalid Rate (must be 0-10000)'
        },
        prompt: {
          value: testParams.prompt,
          isValid: testParams.prompt.length > 0,
          status: testParams.prompt.length > 0 ? '✅ Valid Prompt' : '❌ Empty Prompt'
        },
        tags: {
          value: testParams.tags,
          isValid: testParams.tags.length > 0,
          status: testParams.tags.length > 0 ? '✅ Valid Tags' : '❌ Empty Tags'
        },
        aiCreatedAt: {
          value: testParams.aiCreatedAt,
          isValid: testParams.aiCreatedAt > 0,
          status: testParams.aiCreatedAt > 0 ? '✅ Valid Timestamp' : '❌ Invalid Timestamp'
        }
      };

      // 2. Contract call diagnostic
      console.log('🔧 Step 2: Testing contract call...');
      results.contractCall = {
        contractAddress: CONTRACT_ADDRESSES.HIBEATS_FACTORY,
        function: 'directMint',
        parameters: testParams,
        fee: factoryMint.directMintFee?.toString() || 'Unknown',
        status: 'Preparing...'
      };

      // 3. Try the actual mint (in simulation mode if possible)
      try {
        console.log('🔧 Step 3: Attempting direct mint call...');

        // Log the exact parameters being sent
        console.log('Parameters being sent to contract:', {
          to: testParams.to,
          metadataURI: testParams.metadataURI,
          aiTrackId: testParams.aiTrackId,
          taskId: testParams.taskId,
          genre: testParams.genre,
          duration: BigInt(testParams.duration),
          modelUsed: testParams.modelUsed,
          isRemixable: testParams.isRemixable,
          royaltyRate: BigInt(testParams.royaltyRate),
          prompt: testParams.prompt,
          tags: testParams.tags,
          aiCreatedAt: BigInt(testParams.aiCreatedAt)
        });

        const mintResult = await factoryMint.directMint(testParams);

        results.contractCall.status = mintResult.success ? '✅ Success' : '❌ Failed';
        results.contractCall.result = mintResult;

        if (!mintResult.success) {
          results.errorAnalysis = {
            error: mintResult.error,
            possibleCauses: [
              'Contract is paused',
              'Insufficient fee payment',
              'Invalid parameter format',
              'Network connection issues',
              'Contract not deployed',
              'Wallet not connected to correct network'
            ]
          };

          // Specific error analysis
          if (mintResult.error?.includes('insufficient funds')) {
            results.suggestions.push('Ensure wallet has enough STT for minting fee + gas');
          }
          if (mintResult.error?.includes('rejected')) {
            results.suggestions.push('User cancelled transaction - try again');
          }
          if (mintResult.error?.includes('paused')) {
            results.suggestions.push('Contract is paused - contact contract owner');
          }
          if (mintResult.error?.includes('revert')) {
            results.suggestions.push('Contract call reverted - check parameter formats');
          }
        }

      } catch (error) {
        console.error('❌ Direct mint diagnostic failed:', error);
        results.contractCall.status = '❌ Error';
        results.contractCall.error = error instanceof Error ? error.message : 'Unknown error';

        results.errorAnalysis = {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        };

        // Common error patterns
        if (error instanceof Error) {
          if (error.message.includes('CALL_EXCEPTION')) {
            results.suggestions.push('Contract call failed - check contract address and ABI');
          }
          if (error.message.includes('NETWORK_ERROR')) {
            results.suggestions.push('Network connection issue - check RPC endpoint');
          }
          if (error.message.includes('UNPREDICTABLE_GAS_LIMIT')) {
            results.suggestions.push('Transaction will likely fail - check parameters');
          }
        }
      }

      console.log('🔧 Parameter diagnostic results:', results);
      setTestResults(results);

    } catch (error) {
      console.error('❌ Parameter diagnostic failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        parameterValidation: {},
        contractCall: { status: '❌ Failed' },
        errorAnalysis: { error: 'Diagnostic process failed' }
      });
    } finally {
      setIsTesting(false);
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
          <Wrench className="h-5 w-5" />
          Parameter Diagnostic & Error Analysis
        </CardTitle>
        <CardDescription>
          Deep analysis of minting parameters, contract calls, and error diagnosis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Test Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><strong>To:</strong> {testParams.to}</div>
                <div><strong>Track ID:</strong> {testParams.aiTrackId}</div>
                <div><strong>Genre:</strong> {testParams.genre}</div>
                <div><strong>Duration:</strong> {testParams.duration}s</div>
                <div><strong>Model:</strong> {testParams.modelUsed}</div>
                <div><strong>Royalty:</strong> {testParams.royaltyRate} basis points</div>
                <div><strong>Remixable:</strong> {testParams.isRemixable ? 'Yes' : 'No'}</div>
                <div><strong>Timestamp:</strong> {testParams.aiCreatedAt}</div>
              </div>
              <div className="mt-3">
                <strong>Metadata URI:</strong>
                <div className="text-xs text-gray-400 break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  {testParams.metadataURI}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Run Diagnostic */}
        <Button
          onClick={runParameterDiagnostic}
          disabled={isTesting || !address}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Parameter Diagnostic...
            </>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              Run Parameter Diagnostic
            </>
          )}
        </Button>

        {!address && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to run parameter diagnostic test.
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {testResults && (
          <div className="space-y-6">

            {/* Parameter Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parameter Validation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(testResults.parameterValidation).map(([param, info]: [string, any]) => (
                    <div key={param} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-white">{param}</div>
                        <div className="text-xs text-gray-400 break-all">
                          {typeof info.value === 'string' && info.value.length > 50
                            ? `${info.value.substring(0, 50)}...`
                            : info.value?.toString()}
                        </div>
                      </div>
                      {getStatusBadge(info.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contract Call Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Call Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-white">Contract Call Status</div>
                      <div className="text-xs text-gray-400">
                        Function: {testResults.contractCall.function} | Fee: {testResults.contractCall.fee}
                      </div>
                    </div>
                    {getStatusBadge(testResults.contractCall.status)}
                  </div>

                  {testResults.contractCall.result && (
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-white mb-2">Call Result</div>
                      <div className="text-xs text-gray-400">
                        <strong>Success:</strong> {testResults.contractCall.result.success ? 'Yes' : 'No'}
                        {testResults.contractCall.result.error && (
                          <div className="text-red-400 mt-1">
                            <strong>Error:</strong> {testResults.contractCall.result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {testResults.contractCall.error && (
                    <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-medium text-red-800 dark:text-red-200 mb-2">Contract Call Error</div>
                      <div className="text-xs text-red-700 dark:text-red-300">
                        {testResults.contractCall.error}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error Analysis */}
            {testResults.errorAnalysis && testResults.errorAnalysis.error && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Error Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-medium text-red-800 dark:text-red-200 mb-2">Error Details</div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {testResults.errorAnalysis.error}
                      </div>
                      {testResults.errorAnalysis.errorType && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Type: {testResults.errorAnalysis.errorType}
                        </div>
                      )}
                    </div>

                    {testResults.errorAnalysis.possibleCauses && (
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-white mb-2">Possible Causes</div>
                        <ul className="text-sm text-gray-400 space-y-1">
                          {testResults.errorAnalysis.possibleCauses.map((cause: string, index: number) => (
                            <li key={index}>• {cause}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {testResults.errorAnalysis.stack && (
                      <details className="p-3 border rounded-lg">
                        <summary className="font-medium text-white cursor-pointer">Stack Trace</summary>
                        <pre className="text-xs text-gray-400 mt-2 overflow-auto">
                          {testResults.errorAnalysis.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {testResults.suggestions && testResults.suggestions.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Suggested Solutions:</strong>
                  <ul className="mt-2 space-y-1">
                    {testResults.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm">• {suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Debug Info */}
        <Alert>
          <Code className="h-4 w-4" />
          <AlertDescription>
            <strong>Debug Info:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Contract: {CONTRACT_ADDRESSES.HIBEATS_FACTORY}</li>
              <li>• Function: directMint(address,string,string,string,string,uint256,string,bool,uint256,string,string,uint256)</li>
              <li>• Fee Required: {factoryMint.directMintFee?.toString() || 'Loading...'}</li>
              <li>• Network: Somnia Testnet (Chain ID: 50312)</li>
            </ul>
          </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}

export default ParameterDiagnosticTest;