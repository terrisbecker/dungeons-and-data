-- Drop the ability-score range CHECK constraints (1–30) on PlayerCharacter and
-- Creature. These encoded a 5e *rules* limit rather than a data-integrity rule,
-- were redundant with the service-layer enforcement, and were in tension with
-- the schema's homebrew-open stance. Ability-score bounds are now owned solely
-- by the service layer, where a DM can relax them. IF EXISTS keeps this safe on
-- a DB that never had them (e.g. a fresh environment).
--
-- The InventoryItem single-owner XOR check is intentionally kept — it guards a
-- relational invariant, not a rules preference.
ALTER TABLE "PlayerCharacter" DROP CONSTRAINT IF EXISTS "PlayerCharacter_abilityScores_range_check";
ALTER TABLE "Creature" DROP CONSTRAINT IF EXISTS "Creature_abilityScores_range_check";
