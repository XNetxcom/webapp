// Import necessary modules
const { PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddressSync } = require('@solana/spl-token');

// Check if exactly two command-line arguments are provided
if (process.argv.length !== 4) {
  console.log('Usage: node create_ata_cli.js <WALLET_PUBLIC_KEY> <TOKEN_MINT_PUBLIC_KEY>');
  process.exit(1);
}

// Store the provided command-line arguments
const userWalletAddress = process.argv[2];
const tokenMintAddress = process.argv[3];

// Validate and convert userWalletAddress to PublicKey
let userWalletPublicKey;
try {
  userWalletPublicKey = new PublicKey(userWalletAddress);
} catch (error) {
  console.error(`Error: Invalid Solana public key provided for wallet: ${userWalletAddress}`);
  process.exit(1);
}

// Validate and convert tokenMintAddress to PublicKey
let tokenMintPublicKey;
try {
  tokenMintPublicKey = new PublicKey(tokenMintAddress);
} catch (error) {
  console.error(`Error: Invalid Solana public key provided for token mint: ${tokenMintAddress}`);
  process.exit(1);
}

// Derive the Associated Token Account (ATA) address
const ataAddress = getAssociatedTokenAddressSync(tokenMintPublicKey, userWalletPublicKey);

// Print the derived ATA address
console.log(`Derived ATA Address: ${ataAddress.toBase58()}`);

// Print the Solana CLI command to create the ATA
console.log("\nSolana CLI command to create the Associated Token Account (ATA):");
console.log("------------------------------------------------------------------");
console.log(`spl-token create-associated-token-account --owner ${userWalletAddress} --mint ${tokenMintAddress} --fee-payer <FEE_PAYER_KEYPAIR_PATH_OR_SIGNER>`);
console.log("------------------------------------------------------------------");
console.log("\nImportant Notes:");
console.log("1. Replace <FEE_PAYER_KEYPAIR_PATH_OR_SIGNER> with your actual fee payer keypair path (e.g., ~/.config/solana/id.json) or a specific keypair file.");
console.log("2. Ensure your Solana CLI is configured for the correct network (e.g., mainnet-beta: solana config set --url https://api.mainnet-beta.solana.com).");
console.log("3. The owner specified is the account that will own the new ATA.");
console.log("4. The fee payer is the account that will pay for the transaction fees.");
