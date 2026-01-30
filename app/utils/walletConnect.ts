import { isConnected, getAddress, requestAccess } from "@stellar/freighter-api";
import { Network } from "../../src/config";

/**
 * Checks if Freighter wallet extension is installed
 */
export const isFreighterInstalled = async (): Promise<boolean> => {
  try {
    const result = await isConnected();
    return !result.error && result.isConnected;
  } catch {
    return false;
  }
};

/**
 * Connects to Freighter wallet and returns the user's public key
 * @param _network - The network to connect to (mainnet or testnet)
 * @throws {Error} If wallet is not installed, user rejects connection, or any other error occurs
 */
export const connectFreighter = async (_network: Network): Promise<string> => {
  // Check if Freighter is installed
  const installed = await isFreighterInstalled();

  if (!installed) {
    throw new Error(
      "Freighter wallet not found. Please install the Freighter browser extension.",
    );
  }

  try {
    // Request access to the wallet
    // Note: Freighter API doesn't directly support network parameter in requestAccess,
    // but the network context is available for future network-specific operations
    const accessResult = await requestAccess();

    if (accessResult.error || !accessResult.address) {
      throw new Error(
        "Connection rejected. Please approve the connection in Freighter.",
      );
    }

    // Return the address from requestAccess (it already provides the address)
    // The network parameter can be used for subsequent operations like transaction signing
    return accessResult.address;
  } catch (error: unknown) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message?.includes("User declined")) {
        throw new Error("Connection rejected by user.");
      }
      throw error;
    }

    throw new Error("Failed to connect to Freighter wallet. Please try again.");
  }
};

/**
 * Gets the currently connected public key without requesting access
 * Returns null if not connected or if Freighter is not installed
 */
export const getCurrentPublicKey = async (): Promise<string | null> => {
  try {
    const installed = await isFreighterInstalled();
    if (!installed) {
      return null;
    }

    const addressResult = await getAddress();
    return addressResult.error ? null : addressResult.address;
  } catch {
    return null;
  }
};

/**
 * Validates if a string is a valid Stellar public key address
 * Stellar addresses:
 * - Start with 'G'
 * - Are exactly 56 characters long
 * - Use base32 encoding (characters A-Z and 2-7)
 * @param address The address string to validate
 * @returns True if valid Stellar address, false otherwise
 */
export const isValidStellarAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") {
    return false;
  }

  const trimmedAddress = address.trim();

  // Check if starts with 'G' and is 56 characters
  if (!trimmedAddress.startsWith("G") || trimmedAddress.length !== 56) {
    return false;
  }

  // Check if all characters are valid base32 (A-Z, 2-7)
  const base32Regex = /^[A-Z2-7]{56}$/;
  return base32Regex.test(trimmedAddress);
};
