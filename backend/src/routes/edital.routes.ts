import { Router } from "express";
import {
  listarEditais,
  buscarEditalPorId,
  criarEdital,
  atualizarEdital,
  removerEdital,
} from "../controllers/edital.controller";
import { autenticar, exigirAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Leitura: pública
router.get("/editais", listarEditais);
router.get("/editais/:id", buscarEditalPorId);

// Escrita: exige token válido (autenticar -> 401) E papel ADMIN (exigirAdmin -> 403)
router.post("/editais", autenticar, exigirAdmin, criarEdital);
router.put("/editais/:id", autenticar, exigirAdmin, atualizarEdital);
router.delete("/editais/:id", autenticar, exigirAdmin, removerEdital);

export default router;
