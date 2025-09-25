/**
 * IPFS Connection Test Utility
 * Test Pinata IPFS connectivity and upload functionality
 */

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || "";
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_API_SECRET || "";
const PINATA_JWT = import.meta.env.VITE_PINATA_API_JWT || "";
const PINATA_BASE_URL = "https://api.pinata.cloud";

export class IPFSTest {
  /**
   * Test Pinata authentication
   */
  static async testAuthentication(): Promise<{ success: boolean; method: string; error?: string }> {
    try {
      // Test JWT authentication first
      if (PINATA_JWT) {
        const response = await fetch(`${PINATA_BASE_URL}/data/testAuthentication`, {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${PINATA_JWT}`,
          },
        });

        if (response.ok) {
          return { success: true, method: 'JWT' };
        } else {
          console.warn('JWT authentication failed, trying API keys...');
        }
      }

      // Test API key authentication
      if (PINATA_API_KEY && PINATA_SECRET_API_KEY) {
        const response = await fetch(`${PINATA_BASE_URL}/data/testAuthentication`, {
          method: 'GET',
          headers: {
            "pinata_api_key": PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_SECRET_API_KEY,
          },
        });

        if (response.ok) {
          return { success: true, method: 'API_KEYS' };
        } else {
          const errorText = await response.text();
          return { success: false, method: 'API_KEYS', error: `Authentication failed: ${errorText}` };
        }
      }

      return { success: false, method: 'NONE', error: 'No valid credentials found' };
    } catch (error) {
      return { success: false, method: 'ERROR', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Test simple JSON upload to IPFS
   */
  static async testJSONUpload(): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const testData = {
        name: "Test NFT Metadata",
        description: "This is a test metadata upload",
        image: "https://via.placeholder.com/400x400",
        attributes: [
          { trait_type: "Test", value: "True" }
        ]
      };

      // Try JWT first
      if (PINATA_JWT) {
        try {
          const response = await fetch(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${PINATA_JWT}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pinataContent: testData,
              pinataMetadata: {
                name: `test_metadata_${Date.now()}.json`,
                keyvalues: {
                  type: "test-metadata",
                  platform: "HiBeats-Test"
                }
              }
            }),
          });

          if (response.ok) {
            const result = await response.json();
            return { success: true, hash: result.IpfsHash || result.cid };
          } else {
            const errorText = await response.text();
            console.warn('JWT upload failed:', errorText);
          }
        } catch (jwtError) {
          console.warn('JWT upload error:', jwtError);
        }
      }

      // Fallback to API keys
      if (PINATA_API_KEY && PINATA_SECRET_API_KEY) {
        const response = await fetch(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
          method: "POST",
          headers: {
            "pinata_api_key": PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_SECRET_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pinataContent: testData,
            pinataMetadata: {
              name: `test_metadata_${Date.now()}.json`,
              keyvalues: {
                type: "test-metadata",
                platform: "HiBeats-Test"
              }
            }
          }),
        });

        if (response.ok) {
          const result = await response.json();
          return { success: true, hash: result.IpfsHash || result.cid };
        } else {
          const errorText = await response.text();
          return { success: false, error: `API Keys upload failed: ${errorText}` };
        }
      }

      return { success: false, error: 'No valid credentials for upload' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown upload error' };
    }
  }

  /**
   * Run comprehensive IPFS test
   */
  static async runComprehensiveTest(): Promise<{
    authTest: { success: boolean; method: string; error?: string };
    uploadTest: { success: boolean; hash?: string; error?: string };
    recommendations: string[];
  }> {
    console.log('🧪 Running comprehensive IPFS test...');

    const authTest = await this.testAuthentication();
    console.log('🔐 Auth test result:', authTest);

    const uploadTest = await this.testJSONUpload();
    console.log('📤 Upload test result:', uploadTest);

    const recommendations: string[] = [];

    if (!authTest.success) {
      recommendations.push('❌ Authentication failed. Check your Pinata credentials.');

      if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_API_KEY)) {
        recommendations.push('🔑 Missing Pinata credentials. Please add VITE_PINATA_API_JWT or both VITE_PINATA_API_KEY and VITE_PINATA_API_SECRET to your .env file.');
      }

      if (PINATA_JWT) {
        recommendations.push('🕐 Your Pinata JWT might be expired. Try generating a new one from your Pinata dashboard.');
      }
    }

    if (!uploadTest.success) {
      recommendations.push('❌ Upload test failed. This could be due to network issues or Pinata service problems.');

      if (uploadTest.error?.includes('401') || uploadTest.error?.includes('Unauthorized')) {
        recommendations.push('🚫 Unauthorized: Check your Pinata API credentials and permissions.');
      }

      if (uploadTest.error?.includes('429') || uploadTest.error?.includes('rate limit')) {
        recommendations.push('⏳ Rate limit exceeded. Please wait before trying again.');
      }
    }

    if (authTest.success && uploadTest.success) {
      recommendations.push('✅ IPFS is working correctly!');
      recommendations.push(`📦 Test file uploaded with hash: ${uploadTest.hash}`);
    }

    return {
      authTest,
      uploadTest,
      recommendations
    };
  }
}