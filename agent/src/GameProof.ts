import {
  Field,
  Int64,
  PrivateKey,
  SelfProof,
  Signature,
  Struct,
  ZkProgram,
} from 'o1js';
import { ResourceVector } from './utils/ResourceVector.js';
import { GameState } from './GameState.js';
import { Upgrade } from './utils/Upgrade.js';

export class GameProofPublicInput extends Struct({
  gameState: GameState,
}) {}

export class GameProofPublicOutput extends Struct({
  initialGameState: GameState,
  newGameState: GameState,
  orbsAmount: Int64,
}) {}

// if (!process.env.ADMIN_PRIVATE_KEY) {
//   throw new Error('ADMIN_PRIVATE_KEY is not set');
// }
// const ADMIN_KEY = PrivateKey.fromBase58(process.env.ADMIN_PRIVATE_KEY);
// const ADMIN_ADDRESS = ADMIN_KEY.toPublicKey();

/*
 * Method for proof of click
 * @param input - Game state before click
 * @param rule - Rule with all zeroes except for the resource that is clicked
 * @param ruleSignature - Admin signature of the rule
 * @param timePassed - Vector with all zeroes except for the clicked resources, that contains value of passed time
 */
const clickMethod = (
  input: GameProofPublicInput,
  rule: ResourceVector,
  ruleSignature: Signature,
  timePassed: ResourceVector
): GameProofPublicOutput => {
  const gameState = input.gameState;
  // ruleSignature.verify(ADMIN_ADDRESS, [rule.getCommit()]).assertTrue();

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

  return new GameProofPublicOutput({
    initialGameState: gameState,
    newGameState: newGameState,
    orbsAmount: newResources.resources[21],
  });
};

/*
 * Method for proof of upgrade
 * @param input - Game state before upgrade
 * @param upgrade - Upgrade
 *  * resources - Vector of resources that is spent. Should be vector with negative values
 * resourcePerSecond - Vector of resources that is added to resources per second. Should be vector with positive or negative values
 * storages - Vector of storages that is added to storages. Should be vector with positive values
 * clickPower - Vector of click power that is added to click power. Should be vector with positive values
 * adminSignature - Signature of this upgrade by admin
 */
const upgradeMethod = (
  input: GameProofPublicInput,
  upgrade: Upgrade
): GameProofPublicOutput => {
  const gameState = input.gameState;

  // Validate upgrade
  // upgrade.adminSignature
  //   .verify(ADMIN_ADDRESS, [upgrade.getCommit()])
  //   .assertTrue();

  const newGameState = new GameState({
    resources: gameState.resources.add(upgrade.resources),
    storages: gameState.storages.add(upgrade.storages),
    resourcesPerSecond: gameState.resourcesPerSecond.add(
      upgrade.resourcePerSecond
    ),
    clickPower: gameState.clickPower.add(upgrade.clickPower),
    lastClaimTime: gameState.lastClaimTime,
  });

  return new GameProofPublicOutput({
    initialGameState: gameState,
    newGameState: newGameState,
    orbsAmount: newGameState.resources.resources[21],
  });
};

export const GameProofProgram = ZkProgram({
  name: 'game-proof-program',
  publicInput: GameProofPublicInput,
  publicOutput: GameProofPublicOutput,
  methods: {
    click: {
      privateInputs: [ResourceVector, Signature, ResourceVector],
      async method(
        input: GameProofPublicInput,
        rule: ResourceVector,
        ruleSignature: Signature,
        timePassed: ResourceVector
      ) {
        return {
          publicOutput: clickMethod(input, rule, ruleSignature, timePassed),
        };
      },
    },
    upgrade: {
      privateInputs: [Upgrade],
      async method(input: GameProofPublicInput, upgrade: Upgrade) {
        return {
          publicOutput: upgradeMethod(input, upgrade),
        };
      },
    },
    merge: {
      privateInputs: [SelfProof, SelfProof],
      async method(
        input: GameProofPublicInput,
        prevProof: SelfProof<GameProofPublicInput, GameProofPublicOutput>,
        newProof: SelfProof<GameProofPublicInput, GameProofPublicOutput>
      ) {
        newProof.verify();
        prevProof.verify();
        prevProof.publicOutput.newGameState
          .equals(newProof.publicInput.gameState)
          .assertTrue();
        return {
          publicOutput: new GameProofPublicOutput({
            initialGameState: prevProof.publicOutput.initialGameState,
            newGameState: newProof.publicOutput.newGameState,
            orbsAmount: newProof.publicOutput.orbsAmount,
          }),
        };
      },
    },
  },
});

export class GameProof extends ZkProgram.Proof(GameProofProgram) {}
