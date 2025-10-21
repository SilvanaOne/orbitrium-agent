import { assert, Poseidon, Provable, Int64, Struct, Bool } from "o1js";
import { RESOURCE_COUNT, resourcesToId } from "./constants.js";
/*
 * Vector of resources
 */
export class ResourceVector extends Struct({
  resources: Provable.Array(Int64, RESOURCE_COUNT),
}) {
  static empty() {
    return new ResourceVector({
      resources: [...Array(RESOURCE_COUNT).fill(Int64.from(0))],
    });
  }
  static singleValue(value, position) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    result[position] = value;
    return new ResourceVector({ resources: result });
  }
  equals(other) {
    let result = Bool(true);
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      result = result.and(this.resources[i].equals(other.resources[i]));
    }
    return result;
  }
  add(other, overflowCheck = true) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      let curValue = this.resources[i].add(other.resources[i]);
      if (overflowCheck) {
        assert(curValue.isNonNegative(), "Resource overflow");
      }
      result[i] = curValue;
    }
    return new ResourceVector({ resources: result });
  }
  sub(other) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      assert(
        this.resources[i].sub(other.resources[i]).isNonNegative(),
        "Resource underflow"
      );
      result[i] = this.resources[i].sub(other.resources[i]);
    }
    return new ResourceVector({ resources: result });
  }
  mul(other) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      result[i] = this.resources[i].mul(other);
    }
    return new ResourceVector({ resources: result });
  }
  vectorMul(other) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      result[i] = this.resources[i].mul(other.resources[i]);
    }
    return new ResourceVector({ resources: result });
  }
  limit(storage) {
    let result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      result[i] = Provable.if(
        this.resources[i].sub(storage.resources[i]).isNonNegative(),
        storage.resources[i],
        this.resources[i]
      );
    }
    return new ResourceVector({ resources: result });
  }
  getCommit() {
    return Poseidon.hash(this.resources.flatMap((r) => r.toFields())); // Is it ok?
  }
  static emptyCommit() {
    const emptyArray = new ResourceVector({
      resources: [...Array(RESOURCE_COUNT).fill(Int64.from(0))],
    });
    return emptyArray.getCommit();
  }
  // static initial() {
  //   let resources = ResourceVector.empty();
  //   let storages = ResourceVector.empty();
  //   let resourcesPerSecond = ResourceVector.empty();
  //   let clickPower = ResourceVector.empty();
  //   let lastClaimTime = ResourceVector.empty();
  //   clickPower.resources[0] = Int64.from(1);
  //   return {
  //     resources,
  //     storages,
  //     resourcesPerSecond,
  //     clickPower,
  //     lastClaimTime,
  //   };
  // }
  get(resource) {
    return this.resources[resourcesToId[resource]];
  }
  toString() {
    return this.resources.map((r) => r.toString()).join(", ");
  }
}
//# sourceMappingURL=ResourceVector.js.map
