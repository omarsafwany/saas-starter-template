import { Router } from "express";

import { itemsRouter } from "../modules/items/items.routes.js";

/**
 * Aggregates all feature-module routers under /api.
 * Mount new modules here as they're added (see modules/items for the
 * reference module shape).
 */
export const apiRouter = Router();

apiRouter.use("/items", itemsRouter);
