# Solana Wallet Configuration

## Recipient Wallet Address

**Mainnet Wallet Address:**
```
66FTEkkqvKa4QMMRXaryf2oGmknTFbyLQrmKRK6qAJkC
```

This is the wallet address that receives Solana payments for credit purchases.

## Configuration

### Mobile App (`app.json`)

The recipient address is configured in `app.json`:

```json
{
  "extra": {
    "solanaRecipientAddress": "66FTEkkqvKa4QMMRXaryf2oGmknTFbyLQrmKRK6qAJkC",
    "solanaCluster": "mainnet-beta"
  }
}
```

### Backend API (`.env`)

Set in backend environment:

```env
PLATFORM_PAYMENT_ADDRESS=66FTEkkqvKa4QMMRXaryf2oGmknTFbyLQrmKRK6qAJkC
SOLANA_CLUSTER=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Production Wallet Notes

- **Network**: Mainnet (real SOL transactions)
- **Purpose**: Production payments
- **Transactions**: Real SOL required for payments
- **RPC**: Using public RPC endpoint (consider upgrading to Helius/QuickNode for production)

## Production Payments

1. Connect a Solana wallet (Phantom, etc.) on mainnet
2. Ensure wallet has sufficient SOL for payments
3. Send payments to the recipient address
4. Credits will be granted automatically

## Production RPC Recommendations

For better performance and reliability, consider using:
- **Helius**: https://www.helius.dev/
- **QuickNode**: https://www.quicknode.com/
- **Alchemy**: https://www.alchemy.com/

Update `solanaRpc` in `app.json` or set `EXPO_PUBLIC_SOLANA_RPC` environment variable.

