import { allResources } from "../constants.js";

export type Tiers = "T1" | "T2" | "T3" | "T34" | "T4" | "T5" | "T6";

export type Resource = (typeof allResources)[number];
