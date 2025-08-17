import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import { 
  CONTRACT_ADDRESSES, 
  getDEXContract, 
  formatTokenAmount 
} from '../utils/web3';

const TOKENS = [
  { symbol: 'TEST', name: 'Test Token', address: CONTRACT_ADDRESSES.TEST_TOKEN },
  { symbol: 'USD', name: 'USD Token', address: CONTRACT_ADDRESSES.USD_TOKEN },
  { symbol: 'SAGA1', name: 'Saga Token 1', address: CONTRACT_ADDRESSES.SAGA_TOKEN1 },
  { symbol: 'SAGA2', name: 'Saga Token 2', address: CONTRACT_ADDRESSES.SAGA_TOKEN2 }
];

const TOKEN_PAIRS = [
  ['TEST', 'USD'],
  ['TEST', 'SAGA1'],
  ['TEST', 'SAGA2'],
  ['USD', 'SAGA1'],
  ['USD', 'SAGA2'],
  ['SAGA1', 'SAGA2']
];

function PoolsComponent({ account, provider }) {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider) {
      loadPools();
    }
  }, [provider]);

  const loadPools = async () => {
    setLoading(true);
    setError('');

    try {
      const dexContract = getDEXContract(provider);
      const poolData = [];

      for (const [tokenASymbol, tokenBSymbol] of TOKEN_PAIRS) {
        const tokenA = TOKENS.find(t => t.symbol === tokenASymbol);
        const tokenB = TOKENS.find(t => t.symbol === tokenBSymbol);

        if (tokenA.address === '0x0000000000000000000000000000000000000000' ||
            tokenB.address === '0x0000000000000000000000000000000000000000') {
          continue;
        }

        try {
          const [reserveA, reserveB, totalLiquidity] = await dexContract.getPoolInfo(
            tokenA.address,
            tokenB.address
          );

          const userLiquidity = account ? await dexContract.getUserLiquidity(
            tokenA.address,
            tokenB.address,
            account
          ) : 0;

          if (totalLiquidity > 0) {
            poolData.push({
              tokenA: tokenASymbol,
              tokenB: tokenBSymbol,
              reserveA: formatTokenAmount(reserveA),
              reserveB: formatTokenAmount(reserveB),
              totalLiquidity: formatTokenAmount(totalLiquidity),
              userLiquidity: formatTokenAmount(userLiquidity),
              hasLiquidity: totalLiquidity > 0
            });
          }
        } catch (err) {
          console.error(`Error loading pool ${tokenASymbol}/${tokenBSymbol}:`, err);
        }
      }

      setPools(poolData);
    } catch (err) {
      console.error('Error loading pools:', err);
      setError('Failed to load pool information');
    } finally {
      setLoading(false);
    }
  };

  const calculateTVL = () => {
    // Simple TVL calculation (in practice, you'd use price oracles)
    return pools.reduce((total, pool) => {
      const reserveA = parseFloat(pool.reserveA);
      const reserveB = parseFloat(pool.reserveB);
      // Assuming USD = $1, others = $0.1 for demo
      const valueA = pool.tokenA === 'USD' ? reserveA : reserveA * 0.1;
      const valueB = pool.tokenB === 'USD' ? reserveB : reserveB * 0.1;
      return total + valueA + valueB;
    }, 0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Liquidity Pools
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Pool Statistics
        </Typography>
        <Box display="flex" gap={4}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Pools
            </Typography>
            <Typography variant="h6">
              {pools.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Value Locked (Estimated)
            </Typography>
            <Typography variant="h6">
              ${calculateTVL().toFixed(2)}
            </Typography>
          </Box>
          {account && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Your Pools
              </Typography>
              <Typography variant="h6">
                {pools.filter(pool => parseFloat(pool.userLiquidity) > 0).length}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Pool</TableCell>
              <TableCell align="right">Reserve A</TableCell>
              <TableCell align="right">Reserve B</TableCell>
              <TableCell align="right">Total Liquidity</TableCell>
              {account && <TableCell align="right">Your Liquidity</TableCell>}
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={account ? 6 : 5} align="center">
                  Loading pools...
                </TableCell>
              </TableRow>
            ) : pools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={account ? 6 : 5} align="center">
                  No active pools found
                </TableCell>
              </TableRow>
            ) : (
              pools.map((pool, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {pool.tokenA}/{pool.tokenB}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {parseFloat(pool.reserveA).toFixed(4)} {pool.tokenA}
                  </TableCell>
                  <TableCell align="right">
                    {parseFloat(pool.reserveB).toFixed(4)} {pool.tokenB}
                  </TableCell>
                  <TableCell align="right">
                    {parseFloat(pool.totalLiquidity).toFixed(4)}
                  </TableCell>
                  {account && (
                    <TableCell align="right">
                      {parseFloat(pool.userLiquidity) > 0 ? (
                        <Typography variant="body2" color="primary">
                          {parseFloat(pool.userLiquidity).toFixed(4)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          0
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pools.length > 0 && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            * Liquidity tokens represent your share of the pool
          </Typography>
          <Typography variant="body2" color="text.secondary">
            * TVL is estimated based on demo pricing
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PoolsComponent;
