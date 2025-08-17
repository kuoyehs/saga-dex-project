// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DEXExchange is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Pool {
        uint256 tokenAReserve;
        uint256 tokenBReserve;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidityBalances;
    }

    mapping(address => mapping(address => Pool)) public pools;
    
    event LiquidityAdded(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        address indexed provider
    );
    
    event LiquidityRemoved(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        address indexed provider
    );
    
    event TokensSwapped(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed trader
    );

    constructor() Ownable(msg.sender) {}

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant {
        require(tokenA != tokenB, "Identical tokens");
        require(amountA > 0 && amountB > 0, "Invalid amounts");

        // Order tokens consistently
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
            (amountA, amountB) = (amountB, amountA);
        }

        Pool storage pool = pools[tokenA][tokenB];
        
        // Transfer tokens from user
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        uint256 liquidity;
        if (pool.totalLiquidity == 0) {
            // First liquidity provider
            liquidity = sqrt(amountA * amountB);
        } else {
            // Calculate liquidity proportional to existing pool
            liquidity = min(
                (amountA * pool.totalLiquidity) / pool.tokenAReserve,
                (amountB * pool.totalLiquidity) / pool.tokenBReserve
            );
        }

        pool.tokenAReserve += amountA;
        pool.tokenBReserve += amountB;
        pool.totalLiquidity += liquidity;
        pool.liquidityBalances[msg.sender] += liquidity;

        emit LiquidityAdded(tokenA, tokenB, amountA, amountB, msg.sender);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity
    ) external nonReentrant {
        require(tokenA != tokenB, "Identical tokens");
        require(liquidity > 0, "Invalid liquidity");

        // Order tokens consistently
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }

        Pool storage pool = pools[tokenA][tokenB];
        require(pool.liquidityBalances[msg.sender] >= liquidity, "Insufficient liquidity");

        uint256 amountA = (liquidity * pool.tokenAReserve) / pool.totalLiquidity;
        uint256 amountB = (liquidity * pool.tokenBReserve) / pool.totalLiquidity;

        pool.liquidityBalances[msg.sender] -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.tokenAReserve -= amountA;
        pool.tokenBReserve -= amountB;

        IERC20(tokenA).safeTransfer(msg.sender, amountA);
        IERC20(tokenB).safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(tokenA, tokenB, amountA, amountB, msg.sender);
    }

    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant {
        require(tokenIn != tokenOut, "Identical tokens");
        require(amountIn > 0, "Invalid amount");

        // Order tokens consistently to find the pool
        address tokenA = tokenIn < tokenOut ? tokenIn : tokenOut;
        address tokenB = tokenIn < tokenOut ? tokenOut : tokenIn;
        
        Pool storage pool = pools[tokenA][tokenB];
        require(pool.totalLiquidity > 0, "Pool does not exist");

        uint256 reserveIn = tokenIn == tokenA ? pool.tokenAReserve : pool.tokenBReserve;
        uint256 reserveOut = tokenIn == tokenA ? pool.tokenBReserve : pool.tokenAReserve;

        // Calculate output amount using constant product formula (x * y = k)
        // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        // Apply 0.3% fee
        uint256 amountInWithFee = amountIn * 997;
        uint256 amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
        
        require(amountOut >= minAmountOut, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");

        // Transfer tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        // Update reserves
        if (tokenIn == tokenA) {
            pool.tokenAReserve += amountIn;
            pool.tokenBReserve -= amountOut;
        } else {
            pool.tokenBReserve += amountIn;
            pool.tokenAReserve -= amountOut;
        }

        emit TokensSwapped(tokenIn, tokenOut, amountIn, amountOut, msg.sender);
    }

    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256) {
        require(tokenIn != tokenOut, "Identical tokens");
        
        address tokenA = tokenIn < tokenOut ? tokenIn : tokenOut;
        address tokenB = tokenIn < tokenOut ? tokenOut : tokenIn;
        
        Pool storage pool = pools[tokenA][tokenB];
        if (pool.totalLiquidity == 0) return 0;

        uint256 reserveIn = tokenIn == tokenA ? pool.tokenAReserve : pool.tokenBReserve;
        uint256 reserveOut = tokenIn == tokenA ? pool.tokenBReserve : pool.tokenAReserve;

        uint256 amountInWithFee = amountIn * 997;
        return (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    function getPoolInfo(address tokenA, address tokenB) 
        external 
        view 
        returns (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity) 
    {
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        Pool storage pool = pools[tokenA][tokenB];
        return (pool.tokenAReserve, pool.tokenBReserve, pool.totalLiquidity);
    }

    function getUserLiquidity(address tokenA, address tokenB, address user) 
        external 
        view 
        returns (uint256) 
    {
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
        }
        return pools[tokenA][tokenB].liquidityBalances[user];
    }

    // Helper functions
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
