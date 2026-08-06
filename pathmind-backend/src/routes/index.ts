import { Router } from "express";
import { authRouter } from "./auth.routes";
import { roadmapRouter } from "./roadmap.routes";
import { progressRouter } from "./progress.routes";
import { calendarRouter, googleAuthRouter } from "./calendar.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/auth/google", googleAuthRouter);
apiRouter.use("/roadmaps", roadmapRouter);
apiRouter.use("/roadmaps", progressRouter);
apiRouter.use("/roadmaps", calendarRouter);
