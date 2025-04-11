import { useEffect, useState } from "react";
import { ethers } from "ethers";

const factoryAbi = [
    "function allPairsLength() view returns (uint256)",
    "function allPairs(uint256) view returns (address)"
];

const pairAbi = [
    "function token0() view returns (address)",
    "function token1() view returns (address)",
    "function getReserves() view returns (uint112, uint112, uint32)"
];

export default function PairList({ onSelect, selectedPair }) {
    const [pairs, setPairs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchPairs() {
            setLoading(true);
            const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
            const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, provider);
            const pairLength = await factoryContract.allPairsLength();
            const pairList = [];
            for (let i = 0; i < pairLength; i++) {
                const pairAddress = await factoryContract.allPairs(i);
                const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);
                const token0 = await pairContract.token0();
                const token1 = await pairContract.token1();
                const reserves = await pairContract.getReserves();
                pairList.push({
                    address: pairAddress,
                    token0,
                    token1,
                    reserve0: reserves[0].toString(),
                    reserve1: reserves[1].toString()
                });
            }
            setPairs(pairList);
            setLoading(false);
        }
        fetchPairs();
    }, []);

    return (
        <div className="card">
            <h2 className="section-title">Liquidity Pools List</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {pairs.map((pair) => (
                        <li
                            key={pair.address}
                            onClick={() => onSelect(pair)}
                            className={`list-item ${selectedPair === pair.address ? "selected" : ""}`}
                            style={{ cursor: "pointer", marginBottom: "1rem" }}
                        >
                            {pair.token0} - {pair.token1}
                            <br />
                            <strong>Reserves:</strong> {pair.reserve0} - {pair.reserve1}
                            <br />
                            <strong>Address:</strong> {pair.address}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
