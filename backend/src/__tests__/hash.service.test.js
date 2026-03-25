import { describe, test, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { gerarHash } = require("../services/hash.service");

const alunoBase = {
  cpf: "52998224725",
  cursoId: "curso-uuid-001",
  instituicaoId: "inst-uuid-001",
  createdAt: new Date("2024-06-01T10:00:00.000Z"),
};

describe("gerarHash", () => {
  test("retorna uma string hexadecimal de 64 caracteres (SHA-256)", () => {
    const hash = gerarHash(alunoBase);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("é determinístico — mesma entrada produz mesmo hash", () => {
    const hash1 = gerarHash(alunoBase);
    const hash2 = gerarHash(alunoBase);
    expect(hash1).toBe(hash2);
  });

  test("entradas diferentes produzem hashes diferentes", () => {
    const hash1 = gerarHash(alunoBase);
    const hash2 = gerarHash({ ...alunoBase, cpf: "11144477735" });
    const hash3 = gerarHash({ ...alunoBase, cursoId: "curso-outro-001" });
    const hash4 = gerarHash({ ...alunoBase, instituicaoId: "inst-outro-001" });

    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).not.toBe(hash4);
  });

  test("a mesma data em objetos distintos produz o mesmo hash", () => {
    const aluno1 = {
      ...alunoBase,
      createdAt: new Date("2024-06-01T10:00:00.000Z"),
    };
    const aluno2 = {
      ...alunoBase,
      createdAt: new Date("2024-06-01T10:00:00.000Z"),
    };
    expect(gerarHash(aluno1)).toBe(gerarHash(aluno2));
  });

  test("datas diferentes produzem hashes diferentes", () => {
    const aluno1 = {
      ...alunoBase,
      createdAt: new Date("2024-06-01T10:00:00.000Z"),
    };
    const aluno2 = {
      ...alunoBase,
      createdAt: new Date("2024-06-02T10:00:00.000Z"),
    };
    expect(gerarHash(aluno1)).not.toBe(gerarHash(aluno2));
  });
});
