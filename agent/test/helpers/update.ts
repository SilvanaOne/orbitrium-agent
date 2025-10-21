import { Transaction } from "@mysten/sui/transactions";
import {
  executeTx,
  waitTx,
  getSuiAddress,
  AgentRegistry,
} from "@silvana-one/coordination";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { developerName, agentName } from "./create.js";

export async function updateAgent() {
  const suiSecretKey: string = process.env.SUI_SECRET_KEY!;

  if (!suiSecretKey) {
    throw new Error("Missing environment variable SUI_SECRET_KEY");
  }
  process.env.SUI_KEY = suiSecretKey;

  const registryAddress = process.env.SILVANA_REGISTRY;
  if (!registryAddress) {
    throw new Error("SILVANA_REGISTRY is not set");
  }

  if (!process.env.DOCKER_IMAGE) {
    throw new Error("DOCKER_IMAGE is not set");
  }

  const keyPair = Ed25519Keypair.fromSecretKey(suiSecretKey);
  const address = await getSuiAddress({
    secretKey: suiSecretKey,
  });
  console.log("sender:", address);

  const registry = new AgentRegistry({ registry: registryAddress });

  console.log("Updating agent method...");
  const transaction = new Transaction();

  registry.updateAgentMethod({
    developer: developerName,
    agent: agentName,
    method: "prove",
    dockerImage: process.env.DOCKER_IMAGE,
    dockerSha256: undefined,
    minMemoryGb: 4,
    minCpuCores: 8,
    requiresTee: false,
    transaction,
  });

  transaction.setSender(keyPair.toSuiAddress());
  transaction.setGasBudget(100_000_000);

  const result = await executeTx({
    tx: transaction,
    keyPair,
  });

  if (!result) {
    throw new Error("Failed to update agent method");
  }

  const waitResult = await waitTx(result.digest);
  if (waitResult.errors) {
    console.log(`Errors for update tx ${result.digest}:`, waitResult.errors);
    throw new Error("Failed to update agent method");
  }

  console.log("Agent method updated successfully");
}
