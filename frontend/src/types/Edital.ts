export interface Edital {
  id: number;
  disciplina: string;
  descricao: string;
  imageUrl: string;
  professor: string;
  curso: string;
  vagas: number;
  dataAbertura: string;
  dataEncerramento: string;
  status: "ABERTO" | "ENCERRADO";
  destaque?: boolean;
}
