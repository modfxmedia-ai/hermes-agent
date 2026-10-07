import { type Brand, MODFX } from "./tokens";
import { HEROSHIP } from "./brands/heroship";
import { NORTHLINE } from "./brands/northline";

export const BRANDS: Record<string, Brand> = {
  modfx: MODFX,
  heroship: HEROSHIP,
  northline: NORTHLINE,
};

export const getBrand = (id: string): Brand => {
  const b = BRANDS[id];
  if (!b) throw new Error(`Unknown brand "${id}". Known: ${Object.keys(BRANDS).join(", ")}`);
  return b;
};
