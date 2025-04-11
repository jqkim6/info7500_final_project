import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function RedeemForm({ routerAddress, tokenAAddress, tokenBAddress, pairAddress }) {
    // 用户输入的赎回数量（直接以 LP Token 数量输入，例如 "5.62"）
    const [redeemAmountInput, setRedeemAmountInput] = useState("");
    const [status, setStatus] = useState("");
    // 用户当前 LP Token 余额（18位小数）
    const [lpBalance, setLpBalance] = useState("");

    // 获取用户 LP Token 余额
    useEffect(() => {
        async function fetchLpBalance() {
            if (!window.ethereum || !pairAddress) return;
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const userAddress = await signer.getAddress();
                const balanceAbi = ["function balanceOf(address) view returns (uint256)"];
                const pairContract = new ethers.Contract(pairAddress, balanceAbi, provider);
                const balance = await pairContract.balanceOf(userAddress);
                setLpBalance(ethers.formatUnits(balance, 18));
            } catch (error) {
                console.error("Failed to fetch LP token balance:", error);
            }
        }
        fetchLpBalance();
    }, [pairAddress]);

    async function handleRedeem(e) {
        e.preventDefault();
        if (!window.ethereum) {
            setStatus("Please install MetaMask");
            return;
        }
        if (!redeemAmountInput || isNaN(parseFloat(redeemAmountInput))) {
            setStatus("Please enter a valid redeem amount");
            return;
        }
        if (parseFloat(redeemAmountInput) <= 0) {
            setStatus("Please enter an amount greater than 0");
            return;
        }
        if (parseFloat(redeemAmountInput) > parseFloat(lpBalance)) {
            setStatus("Redeem amount exceeds your LP Token balance!");
            return;
        }
        try {
            setStatus("Requesting account...");
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();

            // 定义 Pair 合约所需 ABI，包括 transfer、burn 和 balanceOf 方法
            const pairAbi = [
                "function transfer(address to, uint256 amount) external returns (bool)",
                "function burn(address to) external returns (uint amount0, uint amount1)",
                "function balanceOf(address owner) view returns (uint256)"
            ];
            const pairContract = new ethers.Contract(pairAddress, pairAbi, signer);
            const liquidityParsed = ethers.parseUnits(redeemAmountInput, 18);

            // 使用 transfer 将 LP Token 转移到 Pair 合约地址
            setStatus("Transferring LP Tokens to pool...");
            const transferTx = await pairContract.transfer(pairAddress, liquidityParsed);
            await transferTx.wait();

            // 调用 burn 方法赎回流动性
            setStatus("Redeeming...");
            const burnTx = await pairContract.burn(userAddress);
            await burnTx.wait();

            setStatus("Redemption successful!");

            // 刷新 LP Token 余额
            const balanceAbi = ["function balanceOf(address) view returns (uint256)"];
            const pairForBalance = new ethers.Contract(pairAddress, balanceAbi, provider);
            const newBalance = await pairForBalance.balanceOf(userAddress);
            setLpBalance(ethers.formatUnits(newBalance, 18));
        } catch (error) {
            console.error("Redemption failed:", error);
            setStatus("Redemption failed: " + error.message);
        }
    }

    return (
        <div className="card">
            <h3 className="section-title">Redeem Liquidity</h3>
            <h4>
                Current LP Token Balance: {lpBalance ? lpBalance : "Loading..."}
            </h4>
            <div>
                <label>
                    Redeem Amount (LP Tokens):
                    <input
                        type="number"
                        value={redeemAmountInput}
                        onChange={(e) => setRedeemAmountInput(e.target.value)}
                        placeholder="e.g., 5.62"
                    />
                </label>
            </div>
            <form onSubmit={handleRedeem}>
                <button type="submit">Redeem Liquidity</button>
                {status && <p>{status}</p>}
            </form>
        </div>
    );
}
