import { assert, Poseidon, Provable, Int64, Struct, Bool } from "o1js";

import { RESOURCE_COUNT, resourcesToId } from "../constants.js";
import { Resource } from "../lib/types.js";

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

  static singleValue(value: Int64, position: number) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    result[position] = value;
    return new ResourceVector({ resources: result });
  }

  equals(other: ResourceVector) {
    let result = Bool(true);
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      result = result.and(this.resources[i].equals(other.resources[i]));
    }
    return result;
  }

  static assertEquals(a: ResourceVector, b: ResourceVector) {
    a.equals(b).assertTrue("Resource vectors are not equal");
  }

  add(other: ResourceVector, overflowCheck: boolean = true) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))] as Int64[];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      let curValue = this.resources[i].add(other.resources[i]);
      if (overflowCheck) {
        assert(curValue.isNonNegative(), "Resource overflow");
      }
      result[i] = curValue;
    }

    return new ResourceVector({ resources: result });
  }

  sub(other: ResourceVector) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))] as Int64[];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      assert(
        this.resources[i].sub(other.resources[i]).isNonNegative(),
        "Resource underflow"
      );
      result[i] = this.resources[i].sub(other.resources[i]);
    }

    return new ResourceVector({ resources: result });
  }

  mul(other: Int64) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      result[i] = this.resources[i].mul(other);
    }

    return new ResourceVector({ resources: result });
  }

  vectorMul(other: ResourceVector) {
    const result = [...Array(RESOURCE_COUNT).fill(Int64.from(0))];
    for (let i = 0; i < RESOURCE_COUNT; i++) {
      result[i] = this.resources[i].mul(other.resources[i]);
    }

    return new ResourceVector({ resources: result });
  }

  limit(storage: ResourceVector) {
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

  get(resource: Resource) {
    return this.resources[resourcesToId[resource]];
  }

  toString() {
    return this.resources.map((r) => r.toString()).join(", ");
  }

  static fromString(str: string) {
    const resources = str.split(", ").map((r) => Int64.from(r));
    return new ResourceVector({ resources });
  }

  static fromBigIntArray(arr: bigint[]) {
    return new ResourceVector({ resources: arr.map((r) => Int64.from(r)) });
  }

  toBigIntArray() {
    return this.resources.map((r) => r.toBigint());
  }
}
