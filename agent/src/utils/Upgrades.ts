import { Int64 } from 'o1js';
import {
  basicCosts,
  DECIMALS,
  priceMultiplier,
  resourcesStats,
  totalLevelAmount,
} from '../constants.js';
import { Resource, Tiers } from '../lib/types.js';
import { U, UpgradeBuilder } from '../managers/UpgradesManager.js';
import { ResourceVector } from './ResourceVector.js';

// export const upgrades = builder.upgrades;

let globalCounter = 0;

export interface BasicCosts {
  basicClickPower: number;
  basicIdlePower: number;
  basicCapacity: number;
  basicClickCost: number;
  basicIdleCost: number;
  basicCapacityCost: number;
  goldMultiplier: number;
}

const decMultiplier = 10 ** DECIMALS;

export const getCraftingRules = () => {
  const craftingRules: U[] = [];

  // Rules for tier 1 crafting and gold
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'wood').wood(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'stone').stone(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'metal').metal(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'wheat').wheat(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'water').water(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'meat').meat(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'herbs').herbs(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'crystal').crystal(1 * decMultiplier)
  );

  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'gold').gold(1 * decMultiplier)
  );

  // Steel at 20 metal and 10 wood
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'steel')
      .steel(1 * decMultiplier)
      .metal(-20 * decMultiplier)
      .wood(-10 * decMultiplier)
  );

  // Planks at 10 stone and 10 wood
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'plank')
      .plank(1 * decMultiplier)
      .stone(-10 * decMultiplier)
      .wood(-5 * decMultiplier)
  );

  // MechParts ar 50 planks + 30 steel
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'mechPart')
      .mechPart(1 * decMultiplier)
      .plank(-50 * decMultiplier)
      .steel(-30 * decMultiplier)
  );

  // Flour at 5 wheat
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'flour')
      .flour(1 * decMultiplier)
      .wheat(-5 * decMultiplier)
  );

  // Bread at 50 water and 5 flour
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'bread')
      .bread(1 * decMultiplier)
      .water(-50 * decMultiplier)
      .flour(-5 * decMultiplier)
  );

  // Pie at 100 meat and 10 flour
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'pie')
      .pie(1 * decMultiplier)
      .meat(-100 * decMultiplier)
      .flour(-10 * decMultiplier)
  );

  // Provision at 50 bread and 30 pie
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'provision')
      .provision(1 * decMultiplier)
      .bread(-50 * decMultiplier)
      .pie(-30 * decMultiplier)
  );

  // Elixir at 50 herbs
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'elixir')
      .elixir(1 * decMultiplier)
      .herbs(-50 * decMultiplier)
  );

  // Magic Ink at 400 Crystal and 5 Elixir
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'magicInk')
      .magicInk(1 * decMultiplier)
      .crystal(-400 * decMultiplier)
      .elixir(-5 * decMultiplier)
  );

  // Gems at 50 elixir and 25 magic ink
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'gems')
      .gems(1 * decMultiplier)
      .elixir(-50 * decMultiplier)
      .magicInk(-25 * decMultiplier)
  );

  // Arcane Core at 40 magic ink and 5 gems
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'arcaneCore')
      .arcaneCore(1 * decMultiplier)
      .magicInk(-40 * decMultiplier)
      .gems(-5 * decMultiplier)
  );

  // Black Orb at 1 arcane core and 20 provision and 100 mech parts and 2500 gold
  craftingRules.push(
    new U(globalCounter++, 'crafting', 0, 'blackOrb')
      .blackOrb(1 * decMultiplier)
      .arcaneCore(-1 * decMultiplier)
      .provision(-20 * decMultiplier)
      .mechPart(-100 * decMultiplier)
      .gold(-2500 * decMultiplier)
  );

  return craftingRules;
};

const calculateUpgradeCost = (
  tier: Tiers,
  level: number
): {
  clickCost: number;
  idleCost: number;
  storageCost: number;
  goldMultiplier: number;
} => {
  const basicResourceCosts = basicCosts[tier];
  const basicClickCost = basicResourceCosts.basicClickCost;
  const basicIdleCost = basicResourceCosts.basicIdleCost;
  const basicCapacityCost = basicResourceCosts.basicCapacityCost;
  const goldMultiplier = basicResourceCosts.goldMultiplier;

  if (level <= 1) {
    return {
      clickCost: basicClickCost,
      idleCost: basicIdleCost,
      storageCost: basicCapacityCost,
      goldMultiplier,
    };
  }

  let newCost = calculateUpgradeCost(tier, level - 1);
  newCost.clickCost = Math.round(newCost.clickCost * priceMultiplier);
  newCost.idleCost = Math.round(newCost.idleCost * priceMultiplier);
  newCost.storageCost = Math.round(newCost.storageCost * priceMultiplier);

  return newCost;
};

