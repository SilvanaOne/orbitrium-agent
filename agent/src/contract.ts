import {
  Field,
  AccountUpdate,
  UInt64,
  PublicKey,
  state,
  State,
  SmartContract,
  method,
  Bool,
  DeployArgs,
  Permissions,
} from "o1js";
import { GameProgramState, GameProgramProof } from "./circuit.js";
import { GameState } from "./GameState.js";

const initialState = GameProgramState.create().gameState;

interface GameContractDeployProps extends Exclude<DeployArgs, undefined> {
  admin: PublicKey;
  uri: string;
}

export class GameContract extends SmartContract {
  @state(PublicKey) admin = State<PublicKey>();
  @state(UInt64) sequence = State<UInt64>(UInt64.from(0));
  @state(UInt64) blockNumber = State<UInt64>(UInt64.from(0));
  @state(Field) gameStateCommit = State<Field>(Field(0));

  /**
   * Deploys the contract with initial settings.
   * @param props - Deployment properties including admin and uri.
   */
  async deploy(props: GameContractDeployProps) {
    await super.deploy(props);
    this.admin.set(props.admin);
    this.gameStateCommit.set(initialState.getCommit());

    this.account.zkappUri.set(props.uri);
    this.account.permissions.set({
      ...Permissions.default(),
      // Allow the upgrade authority to set the verification key
      // even when there is no protocol upgrade
      setVerificationKey:
        Permissions.VerificationKey.proofDuringCurrentVersion(),
      setPermissions: Permissions.impossible(),
      access: Permissions.proof(),
      send: Permissions.proof(),
      setZkappUri: Permissions.proof(),
      setTokenSymbol: Permissions.proof(),
    });
  }

  events = {
    settle: GameProgramState,
  };

  @method async settle(proof: GameProgramProof) {
    // verify the proof
    proof.verify();
    proof.publicInput.blockNumber.assertEquals(proof.publicOutput.blockNumber);

    // verify the sender is the admin
    const sender = this.sender.getUnconstrained();
    const senderUpdate = AccountUpdate.createSigned(sender);
    senderUpdate.body.useFullCommitment = Bool(true);
    this.admin.requireEquals(sender);

    // Verify the proof input matches current contract state
    this.blockNumber.requireEquals(
      proof.publicInput.blockNumber.sub(UInt64.from(1))
    );
    this.sequence.requireEquals(proof.publicInput.sequence);
    this.gameStateCommit.requireEquals(proof.publicInput.gameState.getCommit());

    // Update contract state with proof output
    this.sequence.set(proof.publicOutput.sequence);
    this.gameStateCommit.set(proof.publicOutput.gameState.getCommit());
    this.blockNumber.set(proof.publicOutput.blockNumber);

    this.emitEvent("settle", proof.publicOutput);
  }
}
