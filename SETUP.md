# Cross-Chain mochi Setup Guide

This guide will help you set up and run the Cross-Chain Decentralized Exchange (mochi) project.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Git**
- **PostgreSQL** (for database)
- **Redis** (for caching)
- **MetaMask** or another Web3 wallet

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mochi
```

### 2. Install Dependencies

```bash
# Install all dependencies for all components
npm run install:all
```

This will install dependencies for:
- Root project
- Smart contracts
- Frontend
- Backend
- Blockchain integration

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Blockchain Configuration
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed.binance.org

# Private Keys (for deployment - keep secure!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Backend Configuration
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/mochi_db
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb mochi_db

# Run migrations (if using Sequelize)
cd backend
npx sequelize-cli db:migrate
```

### 5. Deploy Smart Contracts

```bash
# Deploy to local network (for testing)
cd contracts
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js --network goerli
```

### 6. Start the Application

```bash
# Start all services
npm run dev
```

This will start:
- Frontend (React) on http://localhost:3000
- Backend (Node.js) on http://localhost:3001
- Blockchain node (if using local)

## Detailed Setup

### Smart Contracts Setup

1. **Navigate to contracts directory:**
   ```bash
   cd contracts
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

4. **Run tests:**
   ```bash
   npx hardhat test
   ```

5. **Deploy contracts:**
   ```bash
   # Local deployment
   npx hardhat run scripts/deploy.js --network localhost
   
   # Testnet deployment
   npx hardhat run scripts/deploy.js --network goerli
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create `.env` file in frontend directory:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:3001
   REACT_APP_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
   REACT_APP_POLYGON_RPC_URL=https://polygon-rpc.com
   ```

4. **Start development server:**
   ```bash
   npm start
   ```

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure database:**
   ```bash
   # Create database
   createdb mochi_db
   
   # Run migrations
   npx sequelize-cli db:migrate
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

## Configuration

### Supported Networks

The mochi supports the following networks:

- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Binance Smart Chain** (Chain ID: 56)
- **Avalanche** (Chain ID: 43114)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)

### Environment Variables

#### Required Variables

- `DEPLOYER_PRIVATE_KEY`: Private key for contract deployment
- `ETHEREUM_RPC_URL`: Ethereum RPC endpoint
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

#### Optional Variables

- `PORT`: Backend server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: JWT signing secret
- `RATE_LIMIT_MAX_REQUESTS`: Rate limiting configuration

## Testing

### Smart Contract Tests

```bash
cd contracts
npx hardhat test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Deployment

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy smart contracts:**
   ```bash
   cd contracts
   npx hardhat run scripts/deploy.js --network mainnet
   ```

3. **Deploy frontend:**
   ```bash
   cd frontend
   npm run build
   # Deploy build folder to your hosting service
   ```

4. **Deploy backend:**
   ```bash
   cd backend
   npm start
   # Deploy to your server or cloud platform
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Environment Variables**: Use secure environment variable management
3. **Rate Limiting**: Configure appropriate rate limits
4. **CORS**: Configure CORS properly for production
5. **HTTPS**: Use HTTPS in production
6. **Auditing**: Consider having smart contracts audited

## Troubleshooting

### Common Issues

1. **Metamask Connection Issues**
   - Ensure MetaMask is installed and unlocked
   - Check if the correct network is selected
   - Clear browser cache and try again

2. **Contract Deployment Failures**
   - Check if you have sufficient funds for gas
   - Verify RPC endpoint is working
   - Check private key format

3. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists

4. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Getting Help

- Check the logs for error messages
- Review the documentation
- Open an issue on GitHub
- Join our community Discord

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 