const calculateUpgradeTotalValue = (
  tier: Tiers,
  level: number
): {
  clickPower: number;
  idlePower: number;
  capacityPower: number;
} => {
  let basicValue = basicCosts[tier];
  if (level == 1) {
    return {
      clickPower: basicValue.basicClickPower,
      idlePower: basicValue.basicIdlePower,
      capacityPower: basicValue.basicCapacity,
    };
  }

  let newClickPower =
    basicValue.basicClickPower * level * 2 ** Math.floor(level / 10);
  let newIdlePower =
    basicValue.basicIdlePower * level * 2 ** Math.floor(level / 10);
  let newCapacityPower =
    basicValue.basicCapacity * level * 2 ** Math.floor(level / 10);

  return {
    clickPower: newClickPower,
    idlePower: newIdlePower,
    capacityPower: newCapacityPower,
  };
};

const calculateUpgradeValue = (
  tier: Tiers,
  level: number
): {
  clickPower: number;
  idlePower: number;
  capacityPower: number;
} => {
  let basicValue = basicCosts[tier];
  if (level == 1) {
    return {
      clickPower: basicValue.basicClickPower,
      idlePower: basicValue.basicIdlePower,
      capacityPower: basicValue.basicCapacity,
    };
  }

  let previous = calculateUpgradeTotalValue(tier, level - 1);
  let current = calculateUpgradeTotalValue(tier, level);

  return {
    clickPower: current.clickPower - previous.clickPower,
    idlePower: current.idlePower - previous.idlePower,
    capacityPower: current.capacityPower - previous.capacityPower,
  };
};

const getLeveledUpgrades = () => {
  const upgrades: U[] = [];

  for (const [key, value] of Object.entries(resourcesStats)) {
    for (let i = 1; i < totalLevelAmount; i++) {
      const tier = value.tier;
      const { clickCost, idleCost, storageCost, goldMultiplier } =
        calculateUpgradeCost(tier, i);
      const { clickPower, idlePower, capacityPower } = calculateUpgradeValue(
        tier,
        i
      );

      const craftingRule = allCraftingRules.find((rule) => rule.target === key);

      //   let u = new U();
      //   console.log(u.wood(1).bread(1).woodGoldPrice);
      //   new U().wood(1).woodGoldPrice(1);

      // Click upgrade
      upgrades.push(
        new U(globalCounter++, 'click', i, key as Resource)
          [key](clickCost)
          ['gold'](clickCost * goldMultiplier)
          [`${key}ClickPower`](clickPower)
      );

      // Idle upgradeupgrade
      let baseIdleUpgrade: U = new U(
        globalCounter++,
        'idle',
        i,
        key as Resource
      )
        [key](idleCost)
        ['gold'](idleCost * goldMultiplier)
        [`${key}IdlePower`](idlePower);
      if (craftingRule) {
        // If resource is crafting resource, add crafting rule to idle upgrade
        const craftingRuleResources =
          craftingRule.upgrade.resources.resources.map((v) =>
            +v < 0 ? Int64.from(v) : Int64.from(0)
          );
        const adjustedCraftingRuleResources = craftingRuleResources.map((v) =>
          v.mul(idlePower).div(10 ** DECIMALS)
        );
        baseIdleUpgrade.upgrade.resourcePerSecond =
          baseIdleUpgrade.upgrade.resourcePerSecond.add(
            new ResourceVector({ resources: adjustedCraftingRuleResources }),
            false
          );
      }
      upgrades.push(baseIdleUpgrade);

      // Capacity upgrade
      upgrades.push(
        new U(globalCounter++, 'storage', i, key as Resource)
          [key](storageCost)
          ['gold'](storageCost * goldMultiplier)
          [`${key}Storage`](capacityPower)
      );
    }
  }

  return upgrades;
};

