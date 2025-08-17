import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Tab, 
  Tabs, 
  Button, 
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import SwapComponent from './components/SwapComponent';
import LiquidityComponent from './components/LiquidityComponent';
import PoolsComponent from './components/PoolsComponent';
import { connectWallet, getProvider } from './utils/web3';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
    },
    secondary: {
      main: '#ff6b35',
    },
    background: {
      default: '#0a0e27',
      paper: '#1a1f3a',
    },
  },
});

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const provider = await getProvider();
      if (provider && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setProvider(provider);
        }
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setError('');
      const result = await connectWallet();
      setAccount(result.account);
      setProvider(result.provider);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h3" component="h1" fontWeight="bold" color="primary">
              🚀 Saga DEX
            </Typography>
            {account ? (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Connected: {formatAddress(account)}
                </Typography>
              </Box>
            ) : (
              <Button variant="contained" onClick={handleConnect} size="large">
                Connect Wallet
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!account && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Please connect your wallet to use the DEX
            </Alert>
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="DEX tabs">
              <Tab label="Swap" />
              <Tab label="Liquidity" />
              <Tab label="Pools" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <SwapComponent account={account} provider={provider} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <LiquidityComponent account={account} provider={provider} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <PoolsComponent account={account} provider={provider} />
          </TabPanel>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;
