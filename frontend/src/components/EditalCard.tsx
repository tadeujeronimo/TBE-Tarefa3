import { Edital } from "../types/Edital";

interface EditalCardProps {
  edital: Edital;
  destaque?: boolean;
  // Quando informado (apenas para ADMIN), mostra o botão "Editar"
  onEditar?: (edital: Edital) => void;
}

export default function EditalCard({ edital, destaque, onEditar }: EditalCardProps): React.ReactElement {
  // const hoje = new Date();
  // const encerramento = new Date(edital.dataEncerramento + "T23:59:59");
  // const estaAberto = encerramento >= hoje;
  const estaAberto = edital.status === "ABERTO";

  function formatarData(data: string): string {
    const d = new Date(data + "T00:00:00");
    if (isNaN(d.getTime())) return data;
    return d.toLocaleDateString("pt-BR");
  }

  return (
    <div className="card h-100 shadow-sm">
      {destaque && (
        <div className="bg-warning text-dark text-center fw-bold py-2">
          <i className="bi bi-star-fill me-2"></i>
          EDITAL EM DESTAQUE
        </div>
      )}

      <img
        src={edital.imageUrl}
        alt={edital.disciplina}
        className="card-img-top"
        style={{ height: 180, objectFit: "cover" }}
      />

      <div className="card-body bg-success-subtle">
        <h5>{edital.disciplina}</h5>
        <p className="text-muted small">{edital.descricao}</p>

        <p><strong>Professor:</strong> {edital.professor}</p>
        <p><strong>Curso:</strong> {edital.curso}</p>
        <p><strong>Vagas:</strong> {edital.vagas}</p>
        <p><strong>Abertura:</strong> {formatarData(edital.dataAbertura)}</p>
        <p><strong>Encerramento:</strong> {formatarData(edital.dataEncerramento)}</p>

        {estaAberto ? (
          <span className="badge bg-success">
            <i className="bi bi-check-circle me-1"></i>Inscrições Abertas
          </span>
        ) : (
          <span className="badge bg-danger">
            <i className="bi bi-x-circle me-1"></i>Edital Encerrado
          </span>
        )}

        {onEditar && (
          <button
            className="btn btn-sm btn-outline-success float-end"
            onClick={() => onEditar(edital)}
          >
            <i className="bi bi-pencil-square me-1"></i>Editar
          </button>
        )}
      </div>
    </div>
  );
}