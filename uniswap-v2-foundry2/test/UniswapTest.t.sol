// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/UniswapV2Factory.sol";
import "../src/UniswapV2Pair.sol";
import "../src/UniswapV2Router02.sol";
// 使用别名导入 OpenZeppelin ERC20 合约，避免与 Uniswap 的 IERC20 冲突
import { ERC20 as OZERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// 新建一个 MockToken 合约，用于测试，确保能调用 _mint
contract MockTokenForTest is OZERC20 {
    constructor(string memory name, string memory symbol)
        OZERC20(name, symbol)
    {
        _mint(msg.sender, 1000 * 10**18);
    }
}

contract UniswapTest is Test {
    UniswapV2Factory factory;
    UniswapV2Router02 router;
    OZERC20 tokenA;
    OZERC20 tokenB;
    address deployer;

    function setUp() public {
        deployer = address(this);
        factory = new UniswapV2Factory(deployer);
        // 使用 MockTokenForTest 来部署测试代币
        tokenA = new MockTokenForTest("Token A", "TKA");
        tokenB = new MockTokenForTest("Token B", "TKB");
        // 部署一个测试 WETH 同样使用 MockTokenForTest
        OZERC20 weth = new MockTokenForTest("Wrapped Ether", "WETH");
        router = new UniswapV2Router02(address(factory), address(weth));
    }

    function testCreatePair() public {
        // 调用工厂创建流动性池
        factory.createPair(address(tokenA), address(tokenB));
        address pair = factory.getPair(address(tokenA), address(tokenB));
        assert(pair != address(0));
    }
}
