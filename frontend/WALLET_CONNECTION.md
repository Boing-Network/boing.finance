# Wallet Connection System

This document describes the wallet connection functionality implemented in the mochi DEX frontend.

## Overview

The wallet connection system provides a comprehensive solution for connecting Web3 wallets, managing network switching, and handling wallet state across the application. It supports multiple blockchain networks and provides a seamless user experience.

## Features

### 🔗 **Multi-Wallet Support**
- MetaMask (primary support)
- Extensible for other wallet providers
- Automatic wallet detection
- Connection state persistence

### 🌐 **Multi-Network Support**
- 15+ supported blockchain networks
- Automatic network switching
- Network validation and error handling
- Network addition to wallet if not present

### 🔒 **Security & UX**
- Secure connection handling
- Automatic reconnection on page reload
- Real-time wallet state monitoring
- User-friendly error messages

## Architecture

### Core Components

#### 1. **WalletContext** (`src/contexts/WalletContext.js`)
The main context provider that manages wallet state and provides connection functionality.

**Key Features:**
- Wallet connection/disconnection
- Network switching
- Account and balance management
- Event listeners for wallet changes

**State Management:**
```javascript
{
  account: string | null,        // Connected account address
  provider: Provider | null,     // Ethers.js provider
  signer: Signer | null,         // Ethers.js signer
  chainId: number | null,        // Current network chain ID
  isConnecting: boolean,         // Connection in progress
  isConnected: boolean,          // Connection status
  walletType: string | null      // Type of connected wallet
}
```

#### 2. **WalletConnect Component** (`src/components/WalletConnect.js`)
UI component for wallet connection with dropdown functionality.

**Features:**
- Connect/Disconnect buttons
- Account information display
- Network status
- Balance display
- Dropdown menu for wallet actions

#### 3. **NetworkSelector Component** (`src/components/NetworkSelector.js`)
Component for switching between supported networks.

**Features:**
- Network selection dropdown
- Network icons and information
- Automatic network switching
- Support for adding new networks to wallet

#### 4. **useWalletConnection Hook** (`src/hooks/useWalletConnection.js`)
Custom hook providing enhanced wallet functionality with error handling.

**Additional Features:**
- Retry mechanisms for failed operations
- Transaction sending and confirmation
- Message signing
- Enhanced error handling with toast notifications

## Usage

### Basic Wallet Connection

```javascript
import { useWalletConnection } from '../hooks/useWalletConnection';

const MyComponent = () => {
  const { 
    isConnected, 
    account, 
    connectWithRetry, 
    disconnectWallet 
  } = useWalletConnection();

  const handleConnect = async () => {
    const success = await connectWithRetry();
    if (success) {
      console.log('Wallet connected successfully!');
    }
  };

  return (
    <div>
      {!isConnected ? (
        <button onClick={handleConnect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      )}
    </div>
  );
};
```

### Network Switching

```javascript
import { useWalletConnection } from '../hooks/useWalletConnection';

const NetworkSwitcher = () => {
  const { 
    isConnected, 
    chainId, 
    switchNetworkWithRetry,
    getCurrentNetwork 
  } = useWalletConnection();

  const handleSwitchNetwork = async (targetChainId) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const success = await switchNetworkWithRetry(targetChainId);
    if (success) {
      const network = getCurrentNetwork();
      console.log(`Switched to ${network.name}`);
    }
  };

  return (
    <div>
      <p>Current Network: {getCurrentNetwork()?.name}</p>
      <button onClick={() => handleSwitchNetwork(137)}>
        Switch to Polygon
      </button>
    </div>
  );
};
```

### Transaction Handling

```javascript
import { useWalletConnection } from '../hooks/useWalletConnection';

const TransactionExample = () => {
  const { 
    isConnected, 
    sendTransaction, 
    waitForTransaction 
  } = useWalletConnection();

  const handleSendTransaction = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const transaction = {
      to: '0x...',
      value: ethers.parseEther('0.1'),
      gasLimit: 21000
    };

    const tx = await sendTransaction(transaction);
    if (tx) {
      const receipt = await waitForTransaction(tx.hash);
      if (receipt) {
        console.log('Transaction confirmed!');
      }
    }
  };

  return (
    <button onClick={handleSendTransaction}>
      Send Transaction
    </button>
  );
};
```

## Supported Networks

The system supports the following networks:

### Major Networks
- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **BNB Smart Chain** (Chain ID: 56)

### Layer 2 Networks
- **Arbitrum One** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)
- **zkSync Era** (Chain ID: 324)
- **Scroll** (Chain ID: 534352)

