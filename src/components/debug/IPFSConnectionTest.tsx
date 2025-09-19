import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wifi, WifiOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { IPFSTest } from '@/utils/IPFSTest';

export function IPFSConnectionTest() {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    authTest: { success: boolean; method: string; error?: string };
    uploadTest: { success: boolean; hash?: string; error?: string };
    recommendations: string[];
  } | null>(null);

  const runTest = async () => {
    setIsTesting(true);
    try {
      const results = await IPFSTest.runComprehensiveTest();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        authTest: { success: false, method: 'ERROR', error: 'Test failed to run' },
        uploadTest: { success: false, error: 'Test failed to run' },
        recommendations: ['❌ Failed to run IPFS test. Check console for details.']
      });
    }
    setIsTesting(false);
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
          <Wifi className="h-5 w-5" />
          IPFS Connection Test
        </CardTitle>
        <CardDescription>
          Test your Pinata IPFS configuration and upload capabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={runTest}
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing IPFS Connection...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 mr-2" />
              Run IPFS Test
            </>
          )}
        </Button>

        {testResults && (
          <div className="space-y-4">
            {/* Authentication Test Results */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Authentication Test</h4>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Pinata Authentication</span>
                {getStatusBadge(testResults.authTest.success, testResults.authTest.success ? `✅ ${testResults.authTest.method}` : '❌ Failed')}
              </div>
              {testResults.authTest.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {testResults.authTest.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Upload Test Results */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Upload Test</h4>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">JSON Upload to IPFS</span>
                {getStatusBadge(testResults.uploadTest.success, testResults.uploadTest.success ? '✅ Success' : '❌ Failed')}
              </div>
              {testResults.uploadTest.hash && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                  <strong>IPFS Hash:</strong> {testResults.uploadTest.hash}
                </div>
              )}
              {testResults.uploadTest.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {testResults.uploadTest.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recommendations</h4>
              <div className="space-y-2">
                {testResults.recommendations.map((rec, index) => (
                  <Alert key={index} variant={rec.includes('✅') ? "default" : "destructive"}>
                    <AlertDescription className="text-xs">
                      {rec}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            {/* Environment Info */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Environment Configuration</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>API Key</span>
                  <Badge variant={import.meta.env.VITE_PINATA_API_KEY ? "default" : "secondary"}>
                    {import.meta.env.VITE_PINATA_API_KEY ? '✅' : '❌'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>API Secret</span>
                  <Badge variant={import.meta.env.VITE_PINATA_API_SECRET ? "default" : "secondary"}>
                    {import.meta.env.VITE_PINATA_API_SECRET ? '✅' : '❌'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span>JWT Token</span>
                  <Badge variant={import.meta.env.VITE_PINATA_API_JWT ? "default" : "secondary"}>
                    {import.meta.env.VITE_PINATA_API_JWT ? '✅' : '❌'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {!testResults && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Click "Run IPFS Test" to check your Pinata configuration and troubleshoot any IPFS upload issues.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default IPFSConnectionTest;