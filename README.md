# Saga DeFi Exchange & Token Deployment

A complete DeFi ecosystem with ERC20 tokens and decentralized exchange deployed on the Saga network.

## 🚀 Project Overview

This project includes:
- **4 ERC20 Tokens**: SAGA1, SAGA2, TEST, USD
- **DEX Exchange**: Automated Market Maker (AMM) with liquidity pools
- **Web UI**: React-based trading interface
- **Smart Contract Deployment**: Complete deployment pipeline

## 📁 Project Structure

```
saga/
├── contracts/
│   ├── SagaToken1.sol      # Basic ERC20 (1M supply)
│   ├── SagaToken2.sol      # Advanced ERC20 (2M supply, 10M max)
│   ├── TestToken.sol       # Test token for trading
│   ├── USDToken.sol        # USD stable token for trading
│   └── DEXExchange.sol     # AMM DEX contract
├── scripts/
│   └── deploy.js           # Deployment script with token transfers
├── frontend/               # React trading interface
│   ├── src/
│   │   ├── components/     # Swap, Liquidity, Pools components
│   │   └── utils/          # Web3 utilities
│   └── package.json
├── hardhat.config.js       # Network configuration
└── package.json
```

## 🪙 Token Details

### SagaToken1 (SAGA1)
- **Supply**: 1,000,000 tokens
- **Features**: Mint, Burn, Owner controls
- **Type**: Standard ERC20

### SagaToken2 (SAGA2)
- **Initial Supply**: 2,000,000 tokens
- **Max Supply**: 10,000,000 tokens
- **Features**: Mint, Burn, ERC20Permit, Owner controls
- **Type**: Advanced ERC20 with permit functionality

### TestToken (TEST)
- **Supply**: 1,000,000 tokens
- **Purpose**: Trading pair token for DEX
- **Features**: Mint, Burn, Testing functions

### USDToken (USD)
- **Supply**: 1,000,000 tokens
- **Purpose**: Stable token for trading pairs
- **Features**: Mint, Burn, Testing functions

## 🏦 DEX Exchange Features

### Core Functionality
- **Token Swapping**: Automated Market Maker (AMM) with 0.3% trading fee
- **Liquidity Provision**: Add/remove liquidity to earn fees
- **Pool Management**: View all active trading pools
- **Price Discovery**: Constant product formula (x * y = k)

### Supported Trading Pairs
- TEST/USD
- TEST/SAGA1
- TEST/SAGA2
- USD/SAGA1
- USD/SAGA2
- SAGA1/SAGA2

## 🌐 Network Configuration

- **Network**: Saga Qubit
- **RPC URL**: https://qubit-2755378989728000-1.jsonrpc.sagarpc.io
- **Chain ID**: 2755378989728000
- **Deployer**: 0xDFD9ba80c67Bfb003c3Cc96464Faa3fe78bc3f6D
- **Target Wallet**: 0x9670d0ca0ca6b7032051717FbADE2f02DF1358F0

## 💰 Token Distribution

After deployment, the following tokens will be transferred to `0x9670d0ca0ca6b7032051717FbADE2f02DF1358F0`:
- **10,000 TEST tokens**
- **10,000 USD tokens**
- **1,000 SAGA1 tokens**
- **1,000 SAGA2 tokens**

## 🛠️ Deployment Instructions

### Prerequisites
```bash
# Install Node.js dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Deploy Smart Contracts
```bash
# Deploy all contracts and transfer tokens
npx hardhat run scripts/deploy.js --network saga
```

### Launch Trading Interface
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start the development server
npm start
```

The UI will be available at `http://localhost:3000`

## 🎯 How to Use the DEX

### 1. Connect Wallet
- Click "Connect Wallet" in the UI
- Approve network switch to Saga if prompted
- Ensure you have tokens in your wallet

### 2. Swap Tokens
- Select tokens to swap
- Enter amount
- Confirm transaction
- Tokens will be exchanged instantly

### 3. Provide Liquidity
- Go to "Liquidity" tab
- Select token pair
- Enter amounts for both tokens
- Add liquidity to earn trading fees

### 4. View Pools
- Go to "Pools" tab
- See all active trading pools
- Monitor your liquidity positions
- Track total value locked (TVL)

## 🔧 Development Commands

```bash
# Compile contracts
npm run compile

# Deploy contracts
npm run deploy

# Start frontend
cd frontend && npm start

# Run tests (if available)
npm test
```

## 📊 Smart Contract Addresses

After deployment, contract addresses will be saved in `deployment-info.json`:

```json
{
  "contracts": {
    "SagaToken1": { "address": "0x..." },
    "SagaToken2": { "address": "0x..." },
    "TestToken": { "address": "0x..." },
    "USDToken": { "address": "0x..." },
    "DEXExchange": { "address": "0x..." }
  }
}
```

## 🔐 Security Features

- **Reentrancy Protection**: All DEX functions protected against reentrancy attacks
- **Slippage Protection**: Minimum output amounts prevent sandwich attacks
- **Access Control**: Token minting restricted to owners
- **Safe Math**: Built-in overflow protection with Solidity 0.8+

## 🎨 UI Features

- **Dark Theme**: Modern, professional appearance
- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Live balance and pool information
- **Error Handling**: Clear error messages and transaction status
- **MetaMask Integration**: Seamless wallet connection

## ⚠️ Important Notes

### Authorization Required
If deployment fails with "unauthorized" error:
1. Contact Saga network administrators
2. Request authorization for your address
3. Ensure sufficient ETH balance for gas fees

### Token Testing
- Use `mintForTesting()` function on TEST and USD tokens for additional tokens
- All tokens are for testing purposes only
- Exchange rates are determined by AMM algorithm

## 🚀 Getting Started

1. **Deploy Contracts**: Run the deployment script
2. **Update UI Config**: Copy contract addresses to frontend
3. **Launch Interface**: Start the React development server
4. **Connect Wallet**: Use MetaMask with Saga network
5. **Start Trading**: Swap tokens and provide liquidity

## 📈 Future Enhancements

- Price oracles for accurate token pricing
- Governance token and DAO functionality
- Yield farming and staking rewards
- Advanced trading features (limit orders, etc.)
- Mobile app development

---

**Ready to trade? Deploy the contracts and start using the Saga DEX! 🎉**
