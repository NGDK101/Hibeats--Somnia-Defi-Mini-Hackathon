/**
 * IPFS Gateway Helper Utilities
 * Provides multi-gateway fallback for IPFS content
 */

export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/'
];

/**
 * Extract IPFS hash from various URL formats
 */
export function extractIPFSHash(url: string): string | null {
  if (!url) return null;

  // Remove ipfs:// protocol
  let hash = url.replace(/^ipfs:\/\//, '');

  // Extract hash from gateway URL
  const hashMatch = hash.match(/Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}/);

  return hashMatch ? hashMatch[0] : null;
}

/**
 * Convert IPFS URL to gateway URL
 * Defaults to Pinata gateway (most reliable for uploaded content)
 */
export function ipfsToGatewayUrl(ipfsUrl: string, gatewayIndex: number = 0): string {
  if (!ipfsUrl) return '';

  const hash = extractIPFSHash(ipfsUrl);
  if (!hash) return ipfsUrl; // Return original if not IPFS

  return `${IPFS_GATEWAYS[gatewayIndex]}${hash}`;
}

/**
 * Get all possible gateway URLs for an IPFS hash
 */
export function getAllGatewayUrls(ipfsUrl: string): string[] {
  const hash = extractIPFSHash(ipfsUrl);
  if (!hash) return [ipfsUrl];

  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}

/**
 * Check if URL is an IPFS URL
 */
export function isIPFSUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('ipfs://') || url.includes('/ipfs/') || /Qm[1-9A-HJ-NP-Za-km-z]{44,}/.test(url);
}