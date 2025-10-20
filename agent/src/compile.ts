import { Cache, VerificationKey } from "o1js";
import { GameContract } from "./contract.js";
import { GameProgram } from "./circuit.js";

let vkProgram: VerificationKey | undefined = undefined;
let vkContract: VerificationKey | undefined = undefined;

export async function compile(params?: { compileContract: boolean }): Promise<{
  vkProgram: VerificationKey;
  vkContract: VerificationKey | undefined;
}> {
  const cache = Cache.FileSystem("./cache");

  // Ensure the circuit is compiled
  if (vkProgram === undefined) {
    console.log("📦 Compiling circuit...");

    console.time("compiled GameProgram");
    vkProgram = (await GameProgram.compile({ cache })).verificationKey;
    console.timeEnd("compiled GameProgram");
    console.log("vk GameProgram", vkProgram.hash.toJSON());
  }

  // Compile the contract
  if (params?.compileContract === true && vkContract === undefined) {
    console.log("📦 Compiling contract...");
    console.time("compiled GameContract");
    vkContract = (await GameContract.compile({ cache })).verificationKey;
    console.timeEnd("compiled GameContract");
    console.log("vk GameContract", vkContract.hash.toJSON());
  }

  return { vkProgram, vkContract };
}
