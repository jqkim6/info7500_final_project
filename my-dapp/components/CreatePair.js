import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function CreatePair({ factoryAddress }) {
    const [tokenAInput, setTokenAInput] = useState("");
    const [tokenBInput, setTokenBInput] = useState("");
    const [pairAddress, setPairAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [hasMetamask, setHasMetamask] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && window.ethereum) {
            setHasMetamask(true);
        } else {
            setErrorMsg("MetaMask not detected, please install the MetaMask extension!");
        }
    }, []);

    async function handleCreatePair() {
        if (!hasMetamask) return;
        if (!tokenAInput || !tokenBInput) {
            setErrorMsg("Please enter two valid token addresses");
            return;
        }
        setLoading(true);
        setErrorMsg("");
        setPairAddress("");
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const factoryAbi = [
                "function createPair(address tokenA, address tokenB) external returns (address pair)",
                "function getPair(address tokenA, address tokenB) external view returns (address)"
            ];

            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, signer);

            // Call createPair; if the pool already exists, it will revert
            const tx = await factoryContract.createPair(tokenAInput, tokenBInput);
            console.log("Transaction submitted, please wait for confirmation...");
            await tx.wait();

            // Retrieve the created Pair address
            const pairAddr = await factoryContract.getPair(tokenAInput, tokenBInput);
            console.log("Pair successfully created, address:", pairAddr);
            setPairAddress(pairAddr);
        } catch (error) {
            console.error("Failed to create liquidity pool:", error);
            if (error.message.includes("PAIR_EXISTS")) {
                setErrorMsg("This liquidity pool already exists!");
            } else {
                setErrorMsg(error.message);
            }
        }
        setLoading(false);
    }

    return (
        <div className="card">
            <h3 className="section-title">Create Liquidity Pool</h3>
            <div>
                <label>
                    Token A Address:
                    <input
                        type="text"
                        value={tokenAInput}
                        onChange={(e) => setTokenAInput(e.target.value)}
                        placeholder="Enter Token A address"
                    />
                </label>
            </div>
            <div>
                <label>
                    Token B Address:
                    <input
                        type="text"
                        value={tokenBInput}
                        onChange={(e) => setTokenBInput(e.target.value)}
                        placeholder="Enter Token B address"
                    />
                </label>
            </div>
            <button onClick={handleCreatePair} disabled={loading}>
                {loading ? "Creating..." : "Create Liquidity Pool"}
            </button>
            {pairAddress && (
                <p>
                    Successfully created Pair, Address: <code>{pairAddress}</code>
                </p>
            )}
            {errorMsg && <p style={{ color: "red" }}>Error: {errorMsg}</p>}
        </div>
    );
}
