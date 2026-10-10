import { Router } from "express";
import { registrar, login, me } from "../controllers/auth.controller";
import { autenticar } from "../middlewares/auth.middleware";

const router = Router();

router.post("/auth/register", registrar);
router.post("/auth/login", login);
router.get("/auth/me", autenticar, me);

export default router;
