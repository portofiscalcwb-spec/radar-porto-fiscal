import type { CnpjResult } from "./cnpj";

export type HistoryItem = {
  id: number;
  cnpj: string;
  razaoSocial: string;
  situacaoCadastral: string;
  bairro: string;
  telefone1: string;
  telefone2: string;
  consultadoEm: string;
};

const KEY = "cnpj-history";
const LIMIT = 100;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function save(items: HistoryItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (err) {
    console.error("Erro ao salvar histórico:", err);
  }
}

export function addToHistory(results: CnpjResult[]) {
  const now = new Date().toISOString();
  const novos = results.map((r) => ({
    id: Date.now() + Math.random(),
    cnpj: r.cnpj,
    razaoSocial: r.razaoSocial,
    situacaoCadastral: r.situacaoCadastral,
    bairro: r.bairro,
    telefone1: r.telefone1,
    telefone2: r.telefone2,
    consultadoEm: now,
  }));
  save([...novos, ...loadHistory()].slice(0, LIMIT));
}

export function removeFromHistory(id: number) {
  save(loadHistory().filter((i) => i.id !== id));
}

export function clearHistory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* sem acesso ao armazenamento: nada a limpar */
  }
}

export function historySize(): string {
  let raw = "";
  try {
    raw = localStorage.getItem(KEY) ?? "";
  } catch {
    /* ignora */
  }
  const bytes = new Blob([raw]).size;
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
}
