import { useState } from "react";
import { ethers } from "ethers";

export default function SwapForm({ routerAddress, tokenAAddress, tokenBAddress }) {
    const [amountIn, setAmountIn] = useState("");
    const [minAmountOut, setMinAmountOut] = useState("");
    const [status, setStatus] = useState("");
    const [swapDirection, setSwapDirection] = useState("AtoB"); // either "AtoB" or "BtoA"

    async function handleSwap(e) {
        e.preventDefault();
        if (!window.ethereum) {
            setStatus("Please install MetaMask");
            return;
        }
        try {
            setStatus("Requesting account...");
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const routerAbi = [
                "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
            ];
            const routerContract = new ethers.Contract(routerAddress, routerAbi, signer);

            // Determine tokenIn and tokenOut based on direction
            let tokenIn = swapDirection === "AtoB" ? tokenAAddress : tokenBAddress;
            let tokenOut = swapDirection === "AtoB" ? tokenBAddress : tokenAAddress;

            const tokenAbi = [
                "function approve(address spender, uint256 amount) external returns (bool)"
            ];
            const tokenInContract = new ethers.Contract(tokenIn, tokenAbi, signer);

            const amountInParsed = ethers.parseUnits(amountIn, 18);
            const minAmountOutParsed = ethers.parseUnits(minAmountOut, 18);

            setStatus("Approving token...");
            const approveTx = await tokenInContract.approve(routerAddress, amountInParsed);
            await approveTx.wait();

            const path = [tokenIn, tokenOut];
            const deadline = Math.floor(Date.now() / 1000) + 300;

            setStatus("Executing swap...");
            const swapTx = await routerContract.swapExactTokensForTokens(
                amountInParsed,
                minAmountOutParsed,
                path,
                await signer.getAddress(),
                deadline
            );
            await swapTx.wait();
            setStatus("Swap successful!");
        } catch (error) {
            console.error("Swap failed:", error);
            setStatus("Swap failed: " + error.message);
        }
    }

    return (
        <div className="card">
            <h3 className="section-title">Swap Tokens</h3>
            <form onSubmit={handleSwap}>
                <div>
                    <label>
                        Select Swap Direction:
                        <br />
                        <label>
                            <input
                                type="radio"
                                value="AtoB"
                                checked={swapDirection === "AtoB"}
                                onChange={() => setSwapDirection("AtoB")}
                            />
                            {tokenAAddress} → {tokenBAddress}
                        </label>
                        <br />
                        <label>
                            <input
                                type="radio"
                                value="BtoA"
                                checked={swapDirection === "BtoA"}
                                onChange={() => setSwapDirection("BtoA")}
                            />
                            {tokenBAddress} → {tokenAAddress}
                        </label>
                    </label>
                </div>
                <div>
                    <label>
                        Enter Amount (Token In):
                        <input
                            type="number"
                            value={amountIn}
                            onChange={(e) => setAmountIn(e.target.value)}
                            placeholder="e.g., 100"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Minimum Amount Out (Token Out):
                        <input
                            type="number"
                            value={minAmountOut}
                            onChange={(e) => setMinAmountOut(e.target.value)}
                            placeholder="e.g., 90"
                        />
                    </label>
                </div>
                <button type="submit">Execute Swap</button>
                {status && <p>{status}</p>}
            </form>
        </div>
    );
}
