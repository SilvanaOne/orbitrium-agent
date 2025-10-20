import { assert, Field, method, SmartContract, state, State } from 'o1js';
import { GameProof } from './GameProof.js';
import { GameState } from './GameState.js';

export class Game extends SmartContract {
  @state(Field) gameStateCommit = State<Field>();

  init() {
    super.init();

    const gameState = GameState.initial();

    this.gameStateCommit.set(gameState.getCommit());
  }

  @method async updateState(proof: GameProof) {
    proof.verify();

    const gameState = this.gameStateCommit.getAndRequireEquals();
    const proofState = proof.publicOutput.initialGameState.getCommit();

    assert(gameState.equals(proofState), 'Invalid initial state');

    const newGameState = proof.publicOutput.newGameState;

    this.gameStateCommit.set(newGameState.getCommit());
  }
}
