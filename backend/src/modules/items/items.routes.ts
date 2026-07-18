import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import * as itemsController from "./items.controller.js";

/**
 * Reference module — copy this folder's shape (routes/controller/service/
 * repository/schema) when adding a new feature module.
 */
export const itemsRouter = Router();

itemsRouter.use(requireAuth);

itemsRouter.get("/", itemsController.list);
itemsRouter.get("/:id", itemsController.getOne);
itemsRouter.post("/", itemsController.create);
itemsRouter.patch("/:id", itemsController.update);
itemsRouter.delete("/:id", itemsController.remove);
