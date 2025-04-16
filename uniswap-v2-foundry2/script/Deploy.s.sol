// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/UniswapV2Factory.sol";
import "../src/UniswapV2Router02.sol";

// 使用别名导入 OpenZeppelin ERC20 合约，避免与 Uniswap 的 IERC20 冲突
import { ERC20 as OZERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is OZERC20 {
    constructor(string memory name, string memory symbol, uint256 supply)
        OZERC20(name, symbol)
    {
        _mint(msg.sender, supply);
    }
}

contract DeployScript is Script {
    function run() external {
        // 从环境变量中获取私钥（确保在 .env 文件中设置 PRIVATE_KEY=...）
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 部署工厂合约（feeToSetter 可为部署账户地址）
        UniswapV2Factory factory = new UniswapV2Factory(msg.sender);
        console.log("Factory deployed at:", address(factory));

        // 部署一个 Mock WETH 用作示例
        MockToken weth = new MockToken("Wrapped Ether", "WETH", 10**24);
        console.log("WETH deployed at:", address(weth));
        // 同时部署两个额外的测试代币
        MockToken tokenA = new MockToken("Token A", "TKA", 1000 * 10**18);
        console.log("TokenA deployed at:", address(tokenA));
        MockToken tokenB = new MockToken("Token B", "TKB", 1000 * 10**18);
         console.log("TokenB deployed at:", address(tokenB));
        MockToken tokenC = new MockToken("Token C", "TKC", 1000 * 10**18);
         console.log("TokenC deployed at:", address(tokenC));


        // 部署 Router 合约，传入 factory 地址和 WETH 地址
        UniswapV2Router02 router = new UniswapV2Router02(address(factory), address(weth));
        console.log("Router deployed at:", address(router));

        vm.stopBroadcast();

        // 输出部署好的合约地址（可以在控制台打印或写日志）
        //console.log("Factory deployed at:", address(factory));
        //console.log("WETH deployed at:", address(weth));
        //console.log("TokenA deployed at:", address(tokenA));
        //console.log("TokenB deployed at:", address(tokenB));
        //console.log("TokenC deployed at:", address(tokenC));
        //console.log("Router deployed at:", address(router));
    }
}
