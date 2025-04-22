// components/NLInterface.js
import { useState, useEffect } from "react";
import axios from "axios";
import { ethers, isAddress } from "ethers";

export default function NLInterface({ promptOverride, apiKeyOverride }) {
    const [prompt, setPrompt] = useState(promptOverride || "");
    const [openaiKey, setOpenaiKey] = useState("");
    const [result, setResult] = useState(null);

    // Sync override key
    useEffect(() => { if (apiKeyOverride) setOpenaiKey(apiKeyOverride); }, [apiKeyOverride]);


    // Token address map
    const symbolToAddress = {
        TKA: process.env.NEXT_PUBLIC_TKA_ADDRESS,
        TKB: process.env.NEXT_PUBLIC_TKB_ADDRESS,
        TKC: process.env.NEXT_PUBLIC_TKC_ADDRESS,
        WETH: process.env.NEXT_PUBLIC_WETH_ADDRESS,
    };

    const erc20Abi = [
        "function approve(address spender, uint256 amount) external returns (bool)"
    ];
    const factoryAbi = [
        "function getPair(address tokenA, address tokenB) external view returns (address)"
    ];
    const pairReservesAbi = [
        "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32)",
        "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"
    ];

    async function handleSubmit() {
        setResult({ loading: true });
        try {
            const instructions = prompt.split(/[\.\n]+/).map(s => s.trim()).filter(Boolean);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            const toFallback = userAddress;
            const deadline = Math.floor(Date.now() / 1000) + 300;
            const routerAddress = process.env.NEXT_PUBLIC_ROUTER_ADDRESS;
            if (!routerAddress) throw new Error("Missing router address in env");

            const router = new ethers.Contract(
                routerAddress,
                [
                    "function swapExactTokensForTokens(uint256,uint256,address[],address,uint256) external",
                    "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) external",
                    "function removeLiquidity(address,address,uint256,uint256,uint256,address,uint256) external"
                ],
                signer
            );

            const parseAmt = v => (/^[0-9]+$/.test(v) && v.length > 18) ? BigInt(v) : ethers.parseUnits(v, 18);
            const results = [];

            for (const text of instructions) {
                const { data } = await axios.post("/api/llm", { text, openaiKey: openaiKey.trim() });
                const { openai } = data;
                const message = openai.choices[0].message;

                let call = message.function_call;
                if (!call) {
                    let content = message.content || "";
                    if (content.startsWith("```")) {
                        content = content.replace(/```[\s\S]*?```/, m => m.replace(/^```[a-z]*\n/, '').replace(/```$/, ''));
                    }
                    const parsed = JSON.parse(content);
                    call = parsed.function_call || parsed.functionCall;
                    if (!call) throw new Error(`No function_call for: ${text}`);
                }

                const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.parameters;
                const fnName = (call.name || call.function || '').split('.').pop();
                let tx;

                switch (fnName) {
                    case "swapExactTokensForTokens": {
                        const path = args.path.map(sym => symbolToAddress[sym.toUpperCase()] || sym);
                        if (path.length < 2 || path.some(a => !isAddress(a))) throw new Error(`Invalid path: ${args.path}`);
                        const amountIn = parseAmt(args.amountIn);
                        const amountOutMin = parseAmt(args.amountOutMin || "0");
                        await (await new ethers.Contract(path[0], erc20Abi, signer).approve(routerAddress, amountIn)).wait();
                        tx = await router.swapExactTokensForTokens(amountIn, amountOutMin, path, isAddress(args.to) ? args.to : toFallback, deadline);
                        await tx.wait();
                        results.push({ instruction: text, call, txHash: tx.hash });
                        break;
                    }
                    case "addLiquidity": {
                        const { tokenA, tokenB, amountADesired, amountBDesired } = args;
                        const amtA = parseAmt(amountADesired);
                        const amtB = parseAmt(amountBDesired);
                        const minA = args.amountAMin ? parseAmt(args.amountAMin) : BigInt(0);
                        const minB = args.amountBMin ? parseAmt(args.amountBMin) : BigInt(0);
                        await (await new ethers.Contract(tokenA, erc20Abi, signer).approve(routerAddress, amtA)).wait();
                        await (await new ethers.Contract(tokenB, erc20Abi, signer).approve(routerAddress, amtB)).wait();
                        tx = await router.addLiquidity(tokenA, tokenB, amtA, amtB, minA, minB, isAddress(args.to) ? args.to : toFallback, deadline);
                        await tx.wait();
                        results.push({ instruction: text, call, txHash: tx.hash });
                        break;
                    }
                    case "removeLiquidity": {
                        const { tokenA, tokenB, liquidity } = args;
                        const liq = parseAmt(liquidity);
                        const minA = args.amountAMin ? parseAmt(args.amountAMin) : BigInt(0);
                        const minB = args.amountBMin ? parseAmt(args.amountBMin) : BigInt(0);
                        const factory = new ethers.Contract(process.env.NEXT_PUBLIC_FACTORY_ADDRESS, factoryAbi, signer);
                        const pairAddr = await factory.getPair(tokenA, tokenB);
                        if (!pairAddr || pairAddr === ethers.ZeroAddress) throw new Error("Pair not found");
                        await (await new ethers.Contract(pairAddr, erc20Abi, signer).approve(routerAddress, liq)).wait();
                        tx = await router.removeLiquidity(tokenA, tokenB, liq, minA, minB, isAddress(args.to) ? args.to : toFallback, deadline);
                        await tx.wait();
                        results.push({ instruction: text, call, txHash: tx.hash });
                        break;
                    }
                    case "getReserves": {
                        const { tokenA, tokenB } = args;
                        const rpc = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
                        const factory = new ethers.Contract(process.env.NEXT_PUBLIC_FACTORY_ADDRESS, factoryAbi, rpc);
                        const pairAddr = await factory.getPair(tokenA, tokenB);
                        if (!pairAddr || pairAddr === ethers.ZeroAddress) throw new Error("Pair not found");
                        const pair = new ethers.Contract(pairAddr, pairReservesAbi, rpc);
                        const [r0, r1] = await pair.getReserves();
                        results.push({ instruction: text, call, result: { reserve0: r0.toString(), reserve1: r1.toString() } });
                        break;
                    }
                    case "countSwaps": {
                        const { pairAddress } = args;
                        if (!pairAddress || !isAddress(pairAddress)) {
                            throw new Error("Invalid or missing pairAddress. Please specify the pool address in your query.");
                        }
                        const rpc = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
                        const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
                        const sig = ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)");
                        const logs = await rpc.getLogs({ address: pairAddress, fromBlock: 0, toBlock: "latest", topics: [sig] });
                        let count = 0;
                        for (const log of logs) {
                            const blk = await rpc.getBlock(log.blockNumber);
                            if (blk.timestamp >= startOfDay) count++;
                        }
                        results.push({ instruction: text, call, result: { swapsToday: count } });
                        break;
                    }
                    default:
                        throw new Error(`Unsupported function: ${fnName}`);
                }
            }

            setResult({ completed: true, results });
        } catch (err) {
            console.error(err);
            setResult({ error: err.message });
        }
    }

    return (
        <div className="card p-4 my-4">
            <h3 className="text-xl font-bold mb-2">Natural Language Interface</h3>
            {!apiKeyOverride && (
                <input
                    type="password"
                    placeholder="OpenAI API Key"
                    className="w-full p-2 border mb-2"
                    value={openaiKey}
                    onChange={e => setOpenaiKey(e.target.value)}
                />
            )}
            <textarea
                rows={3}
                className="w-full p-2 border mb-2"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Enter a test prompt..."
            />
            <button className="w-full py-2 bg-blue-600 text-white rounded" onClick={handleSubmit}>
                Execute
            </button>
            {result?.loading && <p>Loading...</p>}
            {result?.completed && (
                <div className="mt-2">
                    <h4 className="font-semibold">Results:</h4>
                    {result.results.map((r, i) => (
                        <div key={i} className="mb-2 p-2 border rounded">
                            <p><strong>Instruction {i + 1}:</strong> {r.instruction}</p>
                            {r.txHash && <p><strong>Tx Hash:</strong> {r.txHash}</p>}
                            {r.result && <pre>{JSON.stringify(r.result, null, 2)}</pre>}
                        </div>
                    ))}
                </div>
            )}
            {result?.error && <p className="text-red-600 mt-2">Error: {result.error}</p>
            }
        </div>
    );
}
