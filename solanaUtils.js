// Import necessary modules
const { Connection, clusterApiUrl, Keypair, PublicKey, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpLQtRect'); // Corrected Token 2022 Program ID
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } = require('@solana/spl-token');
const bs58 = require('bs58'); // <--- THIS IS THE ONLY IMPORT FOR BS58.

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
    // Keypair is available from the top-level import.

    if (!privateKeyB58) {
        throw new Error('Private key string is empty or undefined.');
    }
    if (typeof privateKeyB58 !== 'string') {
        throw new Error('Private key must be a string.');
    }

    try {
        // Ensure bs58 is required at the top of the file as: const bs58 = require('bs58');
        if (!bs58.default || typeof bs58.default.decode !== 'function') {
            throw new Error('bs58.default.decode is not a function. Check bs58 library installation and version.');
        }
        const privateKeyBytes = bs58.default.decode(privateKeyB58);

        // The spec asks to ensure Keypair.fromSecretKey uses the Keypair from the top-level import.
        // The original code already does this correctly.
        // We also need to ensure the privateKeyBytes are of the correct length (64 bytes for a secret key)
        if (privateKeyBytes.length !== 64) {
          throw new Error('Invalid private key length after decoding. Expected 64 bytes.');
        }
        return Keypair.fromSecretKey(privateKeyBytes);
    } catch (error) {
        console.error('Error decoding private key or creating keypair:', error.message);
        // Add more context to the error if bs58.decode specifically fails
        // Updated error check to align with the new bs58.default.decode usage
        if (error.message.includes('bs58.default.decode is not a function') || error.message.includes('decode')) {
             throw new Error(`Failed to decode private key with bs58.default.decode. Error: ${error.message}`);
        }
        throw new Error(`Invalid private key: ${error.message}`);
    }
}

/**
 * Gets an existing Associated Token Account (ATA) or creates it if it doesn't exist.
 * This function now supports Token 2022.
 *
 * @param {Connection} connection - The Solana Connection object.
 * @param {Keypair} payerKeypair - The Keypair of the account that will pay for the transaction and own the ATA.
 * @param {string} tokenMintAddress - The Base58 string of the token mint's public key.
 * @returns {Promise<object>} An object containing the ATA address, status ('exists' or 'created'),
 *                            and signature (if created), or an error object.
 */
async function getOrCreateAssociatedTokenAccount(connection, payerKeypair, tokenMintAddress) {
  // PublicKey, getAssociatedTokenAddress etc. are available from top-level imports.
  let tokenMintPublicKey;
  try {
    tokenMintPublicKey = new PublicKey(tokenMintAddress);
  } catch (error) {
    console.error('Invalid token mint address:', tokenMintAddress, error);
    return { error: true, message: `Invalid token mint address: ${tokenMintAddress}`, details: error.message };
  }

  let ataAddress;
  try {
    // Updated to include TOKEN_2022_PROGRAM_ID
    ataAddress = await getAssociatedTokenAddress(
      tokenMintPublicKey,
      payerKeypair.publicKey,
      false, // allowOwnerOffCurve
      TOKEN_2022_PROGRAM_ID // Pass the Token 2022 Program ID
    );
  } catch (error) {
    console.error('Failed to get associated token address:', error);
    return { error: true, message: 'Failed to derive ATA address.', details: error.message };
  }

  try {
    // Check if account already exists
    // getAccount is imported from @solana/spl-token
    // For Token-2022, the account check might need to consider the program ID if getAccount defaults to TOKEN_PROGRAM_ID
    // However, getAccount itself should work if the ATA address is correctly derived for Token-2022.
    await getAccount(connection, ataAddress, undefined, TOKEN_2022_PROGRAM_ID); // Pass program ID to getAccount
    // If getAccount doesn't throw, the account exists
    return { address: ataAddress.toBase58(), signature: null, status: 'exists' };
  } catch (error) {
    // Handle TokenAccountNotFoundError (or similar errors indicating account not found)
    const accountNotFoundErrorMessages = [
        "Account does not exist",
        "could not find account",
        "TokenAccountNotFoundError",
        "Invalid param: could not find account"
    ];

    const isNotFoundError = error.name === 'TokenAccountNotFoundError' ||
                           (error.message && accountNotFoundErrorMessages.some(msg => error.message.includes(msg)));

    if (isNotFoundError) {
      // Account does not exist, proceed to create it
      console.log(`ATA ${ataAddress.toBase58()} for mint ${tokenMintAddress} (Token-2022) and owner ${payerKeypair.publicKey.toBase58()} does not exist. Creating it...`);
      try {
        // Fetch latest blockhash (Blockhash logic is present)
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

        const transaction = new Transaction({
            feePayer: payerKeypair.publicKey,
            blockhash: blockhash, // Assign the fetched blockhash
            lastValidBlockHeight: lastValidBlockHeight, // Assign the last valid block height
        }).add(
            // Updated to include TOKEN_2022_PROGRAM_ID
            createAssociatedTokenAccountInstruction(
                payerKeypair.publicKey, // payer
                ataAddress,             // ata
                payerKeypair.publicKey, // owner
                tokenMintPublicKey,     // mint
                TOKEN_2022_PROGRAM_ID   // token program id
            )
        );

        const signature = await sendAndConfirmTransaction(connection, transaction, [payerKeypair]);
        console.log(`ATA (Token-2022) created successfully. Signature: ${signature}`);
        return { address: ataAddress.toBase58(), signature, status: 'created' };
      } catch (creationError) {
        console.error('Failed to create ATA (Token-2022):', creationError);
        // It's good to check if creationError has more details like logs
        if (creationError.logs) {
            console.error("Transaction Logs:", creationError.logs);
        }
        if (creationError.getLogs) { // For SendTransactionError
             try {
                const logs = await creationError.getLogs(connection);
                console.error("Transaction Logs (from getLogs):", logs);
             } catch (logError) {
                console.error("Error fetching logs:", logError);
             }
        }
        return { error: true, message: `Failed to create ATA (Token-2022): ${creationError.message}`, details: creationError };
      }
    } else {
      // Some other error occurred when trying to fetch the account
      console.error(`Error checking for ATA (Token-2022) ${ataAddress.toBase58()}:`, error);
      return { error: true, message: `Error checking ATA (Token-2022): ${error.message}`, details: error };
    }
  }
}

// Make sure to export the functions:
module.exports = {
    initializeConnection,
    loadKeypairFromPrivateKey,
    getOrCreateAssociatedTokenAccount
};
