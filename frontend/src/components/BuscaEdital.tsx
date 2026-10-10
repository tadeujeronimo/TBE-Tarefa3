interface BuscaEditalProps {
  termoBusca: string;
  onBuscaChange: (termo: string) => void;
  totalEncontrados: number;
  totalEditais: number;
}

export default function BuscaEdital({
  termoBusca,
  onBuscaChange,
  totalEncontrados,
  totalEditais,
}: BuscaEditalProps): React.ReactElement {
  return (
    <div className="mb-4">
      <div className="input-group">
        <span className="input-group-text bg-white">
          <i className="bi bi-search"></i>
        </span>
        <input
          type="text"
          className="form-control border-start-0"
          placeholder="Buscar por disciplina, professor ou curso..."
          value={termoBusca}
          onChange={(e) => onBuscaChange(e.target.value)}
        />
      </div>
      <p className="text-muted small mt-2 mb-0">
        {termoBusca
          ? <><strong>{totalEncontrados}</strong> de {totalEditais} editais encontrados para <em>"{termoBusca}"</em></>
          : <><strong>{totalEditais}</strong> editais disponíveis</>
        }
      </p>
    </div>
  );
}
