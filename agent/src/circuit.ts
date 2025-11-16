import {
  ZkProgram,
  Field,
  Struct,
  SelfProof,
  UInt64,
  Signature,
  Int64,
} from "o1js";
import { GameState } from "./GameState.js";
import { ResourceVector } from "./utils/ResourceVector.js";
import { Upgrade } from "./utils/Upgrade.js";

export class GameProgramState extends Struct({
  blockNumber: UInt64,
  sequence: UInt64,
  gameState: GameState,
}) {
  static assertEquals(a: GameProgramState, b: GameProgramState) {
    a.blockNumber.assertEquals(b.blockNumber);
    a.sequence.assertEquals(b.sequence);
    a.gameState.equals(b.gameState);
  }

  serialize(): string {
    return JSON.stringify({
      blockNumber: this.blockNumber.toBigInt().toString(),
      sequence: this.sequence.toBigInt().toString(),
      gameState: this.gameState.serialize(),
    });
  }

  static deserialize(str: string): GameProgramState {
    const { blockNumber, sequence, gameState } = JSON.parse(str);
    return new GameProgramState({
      blockNumber: UInt64.from(BigInt(blockNumber)),
      sequence: UInt64.from(BigInt(sequence)),
      gameState: GameState.deserialize(gameState),
    });
  }

  static create(): GameProgramState {
    return new GameProgramState({
      blockNumber: UInt64.from(0),
      sequence: UInt64.from(0),
      gameState: GameState.initial(),
    });
  }
}

const clickMethod = (
  gameState: GameState,
  targetMagnitude: ResourceVector,
  priceMagnitude: ResourceVector,
  amount: Int64,
  elapsed: ResourceVector
): GameState => {
  const DECIMALS = Int64.from(10 ** 6);

  // Calculate targeted click power: (click_pow * target) / DECIMALS
  const clickPowerTargeted = gameState.clickPower
    .vectorMul(targetMagnitude)
    .div(DECIMALS);

  // Calculate click power with amount: click_power_targeted * amount
  const clickPowerWithAmount = clickPowerTargeted.mul(amount);

  // Calculate price: (priceMagnitude * click_power_with_amount) / DECIMALS
  const price = priceMagnitude.vectorMul(clickPowerWithAmount).div(DECIMALS);

  // Calculate elapsed targeted: (elapsed * target) / DECIMALS
  const elapsedTargeted = elapsed.vectorMul(targetMagnitude).div(DECIMALS);

  // Convert to seconds: elapsed_targeted / 1000
  const elapsedSecsTargeted = elapsedTargeted.div(Int64.from(1000));

  // Calculate generated resources: rps * elapsed_secs_targeted
  const generated = gameState.resourcesPerSecond.vectorMul(elapsedSecsTargeted);

  // Limit generated resources by storage
  const limited = generated.limit(gameState.storages);

  // Calculate increment: limited + click_power_with_amount
  const increment = limited.add(clickPowerWithAmount);

  // Calculate total with income: resources + increment
  const totalWithIncome = gameState.resources.add(increment);

  // Check if we have enough resources: total_with_income >= price
  totalWithIncome.ge(price).assertTrue();

  // Calculate new total: total_with_income - price
  const newTotal = totalWithIncome.sub(price);

  // Update last claim time: last_claim_time + elapsed_targeted
  const newLastClaimTime = gameState.lastClaimTime.add(elapsedTargeted);

  const newGameState = new GameState({
    resources: newTotal,
    storages: gameState.storages,
    resourcesPerSecond: gameState.resourcesPerSecond,
    clickPower: gameState.clickPower,
    lastClaimTime: newLastClaimTime,
  });

  return newGameState;
};

const upgradeMethod = (gameState: GameState, upgrade: Upgrade): GameState => {
  // Validate upgrade
  // upgrade.adminSignature
  //   .verify(ADMIN_ADDRESS, [upgrade.getCommit()])
  //   .assertTrue();

  // Update resources: resources = resources + target - price
  let newResources = gameState.resources.add(upgrade.target);
  newResources = newResources.sub(upgrade.price);

  // Update rps: rps = rps + rps - rpsPrice
  let newRps = gameState.resourcesPerSecond.add(upgrade.rps);
  newRps = newRps.sub(upgrade.rpsPrice);

  // Update storages: storages = storages + storages
  const newStorages = gameState.storages.add(upgrade.storages);

  // Update click power: click_pow = click_pow + clickPow
  const newClickPower = gameState.clickPower.add(upgrade.clickPower);

  const newGameState = new GameState({
    resources: newResources,
    storages: newStorages,
    resourcesPerSecond: newRps,
    clickPower: newClickPower,
    lastClaimTime: gameState.lastClaimTime,
  });

  return newGameState;
};

export const GameProgram = ZkProgram({
  name: "GameProgram",
  publicInput: GameProgramState,
  publicOutput: GameProgramState,
  methods: {
    click: {
      privateInputs: [ResourceVector, ResourceVector, Int64, ResourceVector],
      async method(
        input: GameProgramState,
        targetMagnitude: ResourceVector,
        priceMagnitude: ResourceVector,
        amount: Int64,
        elapsed: ResourceVector
      ) {
        const newGameState = clickMethod(
          input.gameState,
          targetMagnitude,
          priceMagnitude,
          amount,
          elapsed
        );
        return {
          publicOutput: new GameProgramState({
            blockNumber: input.blockNumber,
            sequence: input.sequence.add(1),
            gameState: newGameState,
          }),
        };
      },
    },

    upgrade: {
      privateInputs: [Upgrade, Signature],
      async method(
        input: GameProgramState,
        upgrade: Upgrade,
        ruleSignature: Signature
      ) {
        const newGameState = upgradeMethod(input.gameState, upgrade);
        return {
          publicOutput: new GameProgramState({
            blockNumber: input.blockNumber,
            sequence: input.sequence.add(1),
            gameState: newGameState,
          }),
        };
      },
    },

    merge: {
      privateInputs: [SelfProof, SelfProof],
      async method(
        input: GameProgramState,
        proof1: SelfProof<GameProgramState, GameProgramState>,
        proof2: SelfProof<GameProgramState, GameProgramState>
      ) {
        proof1.verify();
        proof2.verify();
        GameProgramState.assertEquals(input, proof1.publicInput);
        GameProgramState.assertEquals(proof1.publicOutput, proof2.publicInput);
        return {
          publicOutput: proof2.publicOutput,
        };
      },
    },
  },
});

export class GameProgramProof extends ZkProgram.Proof(GameProgram) {}
