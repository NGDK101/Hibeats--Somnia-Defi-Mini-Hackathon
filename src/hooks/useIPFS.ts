import { useState } from 'react';

export interface IPFSUploadResult {
  hash: string;
  url: string;
  size: number;
}

export const useIPFS = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // IPFS Gateway URLs - using multiple for redundancy
  const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://nftstorage.link/ipfs/'
  ];

  const uploadToIPFS = async (file: File, retryCount: number = 0): Promise<IPFSUploadResult> => {
    const MAX_RETRIES = 3;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Using Pinata IPFS service for reliable uploads
      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          platform: 'hibeats',
          type: 'profile-media',
          timestamp: Date.now().toString(),
          attempt: (retryCount + 1).toString(),
          cached: 'true'
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 85));
      }, 300);

      // Actual Pinata API call
      const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
      const pinataApiSecret = import.meta.env.VITE_PINATA_API_SECRET;
      
      if (!pinataApiKey || !pinataApiSecret) {
        clearInterval(progressInterval);
        throw new Error('Pinata API credentials not found in environment variables');
      }

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataApiSecret,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        clearInterval(progressInterval);
        throw new Error(`Pinata upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.IpfsHash) {
        throw new Error('Invalid response from Pinata: no IPFS hash received');
      }

      const ipfsHash = result.IpfsHash;
      const ipfsUrl = getIPFSUrl(ipfsHash);

      return {
        hash: ipfsHash,
        url: ipfsUrl,
        size: file.size
      };
    } catch (error) {
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return uploadToIPFS(file, retryCount + 1);
      }
      
      // If all retries failed
      throw new Error(`IPFS upload failed after ${MAX_RETRIES + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const uploadJSONToIPFS = async (data: object): Promise<IPFSUploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
      const pinataApiSecret = import.meta.env.VITE_PINATA_API_SECRET;
      
      if (!pinataApiKey || !pinataApiSecret) {
        throw new Error('Pinata API credentials not found in environment variables');
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 80));
      }, 200);

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataApiSecret,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: 'hibeats-metadata.json',
            keyvalues: {
              platform: 'hibeats',
              type: 'metadata',
              timestamp: Date.now().toString()
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Pinata JSON upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      clearInterval(progressInterval);
      setUploadProgress(100);

      const ipfsHash = result.IpfsHash;
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      const jsonString = JSON.stringify(data);

      return {
        hash: ipfsHash,
        url: ipfsUrl,
        size: new Blob([jsonString]).size
      };
    } catch (error) {
      throw new Error(`Failed to upload JSON to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const getIPFSUrl = (hash: string, gatewayIndex: number = 0): string => {
    // Remove any 'ipfs://' prefix if present
    const cleanHash = hash.replace(/^ipfs:\/\//, '');

    // Extract just the hash part if it's a full IPFS URL
    const hashMatch = cleanHash.match(/Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|[a-f0-9]{64}/);
    const finalHash = hashMatch ? hashMatch[0] : cleanHash;

    // ALWAYS use Pinata dedicated gateway for uploaded files (most reliable)
    return `https://gateway.pinata.cloud/ipfs/${finalHash}`;
  };

  const getAllIPFSUrls = (hash: string): string[] => {
    return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
  };

  const getFromIPFS = async (hash: string | undefined): Promise<any> => {
    if (!hash) {
      throw new Error('No IPFS hash provided');
    }

    try {
      // Convert to string if it's not already
      const hashStr = typeof hash === 'string' ? hash : String(hash);

      // Clean the hash
      const cleanHash = hashStr.replace(/^ipfs:\/\//, '');

      // Try multiple gateways for redundancy
      const errors: Error[] = [];

      for (const gateway of IPFS_GATEWAYS) {
        try {
          const url = `${gateway}${cleanHash}`;

          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`Gateway ${gateway} returned ${response.status}`);
          }

          const data = await response.json();
          return data;
        } catch (err) {
          errors.push(err instanceof Error ? err : new Error(String(err)));
          continue;
        }
      }

      // If all gateways failed
      throw new Error(`Failed to fetch from all IPFS gateways. Errors: ${errors.map(e => e.message).join(', ')}`);
    } catch (error) {
      throw error;
    }
  };

  const resizeImage = async (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          }
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  return {
    uploadToIPFS,
    uploadJSONToIPFS,
    getIPFSUrl,
    getAllIPFSUrls,
    getFromIPFS,
    resizeImage,
    isUploading,
    uploadProgress
  };
};