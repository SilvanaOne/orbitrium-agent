import { PrivateKey } from "o1js";
export const adminAddress = PrivateKey.random().toPublicKey();
export const totalLevelAmount = 15;
export const priceMultiplier = 1.25;
export const DECIMALS = 6;
const SECONDS_IN_MINUTE = 60;
export const basicCosts = {
  T1: {
    basicClickPower: 1 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((10 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 100 * 10 ** DECIMALS,
    basicClickCost: -5 * 10 ** DECIMALS,
    basicIdleCost: -50 * 10 ** DECIMALS,
    basicCapacityCost: -100 * 10 ** DECIMALS,
    goldMultiplier: 0,
  },
  T2: {
    basicClickPower: 0.5 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((5 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 50 * 10 ** DECIMALS,
    basicClickCost: -5 * 10 ** DECIMALS,
    basicIdleCost: -50 * 10 ** DECIMALS,
    basicCapacityCost: -100 * 10 ** DECIMALS,
    goldMultiplier: 5,
  },
  T3: {
    basicClickPower: 0.1 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((1 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 10 * 10 ** DECIMALS,
    basicClickCost: -5 * 10 ** DECIMALS,
    basicIdleCost: -50 * 10 ** DECIMALS,
    basicCapacityCost: -100 * 10 ** DECIMALS,
    goldMultiplier: 10,
  },
  T4: {
    basicClickPower: 0.02 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((0.5 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 5 * 10 ** DECIMALS,
    basicClickCost: -5 * 10 ** DECIMALS,
    basicIdleCost: -50 * 10 ** DECIMALS,
    basicCapacityCost: -100 * 10 ** DECIMALS,
    goldMultiplier: 15,
  },
  T5: {
    basicClickPower: 0.001 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((0.01 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 0.1 * 10 ** DECIMALS,
    basicClickCost: -5 * 10 ** DECIMALS,
    basicIdleCost: -50 * 10 ** DECIMALS,
    basicCapacityCost: -100 * 10 ** DECIMALS,
    goldMultiplier: 30,
  },
  T6: {
    basicClickPower: 0.001 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((0.01 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 0.1 * 10 ** DECIMALS,
    basicClickCost: -5 * 10 ** DECIMALS,
    basicIdleCost: -50 * 10 ** DECIMALS,
    basicCapacityCost: -100 * 10 ** DECIMALS,
    goldMultiplier: 40,
  },
};
export const resourcesStats = {
  wood: {
    tier: "T1",
  },
  metal: {
    tier: "T1",
  },
  stone: {
    tier: "T1",
  },
  steel: {
    tier: "T2",
  },
  plank: {
    tier: "T2",
  },
  mechPart: {
    tier: "T3",
  },
  water: {
    tier: "T1",
  },
  wheat: {
    tier: "T1",
  },
  meat: {
    tier: "T1",
  },
  flour: {
    tier: "T2",
  },
  bread: {
    tier: "T3",
  },
  pie: {
    tier: "T4",
  },
  provision: {
    tier: "T5",
  },
  crystal: {
    tier: "T1",
  },
  herbs: {
    tier: "T1",
  },
  elixir: {
    tier: "T2",
  },
  magicInk: {
    tier: "T3",
  },
  gems: {
    tier: "T4",
  },
  arcaneCore: {
    tier: "T5",
  },
  gold: {
    tier: "T1",
  },
  blackOrb: {
    tier: "T6",
  },
};
export const resourcesToId = {
  wood: 0,
  metal: 1,
  stone: 2,
  steel: 3,
  plank: 4,
  mechPart: 5,
  water: 6,
  wheat: 7,
  meat: 8,
  flour: 9,
  bread: 10,
  pie: 11,
  provision: 12,
  crystal: 13,
  herbs: 14,
  elixir: 15,
  magicInk: 16,
  gems: 17,
  arcaneCore: 18,
  gold: 19,
  blackOrb: 20,
};
export const allResources = Object.keys(resourcesToId);
export const RESOURCE_COUNT = Object.keys(resourcesToId).length;
export const PACKED_RESOURCE_COUNT = Math.ceil(RESOURCE_COUNT / 4);
//# sourceMappingURL=constants.js.map
