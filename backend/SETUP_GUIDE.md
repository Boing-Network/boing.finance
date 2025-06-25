# DEX Backend Setup Guide

This guide will help you set up the DEX backend with `better-sqlite3` and Drizzle ORM.

## Prerequisites

- Node.js 18+ installed
- Python 3.x installed (for better-sqlite3 compilation)
- Visual Studio Build Tools with C++ workload (for Windows)

## Quick Setup

### 1. Install Dependencies
```cmd
npm install
```

### 2. Set Up Database
```cmd
npm run setup
```

### 3. Start Development Server
```cmd
npm run dev
```

## Detailed Setup

### Step 1: Environment Configuration
1. Copy the environment template:
   ```cmd
   copy .env.example .env
   ```

2. Edit `.env` with your configuration:
   - Set your Infura API key for Sepolia testnet
   - Configure other settings as needed

### Step 2: Database Setup
The database setup creates all necessary tables:

- **tokens**: Token information and metadata
- **pairs**: DEX trading pairs
- **swaps**: Swap transaction history
- **liquidity_events**: Liquidity provision events

```cmd
npm run setup
```

### Step 3: Verify Installation
1. Start the server:
   ```cmd
   npm run dev
   ```

2. Test the health endpoint:
   ```
   http://localhost:3001/health
   ```

3. Test the tokens API:
   ```
   http://localhost:3001/api/tokens
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server
- `npm run setup` - Initialize database tables
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Tokens
- `GET /api/tokens` - Get all tokens
- `GET /api/tokens/:address` - Get token by address
- `POST /api/tokens` - Create new token
- `PUT /api/tokens/:address` - Update token
- `GET /api/tokens/search/:query` - Search tokens
- `GET /api/tokens/stats/overview` - Token statistics
- `GET /api/tokens/top/market-cap` - Top tokens by market cap
- `GET /api/tokens/top/volume` - Top tokens by volume

## Troubleshooting

### Common Issues

1. **"better-sqlite3 compilation failed"**
   - Make sure Python is installed and in PATH
   - Install Visual Studio Build Tools with C++ workload
   - Use Command Prompt instead of Git Bash

2. **"Database not found"**
   - Run `npm run setup` to create the database
   - Check that the `data/` directory exists

3. **"Port already in use"**
   - Change the PORT in `.env` file
   - Or kill the process using the port

### Getting Help

- Check the logs in the terminal
- Verify all prerequisites are installed
- Make sure you're using Command Prompt on Windows

## Next Steps

After setup, you can:
1. Deploy smart contracts to Sepolia testnet
2. Set up the frontend React application
3. Configure cross-chain bridge functionality
4. Add more API endpoints as needed 