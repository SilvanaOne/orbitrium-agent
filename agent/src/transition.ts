import { bcs } from "@mysten/sui/bcs";

/**
 * UpdateEvent struct matching the Move definition in game.move
 *
 * Move struct:
 * public struct UpdateEvent has copy, drop {
 *     game_id: ID,
 *     rule_id: u64,
 *     time_passed: vector<u64>,
 *     resources: vector<u64>,
 *     click_pow: vector<u64>,
 *     rps: vector<u64>,
 *     storages: vector<u64>,
 * }
 */

/**
 * TransitionData struct matching the Move definition in main.move
 *
 * Move struct:
 * public struct TransitionData has copy, drop {
 *     block_number: u64,
 *     sequence: u64,
 *     method: String,
 *     event: UpdateEvent,
 * }
 */

// ID type from Sui (32 bytes)
const ID = bcs.fixedArray(32, bcs.u8());

export const UpdateEventBcs = bcs.struct("UpdateEvent", {
  game_id: ID,
  rule_id: bcs.u64(),
  time_passed: bcs.vector(bcs.u64()),
  resources: bcs.vector(bcs.u64()),
  click_pow: bcs.vector(bcs.u64()),
  rps: bcs.vector(bcs.u64()),
  storages: bcs.vector(bcs.u64()),
});

export const TransitionDataBcs = bcs.struct("TransitionData", {
  block_number: bcs.u64(),
  sequence: bcs.u64(),
  method: bcs.string(),
  event: UpdateEventBcs,
});

/**
 * Raw UpdateEvent as returned by BCS deserialization
 */
export interface RawUpdateEvent {
  game_id: number[]; // ID as byte array
  rule_id: string; // BCS returns u64 as string
  time_passed: string[]; // BCS returns vector<u64> as string[]
  resources: string[]; // BCS returns vector<u64> as string[]
  click_pow: string[]; // BCS returns vector<u64> as string[]
  rps: string[]; // BCS returns vector<u64> as string[]
  storages: string[]; // BCS returns vector<u64> as string[]
}

/**
 * Raw TransitionData as returned by BCS deserialization
 */
export interface RawTransitionData {
  block_number: string; // BCS returns u64 as string
  sequence: string; // BCS returns u64 as string
  method: string;
  event: RawUpdateEvent;
}

/**
 * Processed UpdateEvent with converted types
 */
export interface UpdateEvent {
  game_id: Uint8Array; // ID as Uint8Array
  rule_id: bigint; // u64 as bigint for numeric operations
  time_passed: bigint[]; // vector<u64> as bigint[]
  resources: bigint[]; // vector<u64> as bigint[]
  click_pow: bigint[]; // vector<u64> as bigint[]
  rps: bigint[]; // vector<u64> as bigint[]
  storages: bigint[]; // vector<u64> as bigint[]
}

/**
 * Processed TransitionData with converted types
 */
export interface TransitionData {
  block_number: bigint; // u64 as bigint for numeric operations
  sequence: bigint; // u64 as bigint for numeric operations
  method: string;
  event: UpdateEvent;
}

/**
 * Convert game ID byte array to Uint8Array
 * @param bytes - Byte array representing ID
 * @returns Uint8Array representation
 */
export function gameIdToUint8Array(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes);
}

/**
 * Convert Uint8Array back to game ID byte array
 * @param value - Uint8Array representation
 * @returns 32-byte array for BCS compatibility
 */
export function uint8ArrayToGameId(value: Uint8Array): number[] {
  return Array.from(value);
}

/**
 * Deserializes raw TransitionData from BCS bytes
 * @param data - The BCS serialized data as byte array or Uint8Array
 * @returns Raw TransitionData object (with number[] commitments)
 */
export function deserializeRawTransitionData(
  data: number[] | Uint8Array
): RawTransitionData {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  return TransitionDataBcs.parse(bytes);
}

/**
 * Deserializes TransitionData from BCS bytes and converts types
 * @param data - The BCS serialized data as byte array or Uint8Array
 * @returns Processed TransitionData object with converted types
 */
export function deserializeTransitionData(
  data: number[] | Uint8Array
): TransitionData {
  const rawTransitionData = deserializeRawTransitionData(data);

  return {
    block_number: BigInt(rawTransitionData.block_number),
    sequence: BigInt(rawTransitionData.sequence),
    method: rawTransitionData.method,
    event: {
      game_id: gameIdToUint8Array(rawTransitionData.event.game_id),
      rule_id: BigInt(rawTransitionData.event.rule_id),
      time_passed: rawTransitionData.event.time_passed.map(BigInt),
      resources: rawTransitionData.event.resources.map(BigInt),
      click_pow: rawTransitionData.event.click_pow.map(BigInt),
      rps: rawTransitionData.event.rps.map(BigInt),
      storages: rawTransitionData.event.storages.map(BigInt),
    },
  };
}

/**
 * Serializes TransitionData to BCS bytes
 * @param transitionData - The TransitionData object to serialize
 * @returns BCS serialized bytes
 */
export function serializeTransitionData(
  transitionData: TransitionData
): Uint8Array {
  // Convert back to raw format for serialization
  const rawTransitionData: RawTransitionData = {
    block_number: transitionData.block_number.toString(),
    sequence: transitionData.sequence.toString(),
    method: transitionData.method,
    event: {
      game_id: uint8ArrayToGameId(transitionData.event.game_id),
      rule_id: transitionData.event.rule_id.toString(),
      time_passed: transitionData.event.time_passed.map((v) => v.toString()),
      resources: transitionData.event.resources.map((v) => v.toString()),
      click_pow: transitionData.event.click_pow.map((v) => v.toString()),
      rps: transitionData.event.rps.map((v) => v.toString()),
      storages: transitionData.event.storages.map((v) => v.toString()),
    },
  };

  return TransitionDataBcs.serialize(rawTransitionData).toBytes();
}

/**
 * Helper function to convert game ID to hex string
 * @param gameId - Uint8Array representing game ID
 * @returns Hex string representation
 */
export function gameIdToHex(gameId: Uint8Array): string {
  return "0x" + Array.from(gameId).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Helper function to convert hex string to game ID
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Uint8Array game ID
 */
export function hexToGameId(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleanHex.length !== 64) {
    throw new Error("Game ID hex must be 64 characters (32 bytes)");
  }

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
