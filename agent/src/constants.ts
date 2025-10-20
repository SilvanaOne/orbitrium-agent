import { PrivateKey } from "o1js";
import type { Resource, Tiers } from "./lib/types.js";

export const adminAddress = PrivateKey.random().toPublicKey();

export const totalLevelAmount = 100;

export const priceMultiplier = 1.25;

export const DECIMALS = 6;

const SECONDS_IN_MINUTE = 60;

export const basicCosts = {
  T1: {
    basicClickPower: 1 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((20 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 100 * 10 ** DECIMALS,
    basicClickCost: -5 * 10 ** DECIMALS,
    basicIdleCost: -25 * 10 ** DECIMALS,
    basicCapacityCost: -50 * 10 ** DECIMALS,
    goldMultiplier: 0,
  },
  T2: {
    basicClickPower: 0.5 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((5 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 50 * 10 ** DECIMALS,
    basicClickCost: -2.5 * 10 ** DECIMALS,
    basicIdleCost: -12.5 * 10 ** DECIMALS,
    basicCapacityCost: -25 * 10 ** DECIMALS,
    goldMultiplier: 10,
  },
  T3: {
    basicClickPower: 0.1 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((1 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 10 * 10 ** DECIMALS,
    basicClickCost: -0.5 * 10 ** DECIMALS,
    basicIdleCost: -2.5 * 10 ** DECIMALS,
    basicCapacityCost: -5 * 10 ** DECIMALS,
    goldMultiplier: 300,
  },
  T34: {
    basicClickPower: 0.05 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((0.5 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 5 * 10 ** DECIMALS,
    basicClickCost: -0.25 * 10 ** DECIMALS,
    basicIdleCost: -1.25 * 10 ** DECIMALS,
    basicCapacityCost: -2.5 * 10 ** DECIMALS,
    goldMultiplier: 500,
  },
  T4: {
    basicClickPower: 0.02 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((0.5 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 5 * 10 ** DECIMALS,
    basicClickCost: -0.1 * 10 ** DECIMALS,
    basicIdleCost: -0.5 * 10 ** DECIMALS,
    basicCapacityCost: -1 * 10 ** DECIMALS,
    goldMultiplier: 1500,
  },
  T5: {
    basicClickPower: 0.01 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((0.1 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 1 * 10 ** DECIMALS,
    basicClickCost: -0.05 * 10 ** DECIMALS,
    basicIdleCost: -0.25 * 10 ** DECIMALS,
    basicCapacityCost: -0.5 * 10 ** DECIMALS,
    goldMultiplier: 1500,
  },
  T6: {
    basicClickPower: 0.001 * 10 ** DECIMALS,
    basicIdlePower: Math.floor((0.01 * 10 ** DECIMALS) / SECONDS_IN_MINUTE),
    basicCapacity: 0.1 * 10 ** DECIMALS,
    basicClickCost: -0.005 * 10 ** DECIMALS,
    basicIdleCost: -0.025 * 10 ** DECIMALS,
    basicCapacityCost: -0.05 * 10 ** DECIMALS,
    goldMultiplier: 5000,
  },
} as const;

export const resourcesStats: Record<Resource, { tier: Tiers }> = {
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
    tier: "T3",
  },
  provision: {
    tier: "T4",
  },
  crystal: {
    tier: "T1",
  },
  herbs: {
    tier: "T1",
  },
  elixir: {
    tier: "T3",
  },
  magicInk: {
    tier: "T34",
  },
  gems: {
    tier: "T5",
  },
  arcaneCore: {
    tier: "T6",
  },
  gold: {
    tier: "T1",
  },
  blackOrb: {
    tier: "T6",
  },
} as const;

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

export const allResources = Object.keys(
  resourcesToId
) as (keyof typeof resourcesToId)[];

export const RESOURCE_COUNT = Object.keys(resourcesToId).length;

export const PACKED_RESOURCE_COUNT = Math.ceil(RESOURCE_COUNT / 4);
