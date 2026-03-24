-- CreateEnum
CREATE TYPE "AlunoStatus" AS ENUM ('PENDENTE', 'ATIVO', 'CERTIFICADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "instituicoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instituicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "dtInicio" TIMESTAMP(3) NOT NULL,
    "dtFim" TIMESTAMP(3) NOT NULL,
    "docente" TEXT NOT NULL,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "dtNascimento" TIMESTAMP(3),
    "status" "AlunoStatus" NOT NULL DEFAULT 'PENDENTE',
    "hash" TEXT,
    "filePath" TEXT,
    "urlCallback" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instituicaoId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instituicoes_email_key" ON "instituicoes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_hash_key" ON "alunos"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_cpf_cursoId_key" ON "alunos"("cpf", "cursoId");

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "instituicoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
