# Solana ATA Creation Telegram Bot

This Telegram bot listens for Solana token mint addresses and automatically creates (or confirms existence of) the Associated Token Account (ATA) for that token using a pre-configured wallet.

**NETWORK: SOLANA MAINNET-BETA**

## Features

*   Receives token mint addresses via Telegram messages.
*   Derives and creates the Associated Token Account (ATA) if it doesn't exist.
*   Informs if the ATA already exists.
*   Uses a Solana wallet (specified by a private key in a `.env` file) to pay for transaction fees and own the ATAs.
*   Provides feedback directly in the Telegram chat, including transaction links on Solscan.

## Prerequisites

1.  **Node.js and npm:** Ensure Node.js (version 16.x or higher recommended) and npm are installed. [Download Node.js](https://nodejs.org/)
2.  **Telegram Bot Token:** You need to create a bot via BotFather on Telegram to get a `TELEGRAM_BOT_TOKEN`. [Instructions from Telegram](https://core.telegram.org/bots#6-botfather)
3.  **Solana Wallet & Private Key:**
    *   A Solana wallet (Keypair). This wallet will be used to pay transaction fees and will be the owner of the created ATAs.
    *   **CRITICAL:** This wallet **MUST** have SOL tokens to cover transaction fees on Mainnet-beta.
    *   You will need the **Base58 encoded private key** of this wallet.

## Setup Instructions

1.  **Clone or Download:**
    *   Clone this repository or download the project files (`bot.js`, `solanaUtils.js`, `package.json`).

2.  **Install Dependencies:**
    *   Navigate to the project directory in your terminal and run:
        ```bash
        npm install
        ```

3.  **Configure Environment Variables:**
    *   Create a file named `.env` in the root of the project directory.
    *   Copy the content from `.env.example` into your new `.env` file.
    *   **Edit `.env` and fill in your actual values:**
        ```env
        TELEGRAM_BOT_TOKEN=YOUR_ACTUAL_TELEGRAM_BOT_TOKEN_HERE
        SOLANA_PRIVATE_KEY_B58=YOUR_ACTUAL_SOLANA_WALLET_PRIVATE_KEY_IN_BASE58_HERE
        ```
    *   **SECURITY: Treat your `.env` file like a password. Keep it secret and never commit it to version control.**

## Running the Bot

1.  **Start the Bot:**
    *   Open your terminal in the project directory and run:
        ```bash
        node bot.js
        ```
    *   If successful, you should see a message like:
        `Bot wallet address: <YOUR_BOTS_WALLET_PUBLIC_KEY>`
        `Bot is running... Waiting for token mint addresses via Telegram.`

2.  **Interact with the Bot:**
    *   Open Telegram and find your bot.
    *   Send it a valid Solana token mint address (Base58 string).
    *   The bot will respond with the status of the ATA creation.

## !! IMPORTANT SECURITY WARNINGS !!

*   **PRIVATE KEY SECURITY:** The `SOLANA_PRIVATE_KEY_B58` in your `.env` file gives full control over your Solana wallet.
    *   **NEVER share this private key.**
    *   **NEVER commit the `.env` file to Git or any public repository.** The `.gitignore` file is set up to prevent this, but always double-check.
    *   Ensure the server or computer where this bot runs is secure. Unauthorized access to the server could expose your `.env` file and private key.
*   **MAINNET BOT:** This bot is configured to operate on Solana **Mainnet-beta**. All transactions are real and will cost SOL.
*   **DEDICATED WALLET RECOMMENDED:** It is strongly recommended to use a **dedicated Solana wallet** for this bot with a **limited amount of SOL** sufficient only for expected transaction fees. Do not use a wallet that holds significant personal funds.
*   **NO WARRANTY:** This script is provided as-is. You are solely responsible for its use and any potential loss of funds.

## Troubleshooting

*   **"Missing TELEGRAM_BOT_TOKEN or SOLANA_PRIVATE_KEY_B58"**: Ensure your `.env` file is correctly named, in the root project directory, and contains the required variables.
*   **"Failed to load payer keypair"**: Double-check that `SOLANA_PRIVATE_KEY_B58` in your `.env` file is a correct Base58 private key.
*   **Insufficient Funds**: If the bot fails to create ATAs, ensure the bot's wallet has enough SOL for transaction fees.
*   **Telegram Bot Errors (`polling_error`)**: Check your internet connection and ensure your `TELEGRAM_BOT_TOKEN` is correct and the bot is not being run in multiple places simultaneously with polling.
