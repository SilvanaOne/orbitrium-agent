import { Int64, PrivateKey, Signature } from "o1js";
import { Upgrade } from "../utils/Upgrade.js";
import { allResources, DECIMALS, resourcesToId } from "../constants.js";
import { Resource } from "../lib/types.js";

/// Upgrades.add(new Upgrade().wood(-5).woodPerSecond(10).woodStorage(100).woodClickPower(10))

type BuilderAPI<T> = {
  [R in Resource]: (amount: number) => T;
} & {
  [R in Resource as `${R}GoldPrice`]: (amount: number) => T;
} & {
  [R in Resource as `${R}PerSecond`]: (amount: number) => T;
} & {
  [R in Resource as `${R}Storage`]: (amount: number) => T;
} & {
  [R in Resource as `${R}ClickPower`]: (amount: number) => T;
} & {
  build: () => Upgrade;
};

export type UpgradeType = "click" | "idle" | "storage" | "unlock" | "crafting";

export type ResourceDiff = { resource: Resource; diff: number };

export class U {
  upgrade: Upgrade;

  id: number;
  type: UpgradeType;
  level: number;
  target: Resource;
  minaSignature: Signature;
  suiSignature: number[];

  constructor(id: number, type: UpgradeType, level: number, target: Resource) {
    this.upgrade = Upgrade.empty();
    this.id = id;
    this.type = type;
    this.level = level;
    this.target = target;

    // TODO: Generate signatures
    this.minaSignature = Signature.empty();
    this.suiSignature = [];
  }

  [k: string]: any;

  build() {
    return this.upgrade;
  }

  getResourceInfo(): Record<string, ResourceDiff[]> {
    let res: Record<string, ResourceDiff[]> = {
      amount: [],
      clickPower: [],
      idle: [],
      storage: [],
    };

    // Price (cost, shown as negative)
    for (let i = 0; i < allResources.length; i++) {
      let resource = allResources[i];
      let diff = +this.upgrade.price.resources[i];

      if (diff !== 0) {
        res["amount"].push({ resource, diff: -diff / 10 ** DECIMALS });
      }
    }

    // Target (gain, shown as positive)
    for (let i = 0; i < allResources.length; i++) {
      let resource = allResources[i];
      let diff = +this.upgrade.target.resources[i];

      if (diff !== 0) {
        res["amount"].push({ resource, diff: diff / 10 ** DECIMALS });
      }
    }

    for (let i = 0; i < allResources.length; i++) {
      let resource = allResources[i];
      let diff = +this.upgrade.clickPower.resources[i];

      if (diff !== 0) {
        res["clickPower"].push({ resource, diff: diff / 10 ** DECIMALS });
      }
    }

    // RPS (gain)
    for (let i = 0; i < allResources.length; i++) {
      let resource = allResources[i];
      let diff = +this.upgrade.rps.resources[i];

      if (diff !== 0) {
        res["idle"].push({ resource, diff: diff / 10 ** DECIMALS });
      }
    }

    // RPS Price (cost, shown as negative)
    for (let i = 0; i < allResources.length; i++) {
      let resource = allResources[i];
      let diff = +this.upgrade.rpsPrice.resources[i];

      if (diff !== 0) {
        res["idle"].push({ resource, diff: -diff / 10 ** DECIMALS });
      }
    }

    for (let i = 0; i < allResources.length; i++) {
      let resource = allResources[i];
      let diff = +this.upgrade.storages.resources[i];

      if (diff !== 0) {
        res["storage"].push({ resource, diff: diff / 10 ** DECIMALS });
      }
    }

    return res;
  }
}

function attachResourceMethods(proto: any) {
  const make = (prop: keyof Upgrade, suffix: string) => (res: Resource) => {
    const fnName = `${res}${suffix}` as const;

    proto[fnName] = function (amount: number) {
      const prevValue = +(this.upgrade[prop] as any).resources[
        resourcesToId[res]
      ];
      (this.upgrade[prop] as any).resources[resourcesToId[res]] = Int64.from(
        prevValue + amount
      );
      return this;
    };
  };

  // For resource amounts: negative goes to price, positive goes to target
  for (const res of allResources) {
    proto[res] = function (amount: number) {
      if (amount < 0) {
        // Cost: add to price (as positive value)
        const prevValue = +this.upgrade.price.resources[resourcesToId[res]];
        this.upgrade.price.resources[resourcesToId[res]] = Int64.from(
          prevValue + Math.abs(amount)
        );
      } else if (amount > 0) {
        // Gain: add to target
        const prevValue = +this.upgrade.target.resources[resourcesToId[res]];
        this.upgrade.target.resources[resourcesToId[res]] = Int64.from(
          prevValue + amount
        );
      }
      return this;
    };
  }

  // For RPS: positive goes to rps, negative goes to rpsPrice
  for (const res of allResources) {
    const fnName = `${res}IdlePower` as const;
    proto[fnName] = function (amount: number) {
      if (amount < 0) {
        // RPS cost: add to rpsPrice (as positive value)
        const prevValue = +this.upgrade.rpsPrice.resources[resourcesToId[res]];
        this.upgrade.rpsPrice.resources[resourcesToId[res]] = Int64.from(
          prevValue + Math.abs(amount)
        );
      } else if (amount > 0) {
        // RPS gain: add to rps
        const prevValue = +this.upgrade.rps.resources[resourcesToId[res]];
        this.upgrade.rps.resources[resourcesToId[res]] = Int64.from(
          prevValue + amount
        );
      }
      return this;
    };
  }

  for (const res of allResources) {
    make("storages", "Storage")(res);
    make("clickPower", "ClickPower")(res);
  }
}

export interface U extends BuilderAPI<U> {}

attachResourceMethods(U.prototype);

export class UpgradeBuilder {
  upgrades: Upgrade[] = [];

  add(upgrade: Upgrade) {
    this.upgrades.push(upgrade);
  }

  toString() {
    return this.upgrades.map((upgrade) => upgrade.toStringSparse()).join("\n");
  }
}
