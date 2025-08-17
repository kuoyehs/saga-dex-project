import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Paper,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { SwapVert } from '@mui/icons-material';
import { 
  CONTRACT_ADDRESSES, 
  getTokenContract, 
  getDEXContract, 
  formatTokenAmount, 
  parseTokenAmount 
} from '../utils/web3';

const TOKENS = [
  { symbol: 'TEST', name: 'Test Token', address: CONTRACT_ADDRESSES.TEST_TOKEN },
  { symbol: 'USD', name: 'USD Token', address: CONTRACT_ADDRESSES.USD_TOKEN },
  { symbol: 'SAGA1', name: 'Saga Token 1', address: CONTRACT_ADDRESSES.SAGA_TOKEN1 },
  { symbol: 'SAGA2', name: 'Saga Token 2', address: CONTRACT_ADDRESSES.SAGA_TOKEN2 }
];

function SwapComponent({ account, provider }) {
  const [fromToken, setFromToken] = useState('TEST');
  const [toToken, setToToken] = useState('USD');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (account && provider) {
      loadBalances();
    }
  }, [account, provider]);

  useEffect(() => {
    if (fromAmount && fromToken !== toToken) {
      calculateToAmount();
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const loadBalances = async () => {
    try {
      const newBalances = {};
      for (const token of TOKENS) {
        if (token.address !== '0x0000000000000000000000000000000000000000') {
          const contract = getTokenContract(token.address, provider);
          const balance = await contract.balanceOf(account);
          newBalances[token.symbol] = formatTokenAmount(balance);
        }
      }
      setBalances(newBalances);
    } catch (err) {
      console.error('Error loading balances:', err);
    }
  };

  const calculateToAmount = async () => {
    try {
      if (!fromAmount || fromAmount === '0') {
        setToAmount('');
        return;
      }

      const fromTokenData = TOKENS.find(t => t.symbol === fromToken);
      const toTokenData = TOKENS.find(t => t.symbol === toToken);
      
      if (!fromTokenData || !toTokenData || 
          fromTokenData.address === '0x0000000000000000000000000000000000000000' ||
          toTokenData.address === '0x0000000000000000000000000000000000000000') {
        setToAmount('0');
        return;
      }

      const dexContract = getDEXContract(provider);
      const amountIn = parseTokenAmount(fromAmount);
      const amountOut = await dexContract.getAmountOut(
        fromTokenData.address,
        toTokenData.address,
        amountIn
      );
      
      setToAmount(formatTokenAmount(amountOut));
    } catch (err) {
      console.error('Error calculating amount:', err);
      setToAmount('0');
    }
  };

  const handleSwap = async () => {
    if (!account || !provider) {
      setError('Please connect your wallet');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const signer = await provider.getSigner();
      const fromTokenData = TOKENS.find(t => t.symbol === fromToken);
      const toTokenData = TOKENS.find(t => t.symbol === toToken);
      
      const fromTokenContract = getTokenContract(fromTokenData.address, signer);
      const dexContract = getDEXContract(signer);
      
      const amountIn = parseTokenAmount(fromAmount);
      const minAmountOut = parseTokenAmount(parseFloat(toAmount) * 0.95); // 5% slippage

      // Check allowance
      const allowance = await fromTokenContract.allowance(account, CONTRACT_ADDRESSES.DEX_EXCHANGE);
      if (allowance < amountIn) {
        setError('Approving token spend...');
        const approveTx = await fromTokenContract.approve(CONTRACT_ADDRESSES.DEX_EXCHANGE, amountIn);
        await approveTx.wait();
      }

      // Execute swap
      setError('Executing swap...');
      const swapTx = await dexContract.swapTokens(
        fromTokenData.address,
        toTokenData.address,
        amountIn,
        minAmountOut
      );
      
      await swapTx.wait();
      setSuccess(`Successfully swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}!`);
      
      // Reset form and reload balances
      setFromAmount('');
      setToAmount('');
      loadBalances();
      
    } catch (err) {
      console.error('Swap error:', err);
      setError(`Swap failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const getTokenBalance = (symbol) => {
    return balances[symbol] || '0';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Swap Tokens
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          From
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            select
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {TOKENS.map((token) => (
              <MenuItem key={token.symbol} value={token.symbol}>
                {token.symbol}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            inputProps={{ step: "0.01" }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Balance: {getTokenBalance(fromToken)} {fromToken}
        </Typography>
      </Paper>

      <Box display="flex" justifyContent="center" my={1}>
        <IconButton onClick={handleFlipTokens} color="primary">
          <SwapVert />
        </IconButton>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          To
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {TOKENS.map((token) => (
              <MenuItem key={token.symbol} value={token.symbol}>
                {token.symbol}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            value={toAmount}
            placeholder="0.0"
            InputProps={{ readOnly: true }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Balance: {getTokenBalance(toToken)} {toToken}
        </Typography>
      </Paper>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSwap}
        disabled={!account || loading || !fromAmount || fromToken === toToken}
        startIcon={loading && <CircularProgress size={20} />}
      >
        {loading ? 'Swapping...' : 'Swap'}
      </Button>
    </Box>
  );
}

export default SwapComponent;