const getResourceOpenUpgrades = () => {
  const upgrades: U[] = [];

  // Wood unlocks initially

  // Stone at 10 wood
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'stone')
      .wood(-10 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .stoneClickPower(basicCosts[resourcesStats.stone.tier].basicClickPower)
  );

  // Planks at 1 stone
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'plank')
      .stone(-1 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .plankClickPower(basicCosts[resourcesStats.plank.tier].basicClickPower)
  );

  // Metal at 1 planks
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'metal')
      .plank(-1 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .metalClickPower(basicCosts[resourcesStats.metal.tier].basicClickPower)
  );

  // Steel at 100 metal
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'steel')
      .metal(-100 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .steelClickPower(basicCosts[resourcesStats.steel.tier].basicClickPower)
  );

  // Gold at 1 steel
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'gold')
      .steel(-1 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .goldClickPower(basicCosts[resourcesStats.gold.tier].basicClickPower)
  );

  // MechanicalPart at 200 gold
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'mechPart')
      .gold(-200 * decMultiplier)
      .blackOrb(3 * decMultiplier)
      .mechPartClickPower(
        basicCosts[resourcesStats.mechPart.tier].basicClickPower
      )
  );

  // Wheat at 1 mechanicalPart
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'wheat')
      .mechPart(-1 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .wheatClickPower(basicCosts[resourcesStats.wheat.tier].basicClickPower)
  );

  // Flour at 200 Wheat
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'flour')
      .wheat(-200 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .flourClickPower(basicCosts[resourcesStats.flour.tier].basicClickPower)
  );

  // Water at 10 flour
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'water')
      .flour(-10 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .waterClickPower(basicCosts[resourcesStats.water.tier].basicClickPower)
  );

  // Meat at 10 flour
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'meat')
      .flour(-10 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .meatClickPower(basicCosts[resourcesStats.meat.tier].basicClickPower)
  );

  // Bread at 200 water
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'bread')
      .water(-200 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .breadClickPower(basicCosts[resourcesStats.bread.tier].basicClickPower)
  );

  // Pie at 200 200 meat
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'pie')
      .meat(-200 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .pieClickPower(basicCosts[resourcesStats.pie.tier].basicClickPower)
  );

  // Provision at 100 bread and 100 pie
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'provision')
      .bread(-50 * decMultiplier)
      .pie(-30 * decMultiplier)
      .blackOrb(3 * decMultiplier)
      .provisionClickPower(
        basicCosts[resourcesStats.provision.tier].basicClickPower
      )
  );

  // Herbs at 1 Provision
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'herbs')
      .provision(-1 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .herbsClickPower(basicCosts[resourcesStats.herbs.tier].basicClickPower)
  );

  // Elixir at 500 herbs
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'elixir')
      .herbs(-500 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .elixirClickPower(basicCosts[resourcesStats.elixir.tier].basicClickPower)
  );

  // Crystal at 10 Elixir
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'crystal')
      .elixir(-10 * decMultiplier)
      .blackOrb(1 * decMultiplier)
      .crystalClickPower(
        basicCosts[resourcesStats.crystal.tier].basicClickPower
      )
  );

  // Magic Ink at 50 Elixir and 500 Crystal
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'magicInk')
      .elixir(-50 * decMultiplier)
      .crystal(-500 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .magicInkClickPower(
        basicCosts[resourcesStats.magicInk.tier].basicClickPower
      )
  );

  // Gems at 50 Magic Ink and 200 Elixir
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'gems')
      .magicInk(-50 * decMultiplier)
      .elixir(-200 * decMultiplier)
      .blackOrb(2 * decMultiplier)
      .gemsClickPower(basicCosts[resourcesStats.gems.tier].basicClickPower)
  );

  // Arcane Core at 200 Magic Ink and 50 Gems
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'arcaneCore')
      .magicInk(-200 * decMultiplier)
      .gems(-50 * decMultiplier)
      .blackOrb(3 * decMultiplier)
      .arcaneCoreClickPower(
        basicCosts[resourcesStats.arcaneCore.tier].basicClickPower
      )
  );

  // Black Orb at 100 Mech Parts and 25 Provision and 1 Arcane Core
  upgrades.push(
    new U(globalCounter++, 'unlock', 0, 'blackOrb')
      .mechPart(-100 * decMultiplier)
      .provision(-25 * decMultiplier)
      .arcaneCore(-1 * decMultiplier)
      .gold(5000 * decMultiplier)
      .blackOrb(5 * decMultiplier)
      .blackOrbClickPower(
        basicCosts[resourcesStats.blackOrb.tier].basicClickPower
      )
  );

  return upgrades;
};

export const getUpgrades = () => {
  const leveledUpgrades = getLeveledUpgrades();
  const resourceOpenUpgrades = getResourceOpenUpgrades();

  return [...leveledUpgrades, ...resourceOpenUpgrades];
};

export const allCraftingRules = getCraftingRules();
export const LAST_CRAFTING_RULE_ID = allCraftingRules.length - 1;

export const allUpgrades = getUpgrades();

export const allRules = [...allCraftingRules, ...allUpgrades];
