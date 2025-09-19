import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug, Factory, Users, TestTube, Search, Wrench } from 'lucide-react';
import { FactoryMintTest } from '@/components/debug/FactoryMintTest';
import { UniversalNFTTest } from '@/components/debug/UniversalNFTTest';
import { ContractVerificationTest } from '@/components/debug/ContractVerificationTest';
import { ParameterDiagnosticTest } from '@/components/debug/ParameterDiagnosticTest';

export function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Bug className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-white">HiBeats Debug Center</h1>
        </div>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Comprehensive testing suite for Factory minting, universal access, and NFT operations.
          Verify that all users can mint, list, and manage NFTs without ownership restrictions.
        </p>
      </div>

      {/* Debug Tabs */}
      <Tabs defaultValue="verification" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Contract Verification
          </TabsTrigger>
          <TabsTrigger value="parameters" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Parameter Analysis
          </TabsTrigger>
          <TabsTrigger value="factory" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Factory Test
          </TabsTrigger>
          <TabsTrigger value="universal" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Universal Access
          </TabsTrigger>
        </TabsList>

        {/* Contract Verification */}
        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Contract Deployment & Network Verification
              </CardTitle>
              <CardDescription>
                Deep diagnosis of contract deployment, network connection, and potential minting issues.
                Run this first if minting is failing to identify root causes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractVerificationTest />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parameter Analysis */}
        <TabsContent value="parameters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Parameter Analysis & Error Diagnosis
              </CardTitle>
              <CardDescription>
                Detailed analysis of minting parameters, contract call validation, and specific error diagnosis.
                Use this if verification passes but minting still fails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParameterDiagnosticTest />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factory Contract Test */}
        <TabsContent value="factory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Factory Contract Testing
              </CardTitle>
              <CardDescription>
                Test Factory contract connection, fee reading, and direct minting functionality.
                Verify that minting works without requiring individual authorization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FactoryMintTest />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Universal Access Test */}
        <TabsContent value="universal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Universal NFT Access Testing
              </CardTitle>
              <CardDescription>
                Comprehensive test suite to verify that ANY user can perform all NFT operations
                (mint, list, unlist, update price) regardless of ownership status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UniversalNFTTest />
            </CardContent>
          </Card>

          {/* Test Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Expected Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✅ What Should Work</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• ANY user can mint NFTs via Factory contract</li>
                    <li>• ANY user can list NFTs on marketplace</li>
                    <li>• ANY user can unlist NFTs from marketplace</li>
                    <li>• ANY user can update NFT prices</li>
                    <li>• No authorization or ownership checks</li>
                  </ul>
                </div>

                <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📋 Requirements</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Wallet connected to Somnia Testnet</li>
                    <li>• Minimum ~0.006 STT for fees + gas</li>
                    <li>• Valid contract addresses in .env</li>
                    <li>• Factory contract deployed and accessible</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Troubleshooting</h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <li>• If contract connection fails: Check .env addresses</li>
                  <li>• If transactions fail: Ensure sufficient STT balance</li>
                  <li>• If unauthorized errors: Verify using Factory contract, not direct NFT contract</li>
                  <li>• If fee reading fails: Check network connection and RPC</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded-lg text-center">
              <div className="font-medium text-white mb-1">Network</div>
              <div className="text-blue-400">Somnia Testnet (50312)</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="font-medium text-white mb-1">Minting Method</div>
              <div className="text-green-400">Factory Contract (No Auth)</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="font-medium text-white mb-1">Access Level</div>
              <div className="text-purple-400">Universal (All Users)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DebugPage;