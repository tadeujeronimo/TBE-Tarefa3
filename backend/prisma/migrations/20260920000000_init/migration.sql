-- CreateEnum
CREATE TYPE "StatusEdital" AS ENUM ('ABERTO', 'ENCERRADO');

-- CreateTable
CREATE TABLE "editais" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "professor" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "vagas" INTEGER NOT NULL,
    "data_abertura" TIMESTAMP(3) NOT NULL,
    "data_encerramento" TIMESTAMP(3) NOT NULL,
    "status" "StatusEdital" NOT NULL DEFAULT 'ABERTO',
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editais_pkey" PRIMARY KEY ("id")
);
