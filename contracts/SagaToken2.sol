// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SagaToken2 is ERC20, ERC20Permit, Ownable {
    uint256 public constant INITIAL_SUPPLY = 2000000 * 10**18; // 2 million tokens
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18; // 10 million tokens max

    constructor() 
        ERC20("Saga Token 2", "SAGA2") 
        ERC20Permit("Saga Token 2")
        Ownable(msg.sender) 
    {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    function pause() public onlyOwner {
        // Additional functionality can be added here
    }

    function unpause() public onlyOwner {
        // Additional functionality can be added here
    }
}
