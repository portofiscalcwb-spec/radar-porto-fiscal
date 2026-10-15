import { LOGO } from "../lib/paths";
import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Bell, BellRing, CheckCircle2, Download, FileSpreadsheet, History, Loader2, Search, Share2, XCircle } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Progress, SituacaoBadge, Table, TBody, Td, Th, THead, Tr } from "../components/ui";
import { formatCnpj, isError, queryCnpj, type CnpjOutcome, type CnpjResult } from "../lib/cnpj";
import { addToHistory } from "../lib/history";
import { downloadExcel, readCnpjsFromFile } from "../lib/spreadsheet";
import { useNotifications } from "../lib/notifications";

const BATCH_CONCURRENCY = 4;

const phones = (r: CnpjResult) => [r.telefone1, r.telefone2].filter(Boolean).join(" / ");

export default function Home() {
  const notifications = useNotifications();
  const [cnpj, setCnpj] = useState("");
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [results, setResults] = useState<CnpjOutcome[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const consultar = async () => {
    if (!cnpj.trim()) {
      toast.error("Digite um CNPJ válido");
      return;
    }
    setLoading(true);
    try {
      const r = await queryCnpj(cnpj);
      setResults([r]);
      addToHistory([r]);
      toast.success("CNPJ consultado com sucesso!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cnpjs = await readCnpjsFromFile(file);
      if (cnpjs.length === 0) {
        toast.error("Nenhum CNPJ encontrado no arquivo");
        return;
      }
      setBatchRunning(true);
      setResults([]);
      // Algumas consultas em paralelo; os resultados ficam na ordem do arquivo.
      const out: CnpjOutcome[] = new Array(cnpjs.length);
      let next = 0;
      let done = 0;
      const worker = async () => {
        while (next < cnpjs.length) {
          const i = next++;
          try {
            out[i] = await queryCnpj(cnpjs[i]);
          } catch (err) {
            out[i] = { cnpj: formatCnpj(cnpjs[i]), error: (err as Error).message || "Erro ao consultar CNPJ" };
          }
          done++;
          setProgress({ current: done, total: cnpjs.length });
          setResults(out.filter(Boolean));
        }
      };
      setProgress({ current: 0, total: cnpjs.length });
      await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, cnpjs.length) }, worker));
      const ok = out.filter((r): r is CnpjResult => !isError(r));
      addToHistory(ok);
      toast.success(`${out.length} CNPJs processados!`);
      notifications.send("Consulta Concluída!", `${out.length} CNPJs processados, ${ok.length} com sucesso.`);
    } catch (err) {
      toast.error((err as Error).message || "Erro ao processar arquivo");
    } finally {
      setBatchRunning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const baixarExcel = () => {
    if (results.length === 0) {
      toast.error("Nenhum resultado para exportar");
      return;
    }
    const rows = results.map((r) =>
      isError(r)
        ? { CNPJ: r.cnpj, "Razão Social": "ERRO", "Situação Cadastral": r.error, Bairro: "", "Telefone 1": "", "Telefone 2": "" }
        : { CNPJ: r.cnpj, "Razão Social": r.razaoSocial, "Situação Cadastral": r.situacaoCadastral, Bairro: r.bairro, "Telefone 1": r.telefone1, "Telefone 2": r.telefone2 },
    );
    downloadExcel(rows, "Resultados", `consulta-cnpj-${Date.now()}.xlsx`);
    toast.success("Arquivo Excel baixado com sucesso!");
  };

  const compartilhar = async (r: CnpjResult) => {
    const text = `📊 *Consulta CNPJ - Radar Porto Fiscal*

🏢 *Razão Social:* ${r.razaoSocial}
💼 *CNPJ:* ${r.cnpj}
✅ *Situação:* ${r.situacaoCadastral}
📍 *Bairro:* ${r.bairro}
📞 *Telefone:* ${phones(r) || "Não informado"}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Consulta CNPJ - ${r.razaoSocial}`, text });
        toast.success("Compartilhado com sucesso!");
      } catch (err) {
        if ((err as Error).name !== "AbortError") toast.error("Erro ao compartilhar");
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("Texto copiado para a área de transferência!");
      } catch {
        toast.error("Navegador não suporta compartilhamento");
      }
    }
  };

  const pct = progress.total ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="min-h-screen elegant-gradient">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 text-center">
          <img src={LOGO} alt="Porto Fiscal" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-foreground mb-2">Radar Porto Fiscal</h1>
          <p className="text-muted-foreground">Consulte dados empresariais de forma rápida e confiável</p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <Link href="/historico">
              <Button variant="outline"><History className="h-4 w-4" />Ver Histórico</Button>
            </Link>
            {notifications.supported &&
              (notifications.permission === "granted" ? (
                <Button variant="outline" disabled><BellRing className="h-4 w-4" />Notificações Ativas</Button>
              ) : (
                <Button variant="outline" onClick={notifications.request}><Bell className="h-4 w-4" />Ativar Notificações</Button>
              ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid w-full grid-cols-2 mb-6 rounded-lg bg-muted p-1">
            {([["single", "Consulta Individual", Search], ["batch", "Consulta em Lote", FileSpreadsheet]] as const).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition cursor-pointer ${tab === value ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </div>

          {tab === "single" ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Consulta Individual</CardTitle>
                <CardDescription>Digite um CNPJ para consultar seus dados cadastrais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    maxLength={18}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && consultar()}
                  />
                  <Button onClick={consultar} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    Consultar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Consulta em Lote</CardTitle>
                <CardDescription>Faça upload de um arquivo Excel (.xlsx, .xls) ou CSV (.csv) com uma coluna "CNPJ"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo Excel ou CSV</Label>
                  <Input id="file" type="file" accept=".xlsx,.xls,.csv" ref={fileRef} onChange={onFile} disabled={batchRunning} />
                </div>
                {batchRunning && (
                  <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between text-sm font-medium text-primary">
                      <span>Processando CNPJs...</span>
                      <span className="font-semibold">{progress.current} de {progress.total}</span>
                    </div>
                    <Progress value={pct} className="h-3" />
                    <div className="text-center text-xs text-muted-foreground">{Math.round(pct)}% concluído</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {results.length > 0 && (
            <Card className="mt-6 glass-card">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription>{results.length} registro(s) encontrado(s)</CardDescription>
                  </div>
                  <Button variant="outline" onClick={baixarExcel}><Download className="h-4 w-4" />Baixar Excel</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <THead>
                      <Tr>
                        <Th>Status</Th><Th>CNPJ</Th><Th>Razão Social</Th><Th>Situação</Th><Th>Bairro</Th><Th>Telefone</Th>
                        <Th className="text-center">Ações</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {results.map((r, i) => (
                        <Tr key={i}>
                          <Td>{isError(r) ? <XCircle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-accent" />}</Td>
                          <Td className="font-mono whitespace-nowrap">{r.cnpj}</Td>
                          <Td>{isError(r) ? <span className="text-destructive text-sm">{r.error}</span> : r.razaoSocial}</Td>
                          <Td>{isError(r) ? "-" : <SituacaoBadge situacao={r.situacaoCadastral} />}</Td>
                          <Td>{isError(r) ? "-" : r.bairro}</Td>
                          <Td className="whitespace-nowrap">{isError(r) ? "-" : phones(r) || "-"}</Td>
                          <Td className="text-center">
                            {!isError(r) && (
                              <Button variant="ghost" size="sm" onClick={() => compartilhar(r)}><Share2 className="h-4 w-4" />Compartilhar</Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
