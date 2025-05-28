// Import necessary modules
const { Connection, clusterApiUrl, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccountInfo, getAccount } = require('@solana/spl-token');
const bs58 = require('bs58');

/**
 * Initializes and returns a new Connection to Mainnet-beta.
 * @returns {Connection} Solana Connection object.
 */
function initializeConnection() {
  return new Connection(clusterApiUrl('mainnet-beta'));
}

/**
 * Loads a Keypair from a Base58 encoded private key string.
 * @param {string} privateKeyB58 Base58 encoded private key.
 * @returns {Keypair} Solana Keypair.
 * @throws {Error} If the private key is invalid.
 */
function loadKeypairFromPrivateKey(privateKeyB58) {
  try {
    const privateKeyBytes = bs58.decode(privateKeyB58);
    if (privateKeyBytes.length !== 64) {
      throw new Error('Invalid private key length. Expected 64 bytes.');
    }
    return Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    console.error('Failed to load keypair from private key:', error);
    throw new Error(`Invalid private key: ${error.message}`);
  }
}

/**
 * Gets an existing Associated Token Account (ATA) or creates it if it doesn't exist.
 *
 * @param {Connection} connection - The Solana Connection object.
 * @param {Keypair} payerKeypair - The Keypair of the account that will pay for the transaction and own the ATA.
 * @param {string} tokenMintAddress - The Base58 string of the token mint's public key.
 * @returns {Promise<object>} An object containing the ATA address, status ('exists' or 'created'),
 *                            and signature (if created), or an error object.
 *                            Example success: { address: "...", signature: "...", status: "created" }
 *                            Example error: { error: true, message: "...", details?: any }
 */
async function getOrCreateAssociatedTokenAccount(connection, payerKeypair, tokenMintAddress) {
  let tokenMintPublicKey;
  try {
    tokenMintPublicKey = new PublicKey(tokenMintAddress);
  } catch (error) {
    console.error('Invalid token mint address:', tokenMintAddress, error);
    return { error: true, message: `Invalid token mint address: ${tokenMintAddress}`, details: error.message };
  }

  let ataAddress;
  try {
    ataAddress = await getAssociatedTokenAddress(
      tokenMintPublicKey,
      payerKeypair.publicKey
    );
  } catch (error) {
    console.error('Failed to get associated token address:', error);
    return { error: true, message: 'Failed to derive ATA address.', details: error.message };
  }

  try {
    // Check if account already exists
    const accountInfo = await getAccount(connection, ataAddress);
    // If getAccount doesn't throw, the account exists
    return { address: ataAddress.toBase58(), signature: null, status: 'exists' };
  } catch (error) {
    // Handle TokenAccountNotFoundError (or similar errors indicating account not found)
    // The specific error name/type can vary based on the @solana/spl-token version and Solana RPC node behavior.
    // It's often a generic error with a message like "Account does not exist" or "Could not find account"
    // or a specific error like 'TokenAccountNotFoundError' if the library throws it.
    // For this example, we'll check for common error message patterns or specific error names if available.
    const accountNotFoundErrorMessages = [
        "Account does not exist",
        "could not find account",
        "TokenAccountNotFoundError",
        "Invalid param: could not find account" // Example from some RPCs
    ];

    // Check if the error message or type indicates that the account was not found.
    // This is a common way to check since specific error types might not always be available or consistent.
    const isNotFoundError = error.name === 'TokenAccountNotFoundError' || 
                           (error.message && accountNotFoundErrorMessages.some(msg => error.message.includes(msg)));

    if (isNotFoundError) {
      // Account does not exist, proceed to create it
      console.log(`ATA ${ataAddress.toBase58()} for mint ${tokenMintAddress} and owner ${payerKeypair.publicKey.toBase58()} does not exist. Creating it...`);
      try {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            payerKeypair.publicKey, // Payer
            ataAddress,             // Associated token account address
            payerKeypair.publicKey, // Owner of the new account
            tokenMintPublicKey      // Token mint
          )
        );

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [payerKeypair] // Signers
        );
        console.log(`ATA created successfully. Signature: ${signature}`);
        return { address: ataAddress.toBase58(), signature, status: 'created' };
      } catch (creationError) {
        console.error(`Failed to create ATA ${ataAddress.toBase58()}:`, creationError);
        return { error: true, message: `Failed to create ATA: ${creationError.message}`, details: creationError };
      }
    } else {
      // Some other error occurred when trying to fetch the account
      console.error(`Error checking for ATA ${ataAddress.toBase58()}:`, error);
      return { error: true, message: `Error checking ATA: ${error.message}`, details: error };
    }
  }
}

module.exports = {
  initializeConnection,
  loadKeypairFromPrivateKey,
  getOrCreateAssociatedTokenAccount,
};
