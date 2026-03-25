import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const axios = require("axios");
const { dispararWebhook } = require("../services/webhook.service");

const alunoBase = {
  nome: "Eduardo Santos",
  cpf: "52998224725",
  hash: "abc123hash456",
  urlCallback: "https://webhook.site/teste",
};

beforeEach(() => {
  vi.spyOn(axios, "post").mockResolvedValue({ status: 200 });
  process.env.FRONTEND_URL = "http://localhost";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dispararWebhook", () => {
  test("chama axios.post com a URL do aluno", async () => {
    await dispararWebhook(alunoBase);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      alunoBase.urlCallback,
      expect.objectContaining({
        nome: alunoBase.nome,
        cpf: alunoBase.cpf,
        hash: alunoBase.hash,
        validation_code: alunoBase.hash,
      }),
      expect.objectContaining({ timeout: 5000 }),
    );
  });

  test("inclui url_consulta apontando para o frontend", async () => {
    await dispararWebhook(alunoBase);

    const payload = axios.post.mock.calls[0][1];
    expect(payload.url_consulta).toBe(
      `http://localhost/validar/${alunoBase.hash}`,
    );
  });

  test("não lança erro quando o webhook falha", async () => {
    axios.post.mockRejectedValueOnce(new Error("Connection refused"));

    await expect(dispararWebhook(alunoBase)).resolves.not.toThrow();
  });

  test("não lança erro quando o webhook retorna status 500", async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 500 } });

    await expect(dispararWebhook(alunoBase)).resolves.not.toThrow();
  });
});
