import { ethers } from 'ethers';

// Contract addresses - these will be updated after deployment
export const CONTRACT_ADDRESSES = {
  TEST_TOKEN: '0x0000000000000000000000000000000000000000', // Will be updated
  USD_TOKEN: '0x0000000000000000000000000000000000000000',  // Will be updated
  SAGA_TOKEN1: '0x0000000000000000000000000000000000000000', // Will be updated
  SAGA_TOKEN2: '0x0000000000000000000000000000000000000000', // Will be updated
  DEX_EXCHANGE: '0x0000000000000000000000000000000000000000' // Will be updated
};

// Saga network configuration
export const SAGA_NETWORK = {
  chainId: '0x9ca00a9e78100', // 2755378989728000 in hex
  chainName: 'Saga Qubit',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  },
  rpcUrls: ['https://qubit-2755378989728000-1.jsonrpc.sagarpc.io'],
  blockExplorerUrls: []
};

// ERC20 Token ABI (minimal)
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)"
];

// DEX Exchange ABI
export const DEX_ABI = [
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB)",
  "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity)",
  "function swapTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut)",
  "function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
  "function getPoolInfo(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity)",
  "function getUserLiquidity(address tokenA, address tokenB, address user) view returns (uint256)"
];

export const getProvider = async () => {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error('MetaMask not found');
};

export const connectWallet = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const account = await signer.getAddress();

    // Check if we're on the right network
    const network = await provider.getNetwork();
    if (network.chainId.toString() !== '2755378989728000') {
      try {
        // Try to switch to Saga network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SAGA_NETWORK.chainId }],
        });
      } catch (switchError) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SAGA_NETWORK],
          });
        } else {
          throw switchError;
        }
      }
    }

    return { provider, signer, account };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw new Error(`Failed to connect wallet: ${error.message}`);
  }
};

export const getTokenContract = (tokenAddress, provider) => {
  return new ethers.Contract(tokenAddress, ERC20_ABI, provider);
};

export const getDEXContract = (provider) => {
  return new ethers.Contract(CONTRACT_ADDRESSES.DEX_EXCHANGE, DEX_ABI, provider);
};

export const formatTokenAmount = (amount, decimals = 18) => {
  return ethers.formatUnits(amount, decimals);
};

export const parseTokenAmount = (amount, decimals = 18) => {
  return ethers.parseUnits(amount.toString(), decimals);
};
