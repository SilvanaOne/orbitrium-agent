import { Poseidon, Struct, Signature, UInt64 } from 'o1js';

import { ResourceVector } from './ResourceVector.js';
import { allResources } from '../constants.js';

export class Upgrade extends Struct({
  resources: ResourceVector,
  resourcePerSecond: ResourceVector,
  storages: ResourceVector,
  clickPower: ResourceVector,
  adminSignature: Signature,
}) {
  getCommit() {
    return Poseidon.hash([
      this.resources.getCommit(),
      this.resourcePerSecond.getCommit(),
      this.storages.getCommit(),
      this.clickPower.getCommit(),
    ]);
  }

  static empty() {
    return new Upgrade({
      resources: ResourceVector.empty(),
      resourcePerSecond: ResourceVector.empty(),
      storages: ResourceVector.empty(),
      clickPower: ResourceVector.empty(),
      adminSignature: Signature.empty(),
    });
  }

  toString() {
    return `
    ${this.resources.toString()}
    ${this.resourcePerSecond.toString()}
    ${this.storages.toString()}
    ${this.clickPower.toString()}
    `;
  }

  toStringSparse() {
    let result = '';

    for (let i = 0; i < allResources.length; i++) {
      const resource = allResources[i];
      const resourceValue = this.resources.get(resource);
      const resourcePerSecondValue = this.resourcePerSecond.get(resource);
      const storagesValue = this.storages.get(resource);
      const clickPowerValue = this.clickPower.get(resource);

      if (!resourceValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}: ${resourceValue.toString()}  `;
      }
      if (!resourcePerSecondValue.equals(UInt64.from(0)).toBoolean()) {
        result += `${resource}PerSecond: ${resourcePerSecondValue.toString()}  `;
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
