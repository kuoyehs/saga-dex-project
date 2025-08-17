import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
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

function LiquidityComponent({ account, provider }) {
  const [tokenA, setTokenA] = useState('TEST');
  const [tokenB, setTokenB] = useState('USD');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [balances, setBalances] = useState({});
  const [poolInfo, setPoolInfo] = useState(null);
  const [userLiquidity, setUserLiquidity] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (account && provider) {
      loadData();
    }
  }, [account, provider, tokenA, tokenB]);

  const loadData = async () => {
    await Promise.all([
      loadBalances(),
      loadPoolInfo(),
      loadUserLiquidity()
    ]);
  };

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

  const loadPoolInfo = async () => {
    try {
      const tokenAData = TOKENS.find(t => t.symbol === tokenA);
      const tokenBData = TOKENS.find(t => t.symbol === tokenB);
      
      if (!tokenAData || !tokenBData || 
          tokenAData.address === '0x0000000000000000000000000000000000000000' ||
          tokenBData.address === '0x0000000000000000000000000000000000000000') {
        setPoolInfo(null);
        return;
      }

      const dexContract = getDEXContract(provider);
      const [reserveA, reserveB, totalLiquidity] = await dexContract.getPoolInfo(
        tokenAData.address,
        tokenBData.address
      );
      
      setPoolInfo({
        reserveA: formatTokenAmount(reserveA),
        reserveB: formatTokenAmount(reserveB),
        totalLiquidity: formatTokenAmount(totalLiquidity)
      });
    } catch (err) {
      console.error('Error loading pool info:', err);
      setPoolInfo(null);
    }
  };

  const loadUserLiquidity = async () => {
    try {
      const tokenAData = TOKENS.find(t => t.symbol === tokenA);
      const tokenBData = TOKENS.find(t => t.symbol === tokenB);
      
      if (!tokenAData || !tokenBData || 
          tokenAData.address === '0x0000000000000000000000000000000000000000' ||
          tokenBData.address === '0x0000000000000000000000000000000000000000') {
        setUserLiquidity('0');
        return;
      }

      const dexContract = getDEXContract(provider);
      const liquidity = await dexContract.getUserLiquidity(
        tokenAData.address,
        tokenBData.address,
        account
      );
      
      setUserLiquidity(formatTokenAmount(liquidity));
    } catch (err) {
      console.error('Error loading user liquidity:', err);
      setUserLiquidity('0');
    }
  };

  const handleAddLiquidity = async () => {
    if (!account || !provider) {
      setError('Please connect your wallet');
      return;
    }

    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      setError('Please enter valid amounts for both tokens');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const signer = await provider.getSigner();
      const tokenAData = TOKENS.find(t => t.symbol === tokenA);
      const tokenBData = TOKENS.find(t => t.symbol === tokenB);
      
      const tokenAContract = getTokenContract(tokenAData.address, signer);
      const tokenBContract = getTokenContract(tokenBData.address, signer);
      const dexContract = getDEXContract(signer);
      
      const amountAParsed = parseTokenAmount(amountA);
      const amountBParsed = parseTokenAmount(amountB);

      // Check allowances
      const allowanceA = await tokenAContract.allowance(account, CONTRACT_ADDRESSES.DEX_EXCHANGE);
      const allowanceB = await tokenBContract.allowance(account, CONTRACT_ADDRESSES.DEX_EXCHANGE);

      if (allowanceA < amountAParsed) {
        setError('Approving token A...');
        const approveTx = await tokenAContract.approve(CONTRACT_ADDRESSES.DEX_EXCHANGE, amountAParsed);
        await approveTx.wait();
      }

      if (allowanceB < amountBParsed) {
        setError('Approving token B...');
        const approveTx = await tokenBContract.approve(CONTRACT_ADDRESSES.DEX_EXCHANGE, amountBParsed);
        await approveTx.wait();
      }

      // Add liquidity
      setError('Adding liquidity...');
      const addTx = await dexContract.addLiquidity(
        tokenAData.address,
        tokenBData.address,
        amountAParsed,
        amountBParsed
      );
      
      await addTx.wait();
      setSuccess(`Successfully added ${amountA} ${tokenA} and ${amountB} ${tokenB} to the pool!`);
      
      // Reset form and reload data
      setAmountA('');
      setAmountB('');
      loadData();
      
    } catch (err) {
      console.error('Add liquidity error:', err);
      setError(`Failed to add liquidity: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!account || !provider) {
      setError('Please connect your wallet');
      return;
    }

    if (parseFloat(userLiquidity) <= 0) {
      setError('No liquidity to remove');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const signer = await provider.getSigner();
      const tokenAData = TOKENS.find(t => t.symbol === tokenA);
      const tokenBData = TOKENS.find(t => t.symbol === tokenB);
      const dexContract = getDEXContract(signer);
      
      const liquidityAmount = parseTokenAmount(userLiquidity);

      const removeTx = await dexContract.removeLiquidity(
        tokenAData.address,
        tokenBData.address,
        liquidityAmount
      );
      
      await removeTx.wait();
      setSuccess('Successfully removed liquidity from the pool!');
      
      loadData();
      
    } catch (err) {
      console.error('Remove liquidity error:', err);
      setError(`Failed to remove liquidity: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTokenBalance = (symbol) => {
    return balances[symbol] || '0';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Liquidity Management
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Liquidity
            </Typography>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Token A
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <TextField
                  select
                  value={tokenA}
                  onChange={(e) => setTokenA(e.target.value)}
                  sx={{ minWidth: 100 }}
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
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  placeholder="0.0"
                  inputProps={{ step: "0.01" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Balance: {getTokenBalance(tokenA)} {tokenA}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Token B
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <TextField
                  select
                  value={tokenB}
                  onChange={(e) => setTokenB(e.target.value)}
                  sx={{ minWidth: 100 }}
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
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                  placeholder="0.0"
                  inputProps={{ step: "0.01" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Balance: {getTokenBalance(tokenB)} {tokenB}
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleAddLiquidity}
              disabled={!account || loading || !amountA || !amountB || tokenA === tokenB}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Adding Liquidity...' : 'Add Liquidity'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pool Information
            </Typography>

            {poolInfo ? (
              <Box>
                <Typography variant="body2" gutterBottom>
                  <strong>{tokenA} Reserve:</strong> {poolInfo.reserveA}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>{tokenB} Reserve:</strong> {poolInfo.reserveB}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Liquidity:</strong> {poolInfo.totalLiquidity}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Your Liquidity:</strong> {userLiquidity}
                </Typography>

                {parseFloat(userLiquidity) > 0 && (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={handleRemoveLiquidity}
                    disabled={loading}
                    sx={{ mt: 2 }}
                    startIcon={loading && <CircularProgress size={20} />}
                  >
                    {loading ? 'Removing...' : 'Remove All Liquidity'}
                  </Button>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No pool exists for this token pair
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default LiquidityComponent;
