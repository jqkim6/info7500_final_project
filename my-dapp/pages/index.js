// pages/index.js
import { useState } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import CreatePair from "../components/CreatePair";
import PairList from "../components/PairList";
import PoolActions from "../components/PoolActions";

export default function Home() {
  const [selectedPool, setSelectedPool] = useState(null);

  // const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  // const routerAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
  const factoryAddress = "0x2263eFE69285AA0C1eA487bC69EB2BA4225B9c31";
  const routerAddress = "0x082bE369B2d1E8D0Cbd2Ad90A94d4a458836aDDF";

  return (
    <div>
      <Head>
        <title>Uniswap V2 UI</title>
      </Head>
      <main className="max-w-5xl mx-auto p-4">
        <header className="bg-blue-600 text-white p-4 rounded text-center">
          <h1 className="text-3xl font-bold">Uniswap V2 UI</h1>
        </header>
        <section className="bg-white p-6 rounded shadow my-4">
          <h2 className="text-xl text-blue-600 mb-4">Create Liquidity Pool</h2>
          <CreatePair factoryAddress={factoryAddress} />
        </section>
        <section className="bg-white p-6 rounded shadow my-4">
          <h2 className="text-xl text-blue-600 mb-4">Select Pool</h2>
          <PairList
            selectedPair={selectedPool ? selectedPool.address : null}
            onSelect={(pool) => setSelectedPool(pool)}
          />
        </section>
        {selectedPool && (
          <section className="bg-white p-6 rounded shadow my-4">
            <PoolActions pool={selectedPool} routerAddress={routerAddress} />
          </section>
        )}
      </main>
    </div>
  );
}
