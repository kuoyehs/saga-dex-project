const hre = require("hardhat");

async function main() {
  console.log("Starting deployment to Saga network...");
  console.log("Network:", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Target wallet for token transfers
  const targetWallet = "0x9670d0ca0ca6b7032051717FbADE2f02DF1358F0";

  // Deploy SagaToken1
  console.log("\nDeploying SagaToken1...");
  const SagaToken1 = await hre.ethers.getContractFactory("SagaToken1");
  const sagaToken1 = await SagaToken1.deploy();
  await sagaToken1.waitForDeployment();
  
  const token1Address = await sagaToken1.getAddress();
  console.log("SagaToken1 deployed to:", token1Address);

  // Deploy SagaToken2
  console.log("\nDeploying SagaToken2...");
  const SagaToken2 = await hre.ethers.getContractFactory("SagaToken2");
  const sagaToken2 = await SagaToken2.deploy();
  await sagaToken2.waitForDeployment();
  
  const token2Address = await sagaToken2.getAddress();
  console.log("SagaToken2 deployed to:", token2Address);

  // Deploy TestToken
  console.log("\nDeploying TestToken...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  
  const testTokenAddress = await testToken.getAddress();
  console.log("TestToken deployed to:", testTokenAddress);

  // Deploy USDToken
  console.log("\nDeploying USDToken...");
  const USDToken = await hre.ethers.getContractFactory("USDToken");
  const usdToken = await USDToken.deploy();
  await usdToken.waitForDeployment();
  
  const usdTokenAddress = await usdToken.getAddress();
  console.log("USDToken deployed to:", usdTokenAddress);

  // Deploy DEX Exchange
  console.log("\nDeploying DEX Exchange...");
  const DEXExchange = await hre.ethers.getContractFactory("DEXExchange");
  const dexExchange = await DEXExchange.deploy();
  await dexExchange.waitForDeployment();
  
  const dexAddress = await dexExchange.getAddress();
  console.log("DEX Exchange deployed to:", dexAddress);

  // Transfer tokens to target wallet
  console.log("\n=== Transferring Tokens ===");
  
  // Transfer 10,000 TEST tokens
  const testAmount = hre.ethers.parseEther("10000");
  await testToken.transfer(targetWallet, testAmount);
  console.log(`Transferred ${hre.ethers.formatEther(testAmount)} TEST tokens to ${targetWallet}`);
  
  // Transfer 10,000 USD tokens
  const usdAmount = hre.ethers.parseEther("10000");
  await usdToken.transfer(targetWallet, usdAmount);
  console.log(`Transferred ${hre.ethers.formatEther(usdAmount)} USD tokens to ${targetWallet}`);

  // Transfer 1,000 SAGA1 tokens
  const saga1Amount = hre.ethers.parseEther("1000");
  await sagaToken1.transfer(targetWallet, saga1Amount);
  console.log(`Transferred ${hre.ethers.formatEther(saga1Amount)} SAGA1 tokens to ${targetWallet}`);

  // Transfer 1,000 SAGA2 tokens
  const saga2Amount = hre.ethers.parseEther("1000");
  await sagaToken2.transfer(targetWallet, saga2Amount);
  console.log(`Transferred ${hre.ethers.formatEther(saga2Amount)} SAGA2 tokens to ${targetWallet}`);

  // Verify deployment by checking token details
  console.log("\n=== Deployment Summary ===");
  console.log("SagaToken1:");
  console.log("  Address:", token1Address);
  console.log("  Name:", await sagaToken1.name());
  console.log("  Symbol:", await sagaToken1.symbol());
  console.log("  Total Supply:", hre.ethers.formatEther(await sagaToken1.totalSupply()));
  console.log("  Decimals:", await sagaToken1.decimals());

  console.log("\nSagaToken2:");
  console.log("  Address:", token2Address);
  console.log("  Name:", await sagaToken2.name());
  console.log("  Symbol:", await sagaToken2.symbol());
  console.log("  Total Supply:", hre.ethers.formatEther(await sagaToken2.totalSupply()));
  console.log("  Decimals:", await sagaToken2.decimals());

  console.log("\nTestToken:");
  console.log("  Address:", testTokenAddress);
  console.log("  Name:", await testToken.name());
  console.log("  Symbol:", await testToken.symbol());
  console.log("  Total Supply:", hre.ethers.formatEther(await testToken.totalSupply()));
  console.log("  Decimals:", await testToken.decimals());

  console.log("\nUSDToken:");
  console.log("  Address:", usdTokenAddress);
  console.log("  Name:", await usdToken.name());
  console.log("  Symbol:", await usdToken.symbol());
  console.log("  Total Supply:", hre.ethers.formatEther(await usdToken.totalSupply()));
  console.log("  Decimals:", await usdToken.decimals());

  console.log("\nDEX Exchange:");
  console.log("  Address:", dexAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    targetWallet: targetWallet,
    timestamp: new Date().toISOString(),
    contracts: {
      SagaToken1: {
        address: token1Address,
        name: await sagaToken1.name(),
        symbol: await sagaToken1.symbol(),
        totalSupply: await sagaToken1.totalSupply()
      },
      SagaToken2: {
        address: token2Address,
        name: await sagaToken2.name(),
        symbol: await sagaToken2.symbol(),
        totalSupply: await sagaToken2.totalSupply()
      },
      TestToken: {
        address: testTokenAddress,
        name: await testToken.name(),
        symbol: await testToken.symbol(),
        totalSupply: await testToken.totalSupply()
      },
      USDToken: {
        address: usdTokenAddress,
        name: await usdToken.name(),
        symbol: await usdToken.symbol(),
        totalSupply: await usdToken.totalSupply()
      },
      DEXExchange: {
        address: dexAddress
      }
    }
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\nDeployment info saved to deployment-info.json");
  console.log("Deployment completed successfully! 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
