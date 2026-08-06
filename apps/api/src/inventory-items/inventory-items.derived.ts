// Pure economy-pricing computation for building inventory. Nothing here is
// stored in the DB or touches Prisma — see docs/economy-layer.md for the
// model this implements (equilibrium-displacement pricing).
//
// A location's contribution to an item type's price modifier is
// (demandLevel - supplyLevel) / demandSlope. Modifiers stack additively up
// the location hierarchy. Because division distributes, summing every
// location's raw slider deltas first and dividing once by the item type's
// slope is equivalent to summing each location's own displaced-equilibrium
// price — and avoids compounding rounding error per step.

export interface EconomyChainStep {
  supplyLevel: number;
  demandLevel: number;
}

export function computeEconomyModifierCp(
  chain: EconomyChainStep[],
  demandSlope: number,
): number {
  const rawDelta = chain.reduce(
    (sum, step) => sum + (step.demandLevel - step.supplyLevel),
    0,
  );
  return Math.round(rawDelta / demandSlope);
}

export function clampPrice(
  baseValueCp: number,
  modifierCp: number,
  floorPercent: number,
  ceilingPercent: number,
): number {
  const floor = Math.round(baseValueCp * (1 - floorPercent / 100));
  const ceiling = Math.round(baseValueCp * (1 + ceilingPercent / 100));
  const price = baseValueCp + modifierCp;
  return Math.min(Math.max(price, floor), ceiling);
}

export interface BuildingEconomySettings {
  economyEnabled: boolean;
  floorPercent: number;
  ceilingPercent: number;
}

export interface BuildingPricingInput {
  baseValueCp: number | null;
  chain: EconomyChainStep[];
  demandSlope: number;
  // null = no campaign (a shared/template building) or no settings row yet —
  // treated the same as economyEnabled: false.
  economySettings: BuildingEconomySettings | null;
}

export interface BuildingPricing {
  buyValueCp: number;
  sellValueCp: number;
}

// Sell is a flat discount off buy, per docs/economy-layer.md's "for now".
const SELL_RATIO = 0.9;

// null = priceless (Item.baseValueCp is null) — never show a computed price
// for an unpriced item. When the economy is off (or unset), buy = the
// unmodified base value, so the sell discount still applies.
export function computeBuildingPricing(
  input: BuildingPricingInput,
): BuildingPricing | null {
  if (input.baseValueCp === null) return null;

  const enabled = input.economySettings?.economyEnabled ?? false;
  const buyValueCp = enabled
    ? clampPrice(
        input.baseValueCp,
        computeEconomyModifierCp(input.chain, input.demandSlope),
        input.economySettings!.floorPercent,
        input.economySettings!.ceilingPercent,
      )
    : input.baseValueCp;

  return {
    buyValueCp,
    sellValueCp: Math.round(buyValueCp * SELL_RATIO),
  };
}
