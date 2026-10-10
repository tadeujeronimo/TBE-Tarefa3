import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Usuario } from "../types/Usuario";
import { ApiError, buscarUsuarioAtual, entrar, registrarUsuario } from "../services/api";

const CHAVE_TOKEN = "auth_token";

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  ehAdmin: boolean;
  carregando: boolean; // true enquanto confirma o token salvo ao abrir a página
  login: (email: string, password: string) => Promise<void>;
  registrar: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(CHAVE_TOKEN);
    setToken(null);
    setUser(null);
  }, []);

  // Ao abrir a página: se houver token salvo, confirma com a API quem é o usuário
  // (e o papel dele). Token expirado/inválido (401) derruba a sessão.
  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE_TOKEN);
    if (!salvo) {
      setCarregando(false);
      return;
    }

    buscarUsuarioAtual(salvo)
      .then((usuario) => {
        setToken(salvo);
        setUser(usuario);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem(CHAVE_TOKEN);
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  function iniciarSessao(usuario: Usuario, novoToken: string) {
    localStorage.setItem(CHAVE_TOKEN, novoToken);
    setToken(novoToken);
    setUser(usuario);
  }

  async function login(email: string, password: string) {
    const resp = await entrar({ email, password });
    iniciarSessao(resp.user, resp.token);
  }

  async function registrar(name: string, email: string, password: string) {
    const resp = await registrarUsuario({ name, email, password });
    iniciarSessao(resp.user, resp.token);
  }

  const valor = useMemo<AuthContextType>(
    () => ({ user, token, ehAdmin: user?.role === "ADMIN", carregando, login, registrar, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, carregando, logout]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
