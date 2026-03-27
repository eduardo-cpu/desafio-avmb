const https = require('https');
const http = require('http');

const args = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

const TOTAL = Number.parseInt(getArg('--total', '100000'), 10);
const BATCH_SIZE = Number.parseInt(getArg('--batch', '500'), 10);
const BASE_URL = getArg('--url', 'http://localhost/api');
const TOKEN = getArg('--token', process.env.JWT_TOKEN || '');
const DELAY_MS = Number.parseInt(getArg('--delay', '75'), 10);
const MAX_RETRIES = Number.parseInt(getArg('--retries', '2'), 10);
const POLL_MS = Number.parseInt(getArg('--poll', '250'), 10);
const MAX_POLL_ATTEMPTS = Number.parseInt(getArg('--max-polls', '1200'), 10);
const OFFSET = Number.parseInt(getArg('--offset', '0'), 10);

if (!TOKEN) {
  console.error('Informe o token JWT: --token <jwt> ou JWT_TOKEN=<jwt>');
  process.exit(1);
}

if (!Number.isInteger(BATCH_SIZE) || BATCH_SIZE <= 0) {
  console.error('--batch deve ser um numero inteiro positivo');
  process.exit(1);
}

if (!Number.isInteger(DELAY_MS) || DELAY_MS < 0) {
  console.error('--delay deve ser um numero inteiro >= 0');
  process.exit(1);
}

if (!Number.isInteger(MAX_RETRIES) || MAX_RETRIES < 0) {
  console.error('--retries deve ser um numero inteiro >= 0');
  process.exit(1);
}

if (!Number.isInteger(POLL_MS) || POLL_MS <= 0) {
  console.error('--poll deve ser um numero inteiro > 0');
  process.exit(1);
}

if (!Number.isInteger(MAX_POLL_ATTEMPTS) || MAX_POLL_ATTEMPTS <= 0) {
  console.error('--max-polls deve ser um numero inteiro > 0');
  process.exit(1);
}

if (!Number.isInteger(OFFSET) || OFFSET < 0) {
  console.error('--offset deve ser um numero inteiro >= 0');
  process.exit(1);
}

function gerarCpf(seed) {
  const base = String(seed).padStart(9, '110000000').slice(-9);
  const d = base.split('').map(Number);
  let s1 = d.reduce((a, v, i) => a + v * (10 - i), 0);
  let d1 = (s1 * 10) % 11;
  if (d1 >= 10) d1 = 0;
  let s2 = [...d, d1].reduce((a, v, i) => a + v * (11 - i), 0);
  let d2 = (s2 * 10) % 11;
  if (d2 >= 10) d2 = 0;
  return base + d1 + d2;
}

function gerarAluno(i) {
  return {
    nome: `Aluno Load Test ${i}`,
    cpf: gerarCpf(i + 100000000),
    dt_nascimento: '1990-01-01',
    url_callback: 'https://webhook.site/load-test',
    curso: {
      nome: `Curso Load Test ${Math.floor(i / 1000)}`,
      codigo: `LOAD-${String(Math.floor(i / 1000)).padStart(4, '0')}`,
      dt_inicio: '2025-01-01',
      dt_fim: '2025-12-31',
      docente: 'Prof. Load Test',
    },
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(url, payload, token, method = 'POST') {
  return new Promise((resolve, reject) => {
    const body = payload === null ? '' : JSON.stringify(payload);
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      },
    );
    req.on('error', reject);
    if (method !== 'GET') {
      req.write(body);
    }
    req.end();
  });
}

async function requestWithRetry(url, payload, token, method = 'POST') {
  let lastError;

  for (let tentativa = 0; tentativa <= MAX_RETRIES; tentativa++) {
    try {
      const res = await requestJson(url, payload, token, method);
      if (res.status < 500 && res.status !== 429) {
        return res;
      }

      lastError = new Error(`status ${res.status}`);
      if (tentativa < MAX_RETRIES) {
        await sleep(200 * (tentativa + 1));
      }
    } catch (err) {
      lastError = err;
      if (tentativa < MAX_RETRIES) {
        await sleep(200 * (tentativa + 1));
      }
    }
  }

  throw lastError;
}

async function waitImportCompletion(rootUrl, statusUrl, token) {
  const fullStatusUrl = `${rootUrl}${statusUrl}`;

  for (let tentativa = 1; tentativa <= MAX_POLL_ATTEMPTS; tentativa++) {
    const res = await requestWithRetry(fullStatusUrl, null, token, 'GET');

    if (res.status === 200 && res.body?.data) {
      const data = res.body.data;
      if (data.status === 'completed' || data.status === 'failed') {
        return data;
      }
    }

    await sleep(POLL_MS);
  }

  throw new Error('Timeout aguardando conclusao da importacao em fila');
}

async function main() {
  const apiBase = BASE_URL.replace(/\/$/, '');
  const rootUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

  console.log(`\nLoad test: ${TOTAL} alunos em lotes de ${BATCH_SIZE} com delay de ${DELAY_MS}ms e offset ${OFFSET} | ${apiBase}/alunos/import\n`);

  if (BATCH_SIZE > 1000) {
    console.warn('Aviso: lotes acima de 1000 podem causar alta carga no backend.');
  }

  let importados = 0;
  let erros = 0;
  let batches = 0;
  const inicio = Date.now();

  for (let i = 0; i < TOTAL; i += BATCH_SIZE) {
    const lote = Array.from({ length: Math.min(BATCH_SIZE, TOTAL - i) }, (_, j) => gerarAluno(OFFSET + i + j));

    const t0 = Date.now();
    batches++;

    try {
      const res = await requestWithRetry(`${apiBase}/alunos/import`, lote, TOKEN, 'POST');

      if (res.status === 202 && res.body?.statusUrl) {
        const statusData = await waitImportCompletion(rootUrl, res.body.statusUrl, TOKEN);

        importados += statusData.importados ?? 0;
        erros += statusData.erros ?? 0;

        process.stdout.write(
          `\r  Lote ${String(batches).padStart(4)} | ${String(importados).padStart(6)} importados | ${String(erros).padStart(4)} erros | ${Date.now() - t0}ms   `,
        );
      } else if (res.status === 201 || res.status === 200) {
        importados += res.body.importados ?? 0;
        erros += res.body.erros?.length ?? 0;

        process.stdout.write(
          `\r  Lote ${String(batches).padStart(4)} | ${String(importados).padStart(6)} importados | ${String(erros).padStart(4)} erros | ${Date.now() - t0}ms   `,
        );
      } else {
        console.error(
          `\nLote ${batches} falhou: status ${res.status} - ${JSON.stringify(res.body).slice(0, 120)}`,
        );
        erros += lote.length;
      }
    } catch (e) {
      console.error(`\nLote ${batches} erro de rede: ${e.message}`);
      erros += lote.length;
    }

    if (DELAY_MS > 0 && i + BATCH_SIZE < TOTAL) {
      await sleep(DELAY_MS);
    }
  }

  const total = Date.now() - inicio;
  console.log(`\n\nConcluido em ${(total / 1000).toFixed(2)}s`);
  console.log(`  Importados: ${importados}`);
  console.log(`  Erros:      ${erros}`);
  console.log(`  Throughput: ${(importados / (total / 1000)).toFixed(0)} alunos/s\n`);
}

main().catch(console.error);
