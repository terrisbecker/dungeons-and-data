import express, { type Express } from "express";
import { requireAuth } from "./auth/auth.middleware.js";
import { authRouter } from "./auth/auth.routes.js";
import { campaignMembershipsRouter } from "./campaign-memberships/campaign-memberships.routes.js";
import { campaignsRouter } from "./campaigns/campaigns.routes.js";
import { characterClassesRouter } from "./character-classes/character-classes.routes.js";
import { characterConditionsRouter } from "./character-conditions/character-conditions.routes.js";
import { characterFeatsRouter } from "./character-feats/character-feats.routes.js";
import { characterFeaturesRouter } from "./character-features/character-features.routes.js";
import { characterResourcesRouter } from "./character-resources/character-resources.routes.js";
import { characterSkillsRouter } from "./character-skills/character-skills.routes.js";
import { characterSpellsRouter } from "./character-spells/character-spells.routes.js";
import { charactersRouter } from "./characters/characters.routes.js";
import { creatureDamageModifiersRouter } from "./creature-damage-modifiers/creature-damage-modifiers.routes.js";
import { creaturePlacementsRouter } from "./creature-placements/creature-placements.routes.js";
import { creatureSkillsRouter } from "./creature-skills/creature-skills.routes.js";
import { creaturesRouter } from "./creatures/creatures.routes.js";
import { featsRouter } from "./feats/feats.routes.js";
import { featuresRouter } from "./features/features.routes.js";
import { errorMiddleware } from "./http/error.middleware.js";
import { inventoryItemsRouter } from "./inventory-items/inventory-items.routes.js";
import { itemsRouter } from "./items/items.routes.js";
import { locationsRouter } from "./locations/locations.routes.js";
import { playersRouter } from "./players/players.routes.js";
import { proficienciesRouter } from "./proficiencies/proficiencies.routes.js";
import { spellSlotsRouter } from "./spell-slots/spell-slots.routes.js";
import { spellsRouter } from "./spells/spells.routes.js";
import { statBlockEntriesRouter } from "./stat-block-entries/stat-block-entries.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Public auth routes (register/login) — mounted BEFORE the global gate.
  app.use("/auth", authRouter);

  // Everything below requires a valid JWT. Any authenticated user may READ any
  // resource; write access is enforced per-route by the guards in
  // src/auth/guards.js. Register/login and /health stay public above.
  app.use(requireAuth);

  // PlayerCharacter hub and its owned tables.
  app.use("/characters", charactersRouter);
  app.use("/character-classes", characterClassesRouter);
  app.use("/spell-slots", spellSlotsRouter);
  app.use("/character-resources", characterResourcesRouter);
  app.use("/character-skills", characterSkillsRouter);
  app.use("/proficiencies", proficienciesRouter);
  app.use("/character-conditions", characterConditionsRouter);
  app.use("/inventory-items", inventoryItemsRouter);
  app.use("/character-spells", characterSpellsRouter);
  app.use("/character-feats", characterFeatsRouter);
  app.use("/character-features", characterFeaturesRouter);

  // Creature (NPC/Monster) hub and its owned tables.
  app.use("/creatures", creaturesRouter);
  app.use("/creature-skills", creatureSkillsRouter);
  app.use("/stat-block-entries", statBlockEntriesRouter);
  app.use("/creature-damage-modifiers", creatureDamageModifiersRouter);
  app.use("/creature-placements", creaturePlacementsRouter);

  // Shared catalogs referenced by the join tables above.
  app.use("/items", itemsRouter);
  app.use("/spells", spellsRouter);
  app.use("/feats", featsRouter);
  app.use("/features", featuresRouter);

  // Locations (nested hierarchy; creatures are placed here).
  app.use("/locations", locationsRouter);

  // Accounts, campaigns, and the membership join that assigns DM/player roles.
  app.use("/players", playersRouter);
  app.use("/campaigns", campaignsRouter);
  app.use("/campaign-memberships", campaignMembershipsRouter);

  // Central error handler — must be registered last.
  app.use(errorMiddleware);

  return app;
}
