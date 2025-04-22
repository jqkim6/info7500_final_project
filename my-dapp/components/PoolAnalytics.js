import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function PoolAnalytics({ pairAddress }) {
    const [reserves, setReserves] = useState(null);
    const [swapsToday, setSwapsToday] = useState(0);

    useEffect(() => {
        (async () => {
            const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
            const pairAbi = ["function getReserves() view returns (uint112,uint112,uint32)"];
            const pair = new ethers.Contract(pairAddress, pairAbi, provider);
            const r = await pair.getReserves();
            setReserves([r._reserve0.toString(), r._reserve1.toString()]);

            // 统计当天 Swap 事件
            const swapSig = ethers.id("Swap(address,uint256,uint256,uint256,uint256,address)");
            const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
            const logs = await provider.getLogs({
                address: pairAddress,
                fromBlock: 0,
                toBlock: "latest",
                topics: [swapSig]
            });
            // 简化，只按时间戳过滤
            let cnt = 0;
            for (let log of logs) {
                const block = await provider.getBlock(log.blockNumber);
                if (block.timestamp >= startOfDay) cnt++;
            }
            setSwapsToday(cnt);
        })();
    }, [pairAddress]);

    return reserves ? (
        <div className="card p-4 my-4">
            <h3 className="text-lg font-bold">Pool Analytics</h3>
            <p>Reserves: {reserves[0]} - {reserves[1]}</p>
            <p>Swaps Today: {swapsToday}</p>
        </div>
    ) : null;
}
