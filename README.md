# Cipher Vault Indexer

A blockchain indexer for Cipher Vault smart contracts built with Ponder, featuring AI insights and a RESTful API.

## 🚀 Overview

This project indexes Cipher Vault smart contracts on the Avalanche testnet, providing real-time data about vaults, user statistics, and AI-powered insights. The system consists of:

- **Ponder Indexer**: Indexes onchain vault data and user statistics
- **Custom AI Insights**: Separate database for AI-generated insights about vaults
- **REST API**: Hono-based API for querying indexed data
- **GraphQL**: Built-in GraphQL endpoint for complex queries

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Avalanche     │    │   Ponder        │    │   Custom DB     │
│   Blockchain    │───▶│   Indexer       │    │   (AI Insights) │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Vault Data    │    │   AI Insights   │
                       │   User Stats    │    │   (Persistent)  │
                       └─────────────────┘    └─────────────────┘
                              │                        │
                              └──────────┬─────────────┘
                                         ▼
                                ┌─────────────────┐
                                │   REST API      │
                                │   (Hono)        │
                                └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- pnpm
- PostgreSQL database
- Avalanche testnet RPC access

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fum-vault-indexer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   PONDER_RPC_URL_1="https://api.avax-test.network/ext/bc/C/rpc"
   ```

4. **Start the indexer**
   ```bash
   pnpm dev
   ```

## 🗄️ Database Setup

The project uses two separate database systems:

### Ponder Tables (Auto-managed)
- `vault`: Vault data from smart contracts
- `user_stats`: User statistics and activity

### Custom Tables (Manually managed)
- `ai_insight`: AI-generated insights (persistent across restarts)

The AI insights table is created automatically on startup and persists independently of Ponder's indexing.

## 📡 API Endpoints

### Vaults

#### GET `/vaults`
Get all vaults with pagination and filtering.

**Query Parameters:**
- `limit` (optional): Number of vaults to return (default: 50)
- `offset` (optional): Number of vaults to skip (default: 0)
- `owner` (optional): Filter by vault owner address
- `status` (optional): Filter by vault status (0-3)

**Response:**
```json
{
  "vaults": [
    {
      "id": "1",
      "owner": "0x...",
      "token": "0x...",
      "amount": "1000000000000000000",
      "unlockTime": "1234567890",
      "targetPrice": "500000000000000000",
      "status": 0,
      "title": "My Vault",
      "message": "Vault description",
      "insight": {
        "id": "insight_123",
        "vault_id": "1",
        "tx_hash": "0x...",
        "insight": "AI analysis of vault performance",
        "created_at": "1234567890"
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

#### GET `/vaults/:id`
Get a specific vault by ID.

**Response:**
```json
{
  "vault": {
    "id": "1",
    "owner": "0x...",
    "insight": {
      "id": "insight_123",
      "insight": "AI analysis...",
      "created_at": "1234567890"
    }
  }
}
```

### AI Insights

#### POST `/ai-insights`
Create a new AI insight.

**Request Body:**
```json
{
  "vaultId": 1,
  "insight": "This vault shows strong performance indicators",
  "txHash": "0x3540592c40eb57009008b400c15fba59445e9672b36f3d397aca0eaf57014e24"
}
```

#### GET `/ai-insights/vault/:vaultId`
Get AI insights for a specific vault.

#### GET `/ai-insights/tx/:txHash`
Get AI insights by transaction hash.

### User Statistics

#### GET `/users/:address/stats`
Get user statistics and recent vaults.

**Response:**
```json
{
  "stats": {
    "address": "0x...",
    "totalVaults": 5,
    "activeVaults": 3,
    "totalLockedAmount": "5000000000000000000"
  },
  "recentVaults": [...]
}
```

### Analytics

#### GET `/analytics`
Get platform-wide analytics.

**Response:**
```json
{
  "totalVaults": 100,
  "activeVaults": 75,
  "totalValueLocked": "50000000000000000000"
}
```

### GraphQL

#### POST `/graphql`
Built-in GraphQL endpoint for complex queries.

## 🔧 Configuration

### Ponder Configuration (`ponder.config.ts`)
```typescript
export default createConfig({
  chains: {
    avalanche: {
      id: 43113,
      rpc: http("https://api.avax-test.network/ext/bc/C/rpc"),
    },
  },
  contracts: {
    CipherVault: {
      abi: CipherVaultAbi,
      chain: "avalanche",
      address: "0x7Aa2608EeA7679FA66196DECd78989Bb13DACD38",
      startBlock: 42606732,
    },
  },
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  }
});
```

## 🚀 Development

### Available Scripts

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Generate types
pnpm codegen
```

### Project Structure

```
cipher-vault-indexer/
├── abis/                 # Smart contract ABIs
├── src/
│   ├── api/             # REST API endpoints
│   ├── config/          # Database configuration
│   └── utils/           # Utility functions
├── ponder.config.ts     # Ponder configuration
├── ponder.schema.ts     # Database schema
└── package.json
```

## 🔍 Data Models

### Vault Status
- `0`: ACTIVE
- `1`: UNLOCKED  
- `2`: WITHDRAWN
- `3`: EMERGENCY

### Condition Types
- `0`: TIME_ONLY
- `1`: PRICE_UP_ONLY
- `2`: PRICE_DOWN_ONLY
- `3`: PRICE_UP_OR_DOWN
- `4`: TIME_OR_PRICE
- `5`: TIME_AND_PRICE

## 🧪 Testing

### Test API Endpoints

```bash
# Get all vaults
curl http://localhost:42069/vaults

# Create AI insight
curl -X POST http://localhost:42069/ai-insights \
  -H "Content-Type: application/json" \
  -d '{
    "vaultId": 1,
    "insight": "Test insight",
    "txHash": "0x3540592c40eb57009008b400c15fba59445e9672b36f3d397aca0eaf57014e24"
  }'

# Get user stats
curl http://localhost:42069/users/0x123.../stats
```

## 🔒 Security

- All BigInt values are serialized to strings in API responses
- Input validation on all endpoints
- Proper error handling and logging
- Database connection pooling