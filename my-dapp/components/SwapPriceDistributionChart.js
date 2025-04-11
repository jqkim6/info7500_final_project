import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { ethers } from "ethers";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";

// Register Chart.js components
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function SwapPriceDistributionChart({ pairAddress, providerUrl }) {
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        async function fetchSwapData() {
            try {
                // Create JSON RPC provider (ensure providerUrl is correct)
                const provider = new ethers.JsonRpcProvider(providerUrl);
                const swapEventSignature = "Swap(address,uint256,uint256,uint256,uint256,address)";
                const swapTopic = ethers.id(swapEventSignature);

                // Define the block range (last 10,000 blocks)
                const latestBlock = await provider.getBlockNumber();
                const startBlock = Math.max(latestBlock - 10000, 0);

                // Query Swap event logs for the given pair
                const logs = await provider.getLogs({
                    fromBlock: startBlock,
                    toBlock: latestBlock,
                    address: pairAddress,
                    topics: [swapTopic],
                });

                // Define ABI for the Swap event for parsing logs
                const abi = [
                    "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"
                ];
                const iface = new ethers.Interface(abi);

                let prices = [];
                const logsToProcess = logs.slice(0, 50); // limit processing to first 50 events
                const pairAbi = [
                    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
                ];
                const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);

                for (const log of logsToProcess) {
                    try {
                        await pairContract.getReserves({ blockTag: log.blockNumber });
                    } catch (error) {
                        console.error("Error fetching reserves at block", log.blockNumber, ":", error);
                        continue;
                    }
                    const reserves = await pairContract.getReserves({ blockTag: log.blockNumber });
                    const reserve0 = Number(reserves.reserve0);
                    const reserve1 = Number(reserves.reserve1);
                    if (reserve0 === 0) continue;
                    const price = reserve1 / reserve0;
                    prices.push(price);
                }

                if (prices.length === 0) {
                    console.warn("No valid price data retrieved.");
                    return;
                }

                // Create histogram data (10 bins)
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                const binCount = 10;
                const binSize = (maxPrice - minPrice) / binCount;
                let bins = new Array(binCount).fill(0);

                prices.forEach(price => {
                    let binIndex = Math.floor((price - minPrice) / binSize);
                    if (binIndex === binCount) binIndex = binCount - 1;
                    bins[binIndex]++;
                });

                // Generate bin labels
                const labels = bins.map((_, idx) => {
                    const lower = (minPrice + idx * binSize).toFixed(2);
                    const upper = (minPrice + (idx + 1) * binSize).toFixed(2);
                    return `${lower} - ${upper}`;
                });

                setChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: "Swap Execution Price Distribution",
                            data: bins,
                            backgroundColor: "rgba(75,192,192,0.6)"
                        }
                    ]
                });
            } catch (error) {
                console.error("Error fetching Swap data:", error);
            }
        }
        fetchSwapData();
    }, [pairAddress, providerUrl]);

    const options = {
        responsive: true,
        plugins: {
            tooltip: {
                mode: "index",
                intersect: false
            },
            legend: {
                display: true,
                position: "top"
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "Price Range (reserve1/reserve0)"
                }
            },
            y: {
                title: {
                    display: true,
                    text: "Count"
                }
            }
        }
    };

    if (!chartData) return <p>Loading swap distribution chart...</p>;

    return (
        <div className="card">
            <h3 className="section-title">Historical Swap Execution Price Distribution</h3>
            <Bar data={chartData} options={options} />
        </div>
    );
}
