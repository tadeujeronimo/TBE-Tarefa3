import { useState } from "react";
import { Edital } from "../types/Edital";
import { EditalInput, ApiError } from "../services/api";

interface EditalFormProps {
  // Se vier um edital, o formulário entra em modo de edição; senão, cria um novo
  edital?: Edital | null;
  onSalvar: (dados: EditalInput) => Promise<void>;
  onCancelar: () => void;
}

// Imagem usada quando o usuário não informa outra (arquivo em public/images/)
const IMAGEM_PADRAO = "/images/padrao.png";

export default function EditalForm({ edital, onSalvar, onCancelar }: EditalFormProps): React.ReactElement {
  const editando = Boolean(edital);

  const [disciplina, setDisciplina] = useState(edital?.disciplina ?? "");
  const [descricao, setDescricao] = useState(edital?.descricao ?? "");
  const [imageUrl, setImageUrl] = useState(edital?.imageUrl ?? IMAGEM_PADRAO);
  const [professor, setProfessor] = useState(edital?.professor ?? "");
  const [curso, setCurso] = useState(edital?.curso ?? "");
  const [vagas, setVagas] = useState(edital?.vagas ?? 1);
  const [dataAbertura, setDataAbertura] = useState(edital?.dataAbertura ?? "");
  const [dataEncerramento, setDataEncerramento] = useState(edital?.dataEncerramento ?? "");
  const [status, setStatus] = useState<Edital["status"]>(edital?.status ?? "ABERTO");
  const [destaque, setDestaque] = useState(edital?.destaque ?? false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      await onSalvar({
        disciplina,
        descricao,
        imageUrl,
        professor,
        curso,
        vagas,
        dataAbertura,
        dataEncerramento,
        status,
        destaque,
      });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : "Erro inesperado ao salvar o edital.");
      setSalvando(false);
    }
    // Em caso de sucesso o App fecha o formulário, então não é preciso resetar nada aqui.
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body bg-success-subtle">
        <div className="mb-3 card-header bg-success text-white d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-semibold">
            <i className={`bi ${editando ? "bi-pencil-square" : "bi-plus-circle"} me-2`}></i>
            {editando ? `Editar Edital – ${edital?.disciplina}` : "Cadastrar Novo Edital"}
          </h6>
          <button className="btn btn-sm btn-close btn-close-white" onClick={onCancelar} aria-label="Fechar formulário" />
        </div>

        {erro && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label"><strong>Disciplina</strong></label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Programação Web"
              value={disciplina}
              onChange={(e) => setDisciplina(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Descrição</strong></label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Ex: Edital de monitoria da disciplina de Programação Web."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>URL da Imagem</strong></label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: /images/programacao-web.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Professor</strong></label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Prof. João Silva"
              value={professor}
              onChange={(e) => setProfessor(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Curso</strong></label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Sistemas de Informação"
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Vagas</strong></label>
            <input
              type="number"
              className="form-control"
              min={1}
              max={10}
              value={vagas}
              onChange={(e) => setVagas(Number(e.target.value))}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Data de Abertura</strong></label>
            <input
              type="date"
              className="form-control"
              value={dataAbertura}
              onChange={(e) => setDataAbertura(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><strong>Data de Encerramento</strong></label>
            <input
              type="date"
              className="form-control"
              value={dataEncerramento}
              onChange={(e) => setDataEncerramento(e.target.value)}
              required
            />
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label"><strong>Status</strong></label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as Edital["status"])}
              >
                <option value="ABERTO">Aberto</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="edital-destaque"
                  type="checkbox"
                  className="form-check-input"
                  checked={destaque}
                  onChange={(e) => setDestaque(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="edital-destaque">
                  Edital em destaque
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-success" disabled={salvando}>
              <i className="bi bi-check-lg me-1"></i>
              {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Publicar Edital"}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={onCancelar}>
              <i className="bi bi-x-lg me-1"></i>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
