// 1. Imports
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { PublicKey } = require('@solana/web3.js');
const { initializeConnection, loadKeypairFromPrivateKey, getOrCreateAssociatedTokenAccount } = require('./solanaUtils');

// 2. Environment Variable Loading and Validation
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const privateKeyB58 = process.env.SOLANA_PRIVATE_KEY_B58;

if (!botToken || !privateKeyB58) {
  console.error('Error: Missing TELEGRAM_BOT_TOKEN or SOLANA_PRIVATE_KEY_B58 in .env file.');
  process.exit(1);
}

// 3. Initialization
const bot = new TelegramBot(botToken, { polling: true });
const connection = initializeConnection();

let payerKeypair;
try {
  payerKeypair = loadKeypairFromPrivateKey(privateKeyB58);
  console.log(`Bot wallet address: ${payerKeypair.publicKey.toBase58()}`);
  console.log("Bot is running... Waiting for token mint addresses via Telegram.");
} catch (error) {
  console.error('Failed to load payer keypair:', error.message);
  process.exit(1);
}

// 4. Message Handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore messages if text is undefined or null
  if (!text) {
    return;
  }

  const tokenMintAddress = text.trim();

  // Input Validation (Token Mint)
  try {
    new PublicKey(tokenMintAddress); // Validate if it's a PublicKey
  } catch (error) {
    bot.sendMessage(chatId, 'Please send a valid Solana token mint address.');
    return;
  }

  // Processing
  bot.sendMessage(chatId, `Processing token mint: ${tokenMintAddress}\nThis might take a moment...`);

  try {
    const result = await getOrCreateAssociatedTokenAccount(connection, payerKeypair, tokenMintAddress);

    // Handle Response
    if (result.error) {
      bot.sendMessage(chatId, `Error: ${result.message}`);
    } else if (result.status === 'created') {
      bot.sendMessage(chatId, `ATA created successfully!\nAddress: ${result.address}\nTransaction: https://solscan.io/tx/${result.signature}?cluster=mainnet-beta`);
    } else if (result.status === 'exists') {
      bot.sendMessage(chatId, `ATA already exists.\nAddress: ${result.address}`);
    } else {
      // Should not happen if solanaUtils.js is correctly implemented
      console.error('Unexpected result from getOrCreateAssociatedTokenAccount:', result);
      bot.sendMessage(chatId, 'An unexpected result was received from the Solana utility.');
    }
  } catch (error) {
    // Other unexpected errors (catch block)
    console.error('Error processing message:', error);
    bot.sendMessage(chatId, 'An unexpected error occurred. Please check the bot logs.');
  }
});

// 5. Error Handling for Bot
bot.on('polling_error', (error) => console.error(`Polling error: ${error.code} - ${error.message}`));
bot.on('webhook_error', (error) => console.error(`Webhook error: ${error.code} - ${error.message}`));

// Optional: Log when the bot has successfully connected to Telegram
bot.getMe().then((me) => {
  console.log(`Bot @${me.username} has started.`);
}).catch((error) => {
  console.error('Error getting bot info:', error);
});
