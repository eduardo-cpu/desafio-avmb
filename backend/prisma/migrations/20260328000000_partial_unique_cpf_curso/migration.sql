-- Remove the old plain unique constraint (cpf, cursoId) if it still exists
DROP INDEX IF EXISTS "alunos_cpf_cursoId_key";

-- Create a partial unique index: enforce uniqueness only for active records (deletedAt IS NULL)
-- This allows re-importing a student after cancellation
CREATE UNIQUE INDEX "alunos_cpf_curso_active_unique"
  ON "alunos" ("cpf", "cursoId")
  WHERE "deletedAt" IS NULL;
