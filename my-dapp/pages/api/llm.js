// pages/api/llm.js
import OpenAI from "openai";
import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Only POST allowed" });
    }
    const { text, openaiKey, modelUrl, hfToken } = req.body;
    if (!text || !openaiKey) {
        return res.status(400).json({ error: "Missing `text` or `openaiKey`" });
    }

    // 构建对话上下文
    const tokenCtx = `Available tokens: TKA=${process.env.NEXT_PUBLIC_TKA_ADDRESS}, ` +
        `TKB=${process.env.NEXT_PUBLIC_TKB_ADDRESS}, ` +
        `TKC=${process.env.NEXT_PUBLIC_TKC_ADDRESS}, ` +
        `WETH=${process.env.NEXT_PUBLIC_WETH_ADDRESS}`;

    const systemPrompt = `
You are a Uniswap assistant. ${tokenCtx}.
Interpret user instructions and map them to function calls ONLY. Do not output any other text.
Examples:
  - "swap 1 TKA for TKB" => swapExactTokensForTokens
  - "deposit 10 TKA and 10 TKB" => addLiquidity
  - "redeem 5 TKA and 5 TKB" => removeLiquidity
  - "what are the reserves of the pool"=> getReserves
  - "how many swaps have there been so far today?" => countSwaps
Rules:
  * Always respond with a JSON function_call object (no markdown).
  * Omit missing optional parameters; front-end will set defaults (e.g., amountMin="0", to=sender).
`;

    const messages = [
        { role: "system", content: systemPrompt.trim() },
        { role: "user", content: text }
    ];

    // 定义函数调用 schema
    const functions = [
        {
            name: "swapExactTokensForTokens",
            description: "Swap tokens via UniswapV2Router",
            parameters: {
                type: "object",
                properties: {
                    amountIn: { type: "string" },
                    amountOutMin: { type: "string" },
                    path: { type: "array", items: { type: "string", format: "address" } },
                    to: { type: "string", format: "address" },
                    deadline: { type: "integer" }
                },
                required: ["amountIn", "path", "deadline"]
            }
        },
        {
            name: "addLiquidity",
            description: "Add liquidity to a Uniswap pair",
            parameters: {
                type: "object",
                properties: {
                    tokenA: { type: "string", format: "address" },
                    tokenB: { type: "string", format: "address" },
                    amountADesired: { type: "string" },
                    amountBDesired: { type: "string" },
                    amountAMin: { type: "string" },
                    amountBMin: { type: "string" },
                    to: { type: "string", format: "address" },
                    deadline: { type: "integer" }
                },
                required: ["tokenA", "tokenB", "amountADesired", "amountBDesired", "deadline"]
            }
        },
        {
            name: "removeLiquidity",
            description: "Remove liquidity from a Uniswap pair",
            parameters: {
                type: "object",
                properties: {
                    tokenA: { type: "string", format: "address" },
                    tokenB: { type: "string", format: "address" },
                    liquidity: { type: "string" },
                    amountAMin: { type: "string" },
                    amountBMin: { type: "string" },
                    to: { type: "string", format: "address" },
                    deadline: { type: "integer" }
                },
                required: ["tokenA", "tokenB", "liquidity", "deadline"]
            }
        },
        {
            name: "getReserves",
            description: "Query current reserves of a Uniswap V2 pair",
            parameters: {
                type: "object",
                properties: {
                    tokenA: { type: "string", format: "address" },
                    tokenB: { type: "string", format: "address" }
                },
                required: ["tokenA", "tokenB"]
            }
        },
        {
            name: "countSwaps",
            description: "Count number of Swap events today for a Uniswap V2 pair",
            parameters: {
                type: "object",
                properties: {
                    pairAddress: { type: "string", format: "address" }
                },
                required: ["pairAddress"]
            }
        }
    ];

    try {
        const openaiClient = new OpenAI({ apiKey: openaiKey });
        const openaiResp = await openaiClient.chat.completions.create({
            model: "gpt-4o",
            messages,
            functions,
            function_call: "auto"
        });

        // 调用自定义 LLM（可选）
        let openSourceData = null;
        if (modelUrl) {
            try {
                if (/hf\.space/.test(modelUrl)) {
                    const resp = await axios.post(
                        modelUrl,
                        { data: [text] },
                        { headers: { "Content-Type": "application/json" } }
                    );
                    openSourceData = resp.data;
                } else {
                    const headers = {};
                    if (/api-inference\.huggingface\.co/.test(modelUrl) && hfToken) {
                        headers.Authorization = `Bearer ${hfToken}`;
                    }
                    const resp = await axios.post(
                        modelUrl,
                        { inputs: text, parameters: { function_definitions: functions } },
                        { headers }
                    );
                    openSourceData = resp.data;
                }
            } catch (err) {
                console.error("Open-source model error:", err);
                openSourceData = { error: err.message };
            }
        }

        console.log("🛠️ OpenAI 返回:", JSON.stringify(openaiResp, null, 2));
        return res.status(200).json({ openai: openaiResp, openSource: openSourceData });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
}
