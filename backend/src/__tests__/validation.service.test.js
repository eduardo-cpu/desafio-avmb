import { describe, test, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { validarCpf, validarAluno } = require("../services/validation.service");

// ─── Payload base válido para reutilizar nos testes ──────────────────────────
const alunoValido = {
  nome: "Eduardo Santos",
  cpf: "529.982.247-25",
  dt_nascimento: "2000-01-15",
  url_callback: "https://webhook.site/teste",
  curso: {
    nome: "Desenvolvimento Web",
    codigo: "DEV-001",
    dt_inicio: "2024-01-01",
    dt_fim: "2024-06-30",
    docente: "Prof. Carlos",
  },
};

// ─── validarCpf ──────────────────────────────────────────────────────────────
describe("validarCpf", () => {
  test("aceita CPF válido sem formatação", () => {
    expect(validarCpf("52998224725")).toBe(true);
  });

  test("aceita outro CPF válido", () => {
    expect(validarCpf("11144477735")).toBe(true);
  });

  test("rejeita CPF com todos os dígitos iguais", () => {
    expect(validarCpf("00000000000")).toBe(false);
    expect(validarCpf("11111111111")).toBe(false);
  });

  test("rejeita CPF com comprimento errado", () => {
    expect(validarCpf("1234567890")).toBe(false); // 10 dígitos
    expect(validarCpf("123456789012")).toBe(false); // 12 dígitos
  });

  test("rejeita CPF com dígito verificador inválido", () => {
    expect(validarCpf("52998224724")).toBe(false); // último dígito trocado
    expect(validarCpf("52998224715")).toBe(false); // penúltimo dígito trocado
  });

  test("remove máscara antes de validar", () => {
    expect(validarCpf("529.982.247-25")).toBe(true);
  });
});

// ─── validarAluno ─────────────────────────────────────────────────────────────
describe("validarAluno", () => {
  test("retorna valido=true para payload correto", () => {
    const { valido, erros } = validarAluno(alunoValido);
    expect(valido).toBe(true);
    expect(erros).toHaveLength(0);
  });

  test("retorna valido=false quando nome está ausente", () => {
    const { nome, ...semNome } = alunoValido;
    const { valido, erros } = validarAluno(semNome);
    expect(valido).toBe(false);
    expect(erros.some((e) => e.campo === "nome")).toBe(true);
  });

  test("retorna valido=false quando cpf está ausente", () => {
    const { cpf, ...semCpf } = alunoValido;
    const { valido, erros } = validarAluno(semCpf);
    expect(valido).toBe(false);
    expect(erros.some((e) => e.campo === "cpf")).toBe(true);
  });

  test("retorna valido=false para CPF com formato inválido", () => {
    const { valido, erros } = validarAluno({
      ...alunoValido,
      cpf: "abc-invalido",
    });
    expect(valido).toBe(false);
    expect(erros.some((e) => e.campo === "cpf")).toBe(true);
  });

  test("retorna valido=false quando curso está ausente", () => {
    const { curso, ...semCurso } = alunoValido;
    const { valido, erros } = validarAluno(semCurso);
    expect(valido).toBe(false);
    expect(erros.some((e) => e.campo === "curso")).toBe(true);
  });

  test("retorna valido=false para data de nascimento fora do formato ISO", () => {
    const { valido, erros } = validarAluno({
      ...alunoValido,
      dt_nascimento: "15/01/2000",
    });
    expect(valido).toBe(false);
  });

  test("retorna valido=false para data de início do curso inválida", () => {
    const payload = {
      ...alunoValido,
      curso: { ...alunoValido.curso, dt_inicio: "99-99-9999" },
    };
    const { valido } = validarAluno(payload);
    expect(valido).toBe(false);
  });

  test("aceita aluno sem dt_nascimento (campo opcional)", () => {
    const { dt_nascimento, ...semData } = alunoValido;
    const { valido } = validarAluno(semData);
    expect(valido).toBe(true);
  });
});
