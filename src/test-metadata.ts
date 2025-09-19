import NFTMetadataTester from './utils/NFTMetadataTester';

/**
 * Simple test runner for NFT metadata functionality
 * Run this to verify that metadata generation and validation works correctly
 */
async function runTests() {
  try {
    console.log('🎵 HiBeats NFT Metadata Test Runner');
    console.log('=====================================\n');

    await NFTMetadataTester.runAllTests();

    console.log('\n✅ All NFT metadata tests passed!');
    console.log('🎉 Ready for production use.');

  } catch (error) {
    console.error('\n❌ NFT metadata tests failed!');
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };