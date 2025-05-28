# Solana Associated Token Account (ATA) CLI Command Generator

This script helps generate the Solana CLI command needed to create an Associated Token Account (ATA) for a specific token mint and wallet address.

## Prerequisites

Before using this script, ensure you have the following installed:

1.  **Node.js and npm/yarn:** Needed to run the JavaScript script and manage dependencies.
    *   [Node.js download](https://nodejs.org/)
2.  **Solana CLI:** Needed to execute the generated command on the Solana blockchain.
    *   [Solana CLI installation guide](https://docs.solana.com/cli/install)

## Setup

1.  **Clone the repository or download the script:**
    Ensure you have the `create_ata_cli.js` script.

2.  **Install dependencies:**
    Navigate to the directory containing the script and run:
    ```bash
    npm install @solana/web3.js @solana/spl-token
    ```
    or if you prefer yarn:
    ```bash
    yarn add @solana/web3.js @solana/spl-token
    ```

## Usage

1.  **Run the script:**
    Execute the script from your terminal using Node.js, providing your wallet's public key and the token mint's public key as command-line arguments:

    ```bash
    node create_ata_cli.js <YOUR_WALLET_PUBLIC_KEY> <TOKEN_MINT_PUBLIC_KEY>
    ```

    Replace `<YOUR_WALLET_PUBLIC_KEY>` with your actual Solana wallet address (Base58) and `<TOKEN_MINT_PUBLIC_KEY>` with the Base58 address of the token for which you want to create the ATA.

    **Example:**
    ```bash
    node create_ata_cli.js Bbe9EKucv6tuFUhMVnpP3hS2p71tGzGgVzUmP9aNfQ8P Es9vMFrzaCERmJfrF4H2uBGMfGaPY6xxSCzJi1s1is8r
    ```

2.  **Interpret the Output:**
    The script will output:
    *   The derived Associated Token Account (ATA) address.
    *   The Solana CLI command to create this ATA.

    **Example Output:**

    ```
    Derived ATA Address: <DERIVED_ATA_ADDRESS_STRING>

    Solana CLI command to create the Associated Token Account (ATA):
    ------------------------------------------------------------------
    spl-token create-associated-token-account --owner <YOUR_WALLET_PUBLIC_KEY> --mint <TOKEN_MINT_PUBLIC_KEY> --fee-payer <FEE_PAYER_KEYPAIR_PATH_OR_SIGNER>
    ------------------------------------------------------------------

    Important Notes:
    1. Replace <FEE_PAYER_KEYPAIR_PATH_OR_SIGNER> with your actual fee payer keypair path (e.g., ~/.config/solana/id.json) or a specific keypair file.
    2. Ensure your Solana CLI is configured for the correct network (e.g., mainnet-beta: solana config set --url https://api.mainnet-beta.solana.com).
    3. The owner specified is the account that will own the new ATA.
    4. The fee payer is the account that will pay for the transaction fees.
    ```

3.  **Execute the Command:**
    *   Copy the generated `spl-token create-associated-token-account ...` command.
    *   **Crucially, replace `<FEE_PAYER_KEYPAIR_PATH_OR_SIGNER>`** with the path to your fee-paying wallet's keypair file (e.g., `~/.config/solana/id.json` if you're using your default Solana CLI identity) or use the appropriate flag if your keypair is loaded differently.
    *   **Ensure your Solana CLI is targeting the correct network.** For Mainnet Beta, use:
        ```bash
        solana config set --url https://api.mainnet-beta.solana.com
        ```
        For Devnet:
        ```bash
        solana config set --url https://api.devnet.solana.com
        ```
    *   Paste the modified command into your terminal and press Enter. The Solana CLI will ask for confirmation before sending the transaction.

## Security Note

This script only generates a command. It does **not** handle your private keys or send any transactions. You are responsible for securely managing your keys and confirming transactions when using the Solana CLI.
