import { assert, Field, Int64, Poseidon, Struct } from "o1js";
import { ResourceVector } from "./utils/ResourceVector.js";

export class GameState extends Struct({
  resources: ResourceVector,
  storages: ResourceVector,
  resourcesPerSecond: ResourceVector,
  clickPower: ResourceVector,
  lastClaimTime: ResourceVector,
}) {
  /*
   * Get initial game state - all zeroes except for the click power of first resource
   * @returns Initial game state
   */
  static initial() {
    let resources = ResourceVector.empty();
    let storages = ResourceVector.empty();
    let resourcesPerSecond = ResourceVector.empty();
    let clickPower = ResourceVector.empty();
    let lastClaimTime = ResourceVector.empty();
    clickPower.resources[0] = Int64.from(1);

    return new GameState({
      resources,
      storages,
      resourcesPerSecond,
      clickPower,
      lastClaimTime,
    });
  }

  /*
   * Get commit of the game state as hash of all fields
   * @returns Commit of the game state
   */
  getCommit() {
    let fields = [
      ...this.resources.resources.flatMap((v) => v.toFields()),
      ...this.storages.resources.flatMap((v) => v.toFields()),
      ...this.resourcesPerSecond.resources.flatMap((v) => v.toFields()),
      ...this.clickPower.resources.flatMap((v) => v.toFields()),
      ...this.lastClaimTime.resources.flatMap((v) => v.toFields()),
    ];
    return Poseidon.hash(fields);
  }

  equals(other: GameState) {
    return this.resources
      .equals(other.resources)
      .and(this.storages.equals(other.storages))
      .and(this.resourcesPerSecond.equals(other.resourcesPerSecond))
      .and(this.clickPower.equals(other.clickPower))
      .and(this.lastClaimTime.equals(other.lastClaimTime));
  }

  serialize() {
    return JSON.stringify({
      resources: this.resources.toString(),
      storages: this.storages.toString(),
      resourcesPerSecond: this.resourcesPerSecond.toString(),
      clickPower: this.clickPower.toString(),
      lastClaimTime: this.lastClaimTime.toString(),
    });
  }

  static deserialize(str: string) {
    const {
      resources,
      storages,
      resourcesPerSecond,
      clickPower,
      lastClaimTime,
    } = JSON.parse(str);
    return new GameState({
      resources: ResourceVector.fromString(resources),
      storages: ResourceVector.fromString(storages),
      resourcesPerSecond: ResourceVector.fromString(resourcesPerSecond),
      clickPower: ResourceVector.fromString(clickPower),
      lastClaimTime: ResourceVector.fromString(lastClaimTime),
    });
  }
}
