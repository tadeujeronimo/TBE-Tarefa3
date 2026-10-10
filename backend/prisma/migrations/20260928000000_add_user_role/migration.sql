-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ALUNO', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'ALUNO';
