require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    saga: {
      url: "https://qubit-2755378989728000-1.jsonrpc.sagarpc.io",
      accounts: ["84ee5382ec49c86957c75fc7c3730102bdf2f67bebff73a209ca33356cf9f946"],
      chainId: 2755378989728000, // Saga chain ID
      gasPrice: "auto",
      gas: "auto",
      timeout: 60000,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
