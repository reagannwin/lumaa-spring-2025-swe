import { Router } from "express";
import { createTask, deleteTask, listTasks, updateTask } from "../controllers/taskController";
import { asyncHandler } from "../middleware/asyncHandler";
import authenticate from "../middleware/authenticate";

const router = Router();

// Every task route requires a valid token.
router.use(authenticate);

router.get("/", asyncHandler(listTasks));
router.post("/", asyncHandler(createTask));
router.put("/:id", asyncHandler(updateTask));
router.delete("/:id", asyncHandler(deleteTask));

export default router;