### Alternative L1s
- **Fantom** (Chain ID: 250)
- **Avalanche** (Chain ID: 43114)
- **Moonbeam** (Chain ID: 1284)
- **Moonriver** (Chain ID: 1285)

### Emerging Networks
- **Linea** (Chain ID: 59144)
- **Polygon zkEVM** (Chain ID: 1101)

## Error Handling

The system includes comprehensive error handling:

### Common Error Scenarios
1. **No Wallet Detected**
   - Error: "No wallet detected. Please install MetaMask or another Web3 wallet."
   - Solution: Guide user to install a Web3 wallet

2. **Network Not Supported**
   - Error: "Network with chain ID X is not supported"
   - Solution: Prompt user to switch to a supported network

3. **Connection Failed**
   - Error: "Failed to connect wallet"
   - Solution: Retry mechanism with user-friendly messages

4. **Transaction Failed**
   - Error: "Transaction failed"
   - Solution: Show detailed error information and retry options

### Error Recovery
- Automatic retry mechanisms for failed operations
- Graceful degradation when wallet is not available
- User-friendly error messages with actionable solutions
- Toast notifications for real-time feedback

## Security Considerations

### Best Practices Implemented
1. **Secure Connection Handling**
   - Validation of wallet provider
   - Secure account access requests
   - Proper error handling for security-related issues

2. **Network Validation**
   - Verification of supported networks
   - Chain ID validation
   - Network configuration verification

3. **Transaction Security**
   - Transaction parameter validation
   - Gas estimation and limits
   - Confirmation waiting with timeout

4. **State Management**
   - Secure localStorage usage
   - Proper cleanup on disconnect
   - Event listener cleanup

## Integration with App

### App.js Integration
The wallet system is integrated into the main app through:

```javascript
import { WalletProvider } from './contexts/WalletContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router>
          {/* App content */}
        </Router>
      </WalletProvider>
    </QueryClientProvider>
  );
}
```

### Header Integration
Wallet components are integrated into the header:

```javascript
import WalletConnect from './components/WalletConnect';
import NetworkSelector from './components/NetworkSelector';

// In header
<div className="hidden md:flex items-center space-x-4">
  <NetworkSelector />
  <WalletConnect />
</div>
```

## Future Enhancements

### Planned Features
1. **Additional Wallet Support**
   - WalletConnect v2
   - Coinbase Wallet
   - Trust Wallet
   - Rainbow Wallet

2. **Enhanced Network Features**
   - Network status monitoring
   - Gas price optimization
   - Network performance metrics

3. **Advanced Functionality**
   - Multi-signature wallet support
   - Hardware wallet integration
   - Wallet backup and recovery

4. **Developer Tools**
   - Wallet debugging tools
   - Network testing utilities
   - Development environment support

## Troubleshooting

### Common Issues

1. **Wallet Not Connecting**
   - Check if MetaMask is installed
   - Ensure wallet is unlocked
   - Check browser console for errors

2. **Network Switch Failing**
   - Verify network is supported
   - Check wallet network settings
   - Try adding network manually

3. **Transaction Issues**
   - Verify sufficient balance
   - Check gas settings
   - Ensure correct network

### Debug Information
Enable debug mode by setting:
```javascript
localStorage.setItem('debug', 'wallet:*');
```

## API Reference

### WalletContext Methods

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `connectWallet` | Connect to wallet | `accountAddress?`, `networkChainId?` | `Promise<boolean>` |
| `disconnectWallet` | Disconnect wallet | - | `void` |
| `switchNetwork` | Switch to network | `chainId` | `Promise<boolean>` |
| `getCurrentNetwork` | Get current network | - | `Network \| null` |
| `getAccountBalance` | Get account balance | - | `Promise<string \| null>` |

### useWalletConnection Hook

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `connectWithRetry` | Connect with retry logic | - | `Promise<boolean>` |
| `switchNetworkWithRetry` | Switch network with retry | `chainId` | `Promise<boolean>` |
| `signMessage` | Sign message | `message` | `Promise<string \| null>` |
| `sendTransaction` | Send transaction | `transaction` | `Promise<Transaction \| null>` |
| `waitForTransaction` | Wait for transaction | `txHash` | `Promise<Receipt \| null>` |

## Contributing

When contributing to the wallet connection system:

1. **Follow the existing patterns** for error handling and state management
2. **Add comprehensive tests** for new functionality
3. **Update documentation** for any new features
4. **Consider security implications** of any changes
5. **Test with multiple wallets** and networks

## Support

For issues or questions about the wallet connection system:

1. Check the troubleshooting section
2. Review the error handling documentation
3. Test with different wallets and networks
4. Check browser console for detailed error messages
5. Verify network configuration and RPC endpoints 