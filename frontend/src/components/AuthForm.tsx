import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../services/api";

export type ModoAuth = "login" | "cadastro";

interface AuthFormProps {
  modoInicial: ModoAuth;
  onSucesso: () => void;
  onCancelar: () => void;
}

export default function AuthForm({ modoInicial, onSucesso, onCancelar }: AuthFormProps): React.ReactElement {
  const { login, registrar } = useAuth();
  const [modo, setModo] = useState<ModoAuth>(modoInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ehCadastro = modo === "cadastro";

  function trocarModo(novo: ModoAuth) {
    setModo(novo);
    setErro(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      if (ehCadastro) {
        await registrar(nome, email, senha);
      } else {
        await login(email, senha);
      }
      onSucesso();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <h6 className="mb-0 fw-semibold">
          <i className={`bi ${ehCadastro ? "bi-person-plus" : "bi-box-arrow-in-right"} me-2`}></i>
          {ehCadastro ? "Criar conta" : "Entrar"}
        </h6>
        <button className="btn btn-sm btn-close btn-close-white" onClick={onCancelar} aria-label="Fechar" />
      </div>

      <div className="card-body">
        {erro && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {ehCadastro && (
            <div className="mb-3">
              <label className="form-label"><strong>Nome</strong></label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: José Maria"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                minLength={2}
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label"><strong>E-mail</strong></label>
            <input
              type="email"
              className="form-control"
              placeholder="Ex: jose.maria@aluno.ifsudestemg.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Senha</strong></label>
            <input
              type="password"
              className="form-control"
              placeholder={ehCadastro ? "Mínimo de 6 caracteres" : "Sua senha"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={ehCadastro ? 6 : undefined}
              required
            />
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center">
            <button type="submit" className="btn btn-success" disabled={enviando}>
              {enviando ? "Enviando..." : ehCadastro ? "Criar conta" : "Entrar"}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-link ms-auto"
              onClick={() => trocarModo(ehCadastro ? "login" : "cadastro")}
            >
              {ehCadastro ? "Já tenho conta" : "Ainda não tenho conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
