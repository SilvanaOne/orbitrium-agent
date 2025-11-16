import { describe, it } from "node:test";
import assert from "node:assert";
import {
  deserializeTransitionData,
  TransitionData,
  gameIdToHex,
  ClickEvent,
} from "../src/transition.js";

describe("TransitionData Deserialization", () => {
  it("should deserialize TransitionData with UpdateEvent from JobCreatedEvent data", () => {
    // Mock data for orbitrium click operation with UpdateEvent
    // TransitionData: block_number=1, sequence=0, method="click", event=UpdateEvent{...}
    // UpdateEvent: game_id (32 bytes), rule_id=1, vectors with sample data
    const jobCreatedEventData = [
      // block_number (u64) = 1
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // sequence (u64) = 0
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // method (String) = "click" (5 bytes + length prefix)
      5,
      99,
      108,
      105,
      99,
      107,
      // event (UpdateEvent):
      // game_id (32 bytes) - mock ID
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      // rule_id (u64) = 1
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // time_passed (vector<u64>) - length=2, values=[100, 200]
      2,
      100,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      200,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // resources (vector<u64>) - length=2, values=[1000, 2000]
      2,
      1000 & 0xff,
      (1000 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
      2000 & 0xff,
      (2000 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
      // click_pow (vector<u64>) - length=2, values=[50, 75]
      2,
      50,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      75,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // rps (vector<u64>) - length=2, values=[10, 20]
      2,
      10,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // storages (vector<u64>) - length=2, values=[500, 600]
      2,
      500 & 0xff,
      (500 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
      600 & 0xff,
      (600 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
    ];

    const transitionData: TransitionData =
      deserializeTransitionData(jobCreatedEventData);

    // Basic assertions
    assert.strictEqual(
      transitionData.block_number,
      1n,
      "Block number should be 1"
    );
    assert.strictEqual(transitionData.sequence, 0n, "Sequence should be 0");
    assert.strictEqual(
      transitionData.method,
      "click",
      "Method should be click"
    );

    // UpdateEvent assertions
    assert.ok(transitionData.event !== undefined, "Event should exist");
    assert.ok(
      transitionData.event.game_id instanceof Uint8Array,
      "Game ID should be Uint8Array"
    );
    assert.strictEqual(
      transitionData.event.game_id.length,
      32,
      "Game ID should be 32 bytes"
    );
    assert.strictEqual(transitionData.event.rule_id, 1n, "Rule ID should be 1");

    // Vector field assertions
    assert.ok(
      Array.isArray((transitionData.event as ClickEvent).time_passed),
      "time_passed should be array"
    );
    assert.strictEqual(
      (transitionData.event as ClickEvent).time_passed.length,
      2,
      "time_passed should have 2 elements"
    );
    assert.strictEqual(
      (transitionData.event as ClickEvent).time_passed[0],
      100n,
      "time_passed[0] should be 100"
    );
    assert.strictEqual(
      (transitionData.event as ClickEvent).time_passed[1],
      200n,
      "time_passed[1] should be 200"
    );
  });

  it("should have correct field types and structure", () => {
    // Same mock data as first test
    const jobCreatedEventData = [
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      5,
      99,
      108,
      105,
      99,
      107,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      0x12,
      0x34,
      0x56,
      0x78,
      0x9a,
      0xbc,
      0xde,
      0xf0,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      100,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      200,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      1000 & 0xff,
      (1000 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
      2000 & 0xff,
      (2000 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      50,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      75,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      10,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      20,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      2,
      500 & 0xff,
      (500 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
      600 & 0xff,
      (600 >> 8) & 0xff,
      0,
      0,
      0,
      0,
      0,
      0,
    ];

    const transitionData: TransitionData =
      deserializeTransitionData(jobCreatedEventData);

    // Verify top-level fields are present and have expected types
    assert.ok(
      typeof transitionData.block_number === "bigint",
      "Block number should be bigint"
    );
    assert.ok(
      typeof transitionData.sequence === "bigint",
      "Sequence should be bigint"
    );
    assert.ok(
      typeof transitionData.method === "string",
      "Method should be string"
    );

    // Verify event structure exists and has correct types
    assert.ok(transitionData.event !== undefined, "Event should exist");
    assert.ok(
      transitionData.event.game_id instanceof Uint8Array,
      "Game ID should be Uint8Array"
    );
    assert.ok(
      typeof transitionData.event.rule_id === "bigint",
      "Rule ID should be bigint"
    );
    assert.ok(
      Array.isArray((transitionData.event as ClickEvent).time_passed),
      "time_passed should be array"
    );

    // Verify array elements are bigints
    (transitionData.event as ClickEvent).time_passed.forEach((val, idx) => {
      assert.ok(
        typeof val === "bigint",
        `time_passed[${idx}] should be bigint`
      );
    });

    // Verify exact values match expected
    assert.strictEqual(
      transitionData.block_number,
      1n,
      "Block number should be 1n"
    );
    assert.strictEqual(transitionData.sequence, 0n, "Sequence should be 0n");
    assert.strictEqual(
      transitionData.method,
      "click",
      "Method should be click"
    );
  });

  it("should handle gameIdToHex helper function", () => {
    const mockGameId = new Uint8Array([
      0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78,
      0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
      0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
    ]);

    const hexString = gameIdToHex(mockGameId);
    assert.ok(hexString.startsWith("0x"), "Hex string should start with 0x");
    assert.strictEqual(
      hexString.length,
      66,
      "Hex string should be 66 characters (0x + 64 hex chars)"
    );
    assert.strictEqual(
      hexString,
      "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
      "Hex conversion should match expected value"
    );
  });
});
