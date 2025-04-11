import { useState } from "react";
import { ethers } from "ethers";

export default function AddLiquidityForm({ routerAddress, tokenAAddress, tokenBAddress }) {
    const [amountA, setAmountA] = useState("");
    const [amountB, setAmountB] = useState("");
    const [status, setStatus] = useState("");

    async function handleAddLiquidity(e) {
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
                "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)"
            ];

            const routerContract = new ethers.Contract(routerAddress, routerAbi, signer);
            const tokenAbi = [
                "function approve(address spender, uint256 amount) external returns (bool)"
            ];
            const tokenAContract = new ethers.Contract(tokenAAddress, tokenAbi, signer);
            const tokenBContract = new ethers.Contract(tokenBAddress, tokenAbi, signer);

            const amountADesired = ethers.parseUnits(amountA, 18);
            const amountBDesired = ethers.parseUnits(amountB, 18);

            setStatus("Approving tokens...");
            const tx1 = await tokenAContract.approve(routerAddress, amountADesired);
            await tx1.wait();
            const tx2 = await tokenBContract.approve(routerAddress, amountBDesired);
            await tx2.wait();

            const deadline = Math.floor(Date.now() / 1000) + 1000;
            setStatus("Adding liquidity...");
            const tx = await routerContract.addLiquidity(
                tokenAAddress,
                tokenBAddress,
                amountADesired,
                amountBDesired,
                1,
                1,
                await signer.getAddress(),
                deadline
            );
            await tx.wait();
            setStatus("Liquidity added successfully!");
        } catch (error) {
            console.error(error);
            setStatus("Failed to add liquidity");
        }
    }

    return (
        <div className="card">
            <h3 className="section-title">Add Liquidity</h3>
            <form onSubmit={handleAddLiquidity}>
                <div>
                    <label>
                        Token A Amount:
                        <input
                            type="number"
                            value={amountA}
                            onChange={(e) => setAmountA(e.target.value)}
                            placeholder="e.g., 100"
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Token B Amount:
                        <input
                            type="number"
                            value={amountB}
                            onChange={(e) => setAmountB(e.target.value)}
                            placeholder="e.g., 200"
                        />
                    </label>
                </div>
                <button type="submit">Add Liquidity</button>
                <p>{status}</p>
            </form>
        </div>
    );
}
