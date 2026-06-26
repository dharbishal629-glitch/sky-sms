import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import simRouter from "./sim";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(simRouter);

export default router;
