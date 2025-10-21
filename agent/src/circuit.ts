import { ZkProgram, Field, Struct, SelfProof, UInt64, Signature } from "o1js";
import { GameState } from "./GameState.js";
import { ResourceVector } from "./utils/ResourceVector.js";

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
  rule: ResourceVector,
  timePassed: ResourceVector
): GameState => {
  const generatedResources = gameState.resourcesPerSecond.vectorMul(timePassed);
  const limitedResources = generatedResources.limit(gameState.storages);

  const clickedResources = gameState.clickPower.vectorMul(rule);

  const newResources = gameState.resources
    .add(limitedResources)
    .add(clickedResources);

  const newLastClaimTime = gameState.lastClaimTime.add(timePassed);

  const newGameState = new GameState({
    resources: newResources,
    storages: gameState.storages,
    resourcesPerSecond: gameState.resourcesPerSecond,
    clickPower: gameState.clickPower,
    lastClaimTime: newLastClaimTime,
  });

  return newGameState;
};

export const GameProgram = ZkProgram({
  name: "GameProgram",
  publicInput: GameProgramState,
  publicOutput: GameProgramState,
  methods: {
    click: {
      privateInputs: [ResourceVector, ResourceVector],
      async method(
        input: GameProgramState,
        rule: ResourceVector,
        timePassed: ResourceVector
      ) {
        const newGameState = clickMethod(input.gameState, rule, timePassed);
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
