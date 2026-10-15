export type CnpjResult = {
  cnpj: string;
  razaoSocial: string;
  situacaoCadastral: string;
  bairro: string;
  telefone1: string;
  telefone2: string;
  apiSource: "minhareceita" | "brasilapi";
};

export type CnpjError = { cnpj: string; error: string };

export type CnpjOutcome = CnpjResult | CnpjError;

export const isError = (r: CnpjOutcome): r is CnpjError => "error" in r;

/** Mantém só números e letras, em maiúsculas (o CNPJ alfanumérico vale desde jul/2026). */
export function normalizeCnpj(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

export function formatCnpj(value: string): string {
  const v = normalizeCnpj(value).slice(0, 14);
  if (v.length > 12) return v.replace(/^(.{2})(.{3})(.{3})(.{4})(.{1,2})$/, "$1.$2.$3/$4-$5");
  if (v.length > 8) return v.replace(/^(.{2})(.{3})(.{3})(.{1,4})$/, "$1.$2.$3/$4");
  if (v.length > 5) return v.replace(/^(.{2})(.{3})(.{1,3})$/, "$1.$2.$3");
  if (v.length > 2) return v.replace(/^(.{2})(.{1,3})$/, "$1.$2");
  return v;
}

/** Valida os dígitos verificadores (regra da Receita, aceita o formato alfanumérico). */
export function isValidCnpj(value: string): boolean {
  const v = normalizeCnpj(value);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(v)) return false;
  if (/^(\d)\1{13}$/.test(v)) return false;
  const values = [...v].map((c) => c.charCodeAt(0) - 48);
  const dv = (len: number) => {
    let sum = 0;
    let weight = len - 7;
    for (let i = 0; i < len; i++) {
      sum += values[i] * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return dv(12) === values[12] && dv(13) === values[13];
}

export function formatPhone(value: string | null | undefined): string {
  const d = (value ?? "").replace(/\D/g, "");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  return d;
}

class NotFoundError extends Error {}

type ApiPayload = {
  razao_social?: string;
  descricao_situacao_cadastral?: string;
  bairro?: string;
  ddd_telefone_1?: string | null;
  ddd_telefone_2?: string | null;
};

const SOURCES: { name: CnpjResult["apiSource"]; url: (cnpj: string) => string }[] = [
  { name: "minhareceita", url: (c) => `https://minhareceita.org/${c}` },
  { name: "brasilapi", url: (c) => `https://brasilapi.com.br/api/cnpj/v1/${c}` },
];

/** Fonte que falhou fica em segundo plano por um tempo, para o lote não esperar por ela a cada CNPJ. */
const COOLDOWN_MS = 30_000;
const TIMEOUT_MS = 10_000;
const cooldownUntil = new Map<string, number>();

const orderedSources = () => {
  const now = Date.now();
  return [...SOURCES].sort((a, b) => Number((cooldownUntil.get(a.name) ?? 0) > now) - Number((cooldownUntil.get(b.name) ?? 0) > now));
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchFrom(source: (typeof SOURCES)[number], cnpj: string): Promise<CnpjResult> {
  const res = await fetch(source.url(cnpj), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 404) throw new NotFoundError("CNPJ não encontrado na base da Receita");
  if (!res.ok) throw new Error(`Serviço ${source.name} respondeu ${res.status}`);
  const data = (await res.json()) as ApiPayload;
  return {
    cnpj: formatCnpj(cnpj),
    razaoSocial: data.razao_social ?? "",
    situacaoCadastral: data.descricao_situacao_cadastral ?? "",
    bairro: data.bairro ?? "",
    telefone1: formatPhone(data.ddd_telefone_1),
    telefone2: formatPhone(data.ddd_telefone_2),
    apiSource: source.name,
  };
}

/** Consulta a Minha Receita e a BrasilAPI (a que estiver respondendo primeiro), com uma nova tentativa. */
export async function queryCnpj(input: string): Promise<CnpjResult> {
  const cnpj = normalizeCnpj(input);
  if (!isValidCnpj(cnpj)) throw new Error("CNPJ inválido");

  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await sleep(2000);
    for (const source of orderedSources()) {
      try {
        return await fetchFrom(source, cnpj);
      } catch (err) {
        if (err instanceof NotFoundError) throw err;
        cooldownUntil.set(source.name, Date.now() + COOLDOWN_MS);
      }
    }
  }
  throw new Error("Serviço de consulta indisponível. Tente novamente em instantes.");
}
