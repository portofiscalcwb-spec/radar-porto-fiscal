import * as XLSX from "xlsx";
import { normalizeCnpj } from "./cnpj";

/** Lê CSV ou Excel e devolve os CNPJs da coluna cujo cabeçalho contém "CNPJ". */
export async function readCnpjsFromFile(file: File): Promise<string[]> {
  const rows = file.name.toLowerCase().endsWith(".csv") ? await readCsv(file) : await readExcel(file);
  if (rows.length === 0) throw new Error("Arquivo vazio");

  let headerIndex = -1;
  let column = -1;
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const col = rows[i].findIndex((cell) => String(cell ?? "").toLowerCase().includes("cnpj"));
    if (col !== -1) {
      headerIndex = i;
      column = col;
      break;
    }
  }
  if (headerIndex === -1) throw new Error("Não foi possível encontrar a coluna CNPJ no arquivo");

  return rows
    .slice(headerIndex + 1)
    .map((r) => String(r[column] ?? "").trim())
    .filter((v) => !v.includes("*") && normalizeCnpj(v).length === 14);
}

async function readExcel(file: File): Promise<string[][]> {
  const wb = XLSX.read(await file.arrayBuffer());
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: "" });
}

async function readCsv(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder("iso-8859-1").decode(buffer);
  }
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r\n|\r|\n/)
    .filter((l) => l.trim());
  const sample = lines.find((l) => /[;,\t]/.test(l)) ?? "";
  const sep = sample.includes(";") ? ";" : sample.includes("\t") ? "\t" : ",";
  return lines.map((l) => l.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, "")));
}

export function downloadExcel(rows: Record<string, string>[], sheetName: string, fileName: string) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName);
  XLSX.writeFile(wb, fileName);
}
