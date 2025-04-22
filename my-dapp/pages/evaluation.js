// pages/evaluation.js
import { useState } from "react";
import NLInterface from "../components/NLInterface";

const DEFAULT_TESTS = [
    {
        name: "Swap TKA→TKB",
        prompt: "swap 1 TKA for TKB",
        expected: "swapExactTokensForTokens"
    },
    {
        name: "Add Liquidity",
        prompt: "deposit 1 TKA and 1 TKB",
        expected: "addLiquidity"
    },
    {
        name: "Remove Liquidity",
        prompt: "redeem 1 TKA and 1 TKB",
        expected: "removeLiquidity"
    },
    {
        name: "Remove Liquidity",
        prompt: "withdraw 2 TKA and 1 TKB",
        expected: "removeLiquidity"
    },
    {
        name: "Multi Function Call",
        prompt: "deposit 1 TKA and 1 TKB. redeem 1 TKA and 1 TKB",
        expected: "addLiquidity, removeLiquidity"
    },
    {
        name: "Multi Function Call",
        prompt: "deposit 1 TKA and 1 TKB. swap 1 TKA for TKB",
        expected: "addLiquidity, swapExactTokensForTokens"
    },
    {
        name: "Get Reserves",
        prompt: "what are the reserves of the TKA-TKB pool?",
        expected: "getReserves"
    },
    {
        name: "Count Swaps Today",
        prompt: "how many swaps have there been so far today in the TKA-TKB pool?",
        expected: "countSwaps"
    },
    { name: "Slippage Swap", prompt: "swap 1.2345 TKA for maximum possible TKB given a slippage of 1%", expected: "unsupported" },
    { name: "Minimum Received Add", prompt: "deposit 5 TKA and 5 TKB but ensure at least 4.9 TKA and 4.8 TKB", expected: "unsupported" },
    { name: "Proportional Redeem", prompt: "redeem half of my liquidity position in the TKA-WETH pool", expected: "unsupported" },
    { name: "Filter Large Swaps", prompt: "how many swaps above 10 TKB occurred today in the TKA-TKB pool?", expected: "unsupported" },
    { name: "Average Swap Size", prompt: "what was the average swap size in the TKC-WETH pool over last 24 hours?", expected: "unsupported" },
    { name: "Price Impact", prompt: "show me the price impact for swapping 100 TKA to TKB", expected: "unsupported" },
    { name: "Compound Operation", prompt: "withdraw liquidity and immediately swap half of redeemed assets", expected: "unsupported" },
    { name: "Fee Growth", prompt: "what's the fee growth per liquidity token in the TKA-TKC pool?", expected: "unsupported" },
    { name: "Simulate Add", prompt: "simulate adding 10 TKB and 1 WETH and show resulting price", expected: "unsupported" },
    { name: "Top Volume Pool", prompt: "find the pool with highest volume in last hour", expected: "unsupported" }
];

export default function Evaluation() {
    const [openaiKey, setOpenaiKey] = useState("");
    const [tests, setTests] = useState(DEFAULT_TESTS);

    function addCase() {
        setTests([...tests, { name: "", prompt: "", expected: "" }]);
    }

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Task Evaluation</h1>
            <input
                type="password"
                placeholder="OpenAI API Key"
                className="w-full p-2 border mb-4"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
            />
            <button onClick={addCase} className="mb-4 px-3 py-1 bg-green-500 text-white rounded">
                Add Test Case
            </button>
            {tests.map((t, i) => (
                <div key={i} className="card p-4 my-2">
                    <h2 className="font-semibold">{t.name || `Case ${i + 1}`}</h2>
                    <p><strong>Prompt:</strong> {t.prompt}</p>
                    <p><strong>Expected:</strong> {t.expected}</p>
                    <NLInterface promptOverride={t.prompt} apiKeyOverride={openaiKey} />
                </div>
            ))}
        </div>
    );
}