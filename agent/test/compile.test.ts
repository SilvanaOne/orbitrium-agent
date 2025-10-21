import { describe, it } from "node:test";
import assert from "node:assert";
import { GameProgram } from "../src/circuit.js";
import { initBlockchain } from "@silvana-one/mina-utils";
import { compile } from "../src/compile.js";

describe("Game Rollup", async () => {
  it("should get ZkProgram constraints", async () => {
    // Analyze the constraint count for both methods
    const methods = await GameProgram.analyzeMethods();
    const clickMethodStats = (methods as any).click;
    const mergeMethodStats = (methods as any).merge;

    console.log(`\n=== CLICK METHOD ===`);
    console.log(`Click constraints: ${clickMethodStats.rows}`);
    console.log(`Gates breakdown:`);
    console.log(`  - Total gates: ${clickMethodStats.gates.length}`);

    const clickGateTypes = new Map<string, number>();
    for (const gate of clickMethodStats.gates) {
      const typ = gate?.typ || gate?.type || "Unknown";
      clickGateTypes.set(typ, (clickGateTypes.get(typ) || 0) + 1);
    }

    console.log(`  - Gate types breakdown:`);
    for (const [type, count] of clickGateTypes.entries()) {
      console.log(`    * ${type}: ${count}`);
    }
    console.log(`\n=== MULTIPLY METHOD ===`);
    console.log(`Merge constraints: ${mergeMethodStats.rows}`);
    console.log(`Gates breakdown:`);
    console.log(`  - Total gates: ${mergeMethodStats.gates.length}`);

    const mergeGateTypes = new Map<string, number>();
    for (const gate of mergeMethodStats.gates) {
      const typ = gate?.typ || gate?.type || "Unknown";
      mergeGateTypes.set(typ, (mergeGateTypes.get(typ) || 0) + 1);
    }

    console.log(`  - Gate types breakdown:`);
    for (const [type, count] of mergeGateTypes.entries()) {
      console.log(`    * ${type}: ${count}`);
    }
  });
  it("should compile", async () => {
    // Initialize blockchain connection
    await initBlockchain("devnet");
    const { vkProgram, vkContract } = await compile({ compileContract: true });
    assert.ok(vkProgram !== undefined, "vkProgram is not set");
    assert.ok(vkContract !== undefined, "vkContract is not set");
  });
});
