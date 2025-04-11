import React from "react";
import ReserveCurveChart from "./ReserveCurveChart";
import AddLiquidityForm from "./AddLiquidityForm";
import SwapForm from "./SwapForm";
import RedeemForm from "./RedeemForm";
import SwapPriceDistributionChart from "./SwapPriceDistributionChart";

export default function PoolActions({ pool, routerAddress }) {
    return (
        <div className="card">
            <h2 className="section-title">Pool Details</h2>
            <p>
                <strong>Pool Address:</strong> {pool.address}
            </p>
            <p>
                <strong>Token0:</strong> {pool.token0} <br />
                <strong>Token1:</strong> {pool.token1}
            </p>
            <p>
                <strong>Reserves:</strong> {pool.reserve0} - {pool.reserve1}
            </p>
            <ReserveCurveChart
                reserve0={Number(pool.reserve0)}
                reserve1={Number(pool.reserve1)}
            />
            <hr />
            <SwapPriceDistributionChart
                pairAddress={pool.address}
                providerUrl={process.env.NEXT_PUBLIC_RPC_URL}
            />
            <hr />
            <h3 className="section-title">Add Liquidity (Deposit)</h3>
            <AddLiquidityForm
                routerAddress={routerAddress}
                tokenAAddress={pool.token0}
                tokenBAddress={pool.token1}
            />
            <hr />
            <h3 className="section-title">Redeem Liquidity (Redeem)</h3>
            <RedeemForm
                routerAddress={routerAddress}
                tokenAAddress={pool.token0}
                tokenBAddress={pool.token1}
                pairAddress={pool.address}
            />
            <hr />
            <h3 className="section-title">Swap (Exchange)</h3>
            <SwapForm
                routerAddress={routerAddress}
                tokenAAddress={pool.token0}
                tokenBAddress={pool.token1}
            />
        </div>
    );
}
