import jwt, { SignOptions } from "jsonwebtoken";

/**
 * Lê o segredo do JWT no momento do uso (e não na importação), garantindo que
 * o dotenv já tenha carregado o .env. Sem segredo, a API recusa assinar/validar
 * tokens em vez de usar um valor padrão inseguro.
 */
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não definido. Configure-o no arquivo .env.");
  }
  return secret;
}

export function assinarToken(userId: number): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  // "sub" (subject) é o campo padrão do JWT para identificar o dono do token
  return jwt.sign({}, getSecret(), { subject: String(userId), expiresIn });
}

export function verificarToken(token: string): { id: number } {
  const payload = jwt.verify(token, getSecret());
  const id = Number(typeof payload === "object" ? payload.sub : NaN);
  if (!Number.isInteger(id)) {
    throw new Error("Token sem identificação de usuário.");
  }
  return { id };
}
