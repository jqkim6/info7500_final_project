import { Line } from "react-chartjs-2";
import { Chart, LineElement, CategoryScale, LinearScale, ScatterController, PointElement, Tooltip, Legend } from "chart.js";
import { useEffect, useState } from "react";

// Register Chart.js components
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function ReserveCurveChart({ reserve0, reserve1 }) {
    // Compute constant k = reserve0 * reserve1
    const k = reserve0 * reserve1;
    const [chartData, setChartData] = useState(null);
    

    useEffect(() => {
        if (!reserve0 || !reserve1) return;
        let curveData = [];
        // Sample 50 points in the range [reserve0 * 0.5, reserve0 * 1.5]
        const start = reserve0 * 0.5;
        const end = reserve0 * 1.5;
        const steps = 50;
        const stepSize = (end - start) / steps;
        for (let i = 0; i <= steps; i++) {
            let x = start + stepSize * i;
            curveData.push({ x: x, y: k / x });
        }
        // Define the current point
        const currentPoint = { x: reserve0, y: reserve1 };

        setChartData({
            datasets: [
                {
                    label: "Reserve Curve: x * y = k",
                    data: curveData,
                    fill: false,
                    borderColor: "blue",
                    borderWidth: 2,
                    tension: 0.1,
                    pointRadius: 0
                },
                {
                    label: "Current Point",
                    data: [currentPoint],
                    backgroundColor: "red",
                    borderColor: "red",
                    type: "scatter",
                    pointRadius: 6
                }
            ]
        });
    }, [reserve0, reserve1, k]);

    const options = {
        responsive: true,
        scales: {
            x: {
                type: "linear",
                position: "bottom",
                title: { display: true, text: "Reserve0 (x)" }
            },
            y: {
                title: { display: true, text: "Reserve1 (y)" }
            }
        },
        plugins: {
            tooltip: { mode: "index", intersect: false },
            legend: { display: true, position: "top" }
        }
    };

    if (!chartData) return <p>Loading chart...</p>;

    return (
        <div className="card">
            <h3 className="section-title">Reserve Curve</h3>
            <Line data={chartData} options={options} />
            <p>
                Current state: ({reserve0}, {reserve1})
            </p>
        </div>
    );
}
