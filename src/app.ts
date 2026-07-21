import express, { type Express } from "express";
import { characterClassesRouter } from "./character-classes/character-classes.routes.js";
import { characterConditionsRouter } from "./character-conditions/character-conditions.routes.js";
import { characterFeatsRouter } from "./character-feats/character-feats.routes.js";
import { characterFeaturesRouter } from "./character-features/character-features.routes.js";
import { characterResourcesRouter } from "./character-resources/character-resources.routes.js";
import { characterSkillsRouter } from "./character-skills/character-skills.routes.js";
import { characterSpellsRouter } from "./character-spells/character-spells.routes.js";
import { charactersRouter } from "./characters/characters.routes.js";
import { featsRouter } from "./feats/feats.routes.js";
import { featuresRouter } from "./features/features.routes.js";
import { errorMiddleware } from "./http/error.middleware.js";
import { inventoryItemsRouter } from "./inventory-items/inventory-items.routes.js";
import { itemsRouter } from "./items/items.routes.js";
import { proficienciesRouter } from "./proficiencies/proficiencies.routes.js";
import { spellSlotsRouter } from "./spell-slots/spell-slots.routes.js";
import { spellsRouter } from "./spells/spells.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

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

  // Shared catalogs referenced by the join tables above.
  app.use("/items", itemsRouter);
  app.use("/spells", spellsRouter);
  app.use("/feats", featsRouter);
  app.use("/features", featuresRouter);

  // Central error handler — must be registered last.
  app.use(errorMiddleware);

  return app;
}
