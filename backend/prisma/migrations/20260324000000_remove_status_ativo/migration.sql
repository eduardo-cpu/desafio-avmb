-- Remover valor ATIVO do enum AlunoStatus
ALTER TYPE "AlunoStatus" RENAME TO "AlunoStatus_old";
CREATE TYPE "AlunoStatus" AS ENUM ('PENDENTE', 'CERTIFICADO', 'CANCELADO');
ALTER TABLE "alunos" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "alunos" ALTER COLUMN "status" TYPE "AlunoStatus" USING ("status"::text::"AlunoStatus");
ALTER TABLE "alunos" ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
DROP TYPE "AlunoStatus_old";
