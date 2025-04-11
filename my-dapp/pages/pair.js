// pages/pair.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ethers, JsonRpcProvider } from "ethers";
import Navbar from "../components/Navbar";
import ReserveCurveChart from "../components/ReserveCurveChart";

// 简单 Pair 合约 ABI，包含 token0/token1 和 getReserves
const pairAbi = [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function getReserves() view returns (uint112, uint112, uint32)",
];

export default function PairPage() {
    const router = useRouter();
    const { address } = router.query; // 从 URL 如 ?address=0x... 取地址
    const [pairDetails, setPairDetails] = useState(null);

    useEffect(() => {
        if (!address) return;
        async function fetchPairDetails() {
            const provider = new JsonRpcProvider(
                process.env.NEXT_PUBLIC_RPC_URL
            );
            const pairContract = new ethers.Contract(address, pairAbi, provider);
            const token0 = await pairContract.token0();
            const token1 = await pairContract.token1();
            const reserves = await pairContract.getReserves();
            setPairDetails({
                token0,
                token1,
                reserve0: Number(reserves[0]),
                reserve1: Number(reserves[1]),
            });
        }
        fetchPairDetails();
    }, [address]);

    return (
        <div>
            <Navbar />
            <main style={{ padding: "1rem" }}>
                <h1>池详情</h1>
                {pairDetails ? (
                    <div>
                        <p>
                            <strong>Token0：</strong> {pairDetails.token0}
                        </p>
                        <p>
                            <strong>Token1：</strong> {pairDetails.token1}
                        </p>
                        <p>
                            <strong>储备：</strong> {pairDetails.reserve0} - {pairDetails.reserve1}
                        </p>
                        <ReserveCurveChart
                            reserve0={pairDetails.reserve0}
                            reserve1={pairDetails.reserve1}
                        />
                    </div>
                ) : (
                    <p>加载中...</p>
                )}
            </main>
        </div>
    );
}
