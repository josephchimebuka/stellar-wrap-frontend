import { StrKey } from 'stellar-sdk';
import { Network } from '../config';

export type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid' | 'invalid-format' | 'wrong-network' | 'not-found' | 'indexing' | 'error';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  state: ValidationState;
}

/**
 * Validates a Stellar public key (address) format with network-specific checks
 * @param address The string to validate
 * @param network The current network context (mainnet/testnet)
 * @returns ValidationResult containing status and optional error message
 */
export const validateStellarAddress = (address: string, _network: Network): ValidationResult => {
  if (!address || address.trim() === '') {
    return {
      isValid: false,
      state: 'idle'
    };
  }

  const trimmedAddress = address.trim();

  // Length check: Stellar addresses are always 56 characters
  if (trimmedAddress.length !== 56) {
    return {
      isValid: false,
      error: `Invalid address length. Expected 56 characters, got ${trimmedAddress.length}`,
      state: 'invalid-format'
    };
  }

  // Check address prefix
  const firstChar = trimmedAddress[0];
  
  // Basic check: must start with G (Ed25519) or M (Muxed)
  if (firstChar !== 'G' && firstChar !== 'M') {
    return {
      isValid: false,
      error: 'Stellar address must start with G (mainnet/testnet) or M (muxed account)',
      state: 'invalid-format'
    };
  }

  try {
    // Validate address format using Stellar SDK
    if (firstChar === 'G') {
      if (!StrKey.isValidEd25519PublicKey(trimmedAddress)) {
         return {
          isValid: false,
          error: 'Invalid Stellar address format - checksum validation failed',
          state: 'invalid-format'
        };
      }
    } 
    // Check Muxed Account
    else if (firstChar === 'M') {
      if (!StrKey.isValidMed25519PublicKey(trimmedAddress)) {
        return {
          isValid: false,
          error: 'Invalid Stellar muxed address format - checksum validation failed',
          state: 'invalid-format'
        };
      }
    }
    
    // Network-specific validation
    // Note: Both mainnet and testnet use 'G' prefix for regular addresses
    // Testnet doesn't have a distinct prefix, so we rely on network context
    // The actual network validation happens when checking account existence
    
    // Format is valid, proceed to network validation
    return {
      isValid: true,
      state: 'validating' // Transition to network existence check
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid Stellar address format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      state: 'invalid-format'
    };
  }
};

/**
 * Check if an address prefix matches the expected network
 * Note: Stellar mainnet and testnet both use 'G' prefix, so this primarily
 * validates format. Network existence is checked via Horizon API.
 * @param address The Stellar address
 * @param network The expected network
 * @returns true if prefix is valid for the network
 */
export const isAddressPrefixValidForNetwork = (address: string, _network: Network): boolean => {
  if (!address || address.length === 0) return false;
  
  const prefix = address[0];
  
  // Both mainnet and testnet use 'G' for Ed25519 public keys
  // 'M' is for muxed accounts on both networks
  if (prefix === 'G' || prefix === 'M') {
    return true;
  }
  
  return false;
};
