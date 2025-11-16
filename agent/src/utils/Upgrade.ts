import { Poseidon, Struct, Signature, UInt64 } from "o1js";

import { ResourceVector } from "./ResourceVector.js";
import { allResources } from "../constants.js";

export class Upgrade extends Struct({
  price: ResourceVector,
  rpsPrice: ResourceVector,
  target: ResourceVector,
  rps: ResourceVector,
  storages: ResourceVector,
  clickPower: ResourceVector,
  adminSignature: Signature,
}) {
  getCommit() {
    return Poseidon.hash([
      this.price.getCommit(),
      this.rpsPrice.getCommit(),
      this.target.getCommit(),
      this.rps.getCommit(),
      this.storages.getCommit(),
      this.clickPower.getCommit(),
    ]);
  }

  static empty() {
    return new Upgrade({
      price: ResourceVector.empty(),
      rpsPrice: ResourceVector.empty(),
      target: ResourceVector.empty(),
      rps: ResourceVector.empty(),
      storages: ResourceVector.empty(),
      clickPower: ResourceVector.empty(),
      adminSignature: Signature.empty(),
    });
  }

  toString() {
    return `
    Price: ${this.price.toString()}
    RPS Price: ${this.rpsPrice.toString()}
    Target: ${this.target.toString()}
    RPS: ${this.rps.toString()}
    Storages: ${this.storages.toString()}
    Click Power: ${this.clickPower.toString()}
    `;
  }

  toStringSparse() {
    let result = "";

    for (let i = 0; i < allResources.length; i++) {
      const resource = allResources[i];
      const priceValue = this.price.get(resource);
      const rpsPriceValue = this.rpsPrice.get(resource);
      const targetValue = this.target.get(resource);
      const rpsValue = this.rps.get(resource);
      const storagesValue = this.storages.get(resource);
      const clickPowerValue = this.clickPower.get(resource);

      if (!priceValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}Price: ${priceValue.toString()}  `;
      }
      if (!rpsPriceValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}RPSPrice: ${rpsPriceValue.toString()}  `;
      }
      if (!targetValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}Target: ${targetValue.toString()}  `;
      }
      if (!rpsValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}RPS: ${rpsValue.toString()}  `;
      }
      if (!storagesValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}Storage: ${storagesValue.toString()}  `;
      }
      if (!clickPowerValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}ClickPower: ${clickPowerValue.toString()}  `;
      }
    }

    return result;
  }
}
