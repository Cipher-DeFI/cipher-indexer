import { createConfig } from "ponder";
import { http } from "viem";
import { CipherVaultAbi } from "./abis/CipherVaultAbi";

export default createConfig({
  chains: {
    avalanche: {
      id: 43113,
      rpc: http("https://api.avax-test.network/ext/bc/C/rpc"),
    },
  },
  contracts: {
    CipherVault: {
      abi: CipherVaultAbi,
      chain: "avalanche",
      address: "0x7Aa2608EeA7679FA66196DECd78989Bb13DACD38",
      startBlock: 42606732,
    },
  },
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL,
  }
});