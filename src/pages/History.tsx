import { LOGO } from "../lib/paths";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Database, Download, Filter, Search } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, SituacaoBadge, Table, TBody, Td, Th, THead, Tr } from "../components/ui";
import { loadHistory } from "../lib/history";
import { normalizeCnpj } from "../lib/cnpj";
import { downloadExcel } from "../lib/spreadsheet";

export default function History() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [items] = useState(loadHistory);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const termCnpj = normalizeCnpj(search);
    return items.filter((i) => {
      const matchSearch = !term || (termCnpj && normalizeCnpj(i.cnpj).includes(termCnpj)) || i.razaoSocial.toLowerCase().includes(term);
      const matchStatus = status === "all" || i.situacaoCadastral.toLowerCase().includes(status);
      return matchSearch && matchStatus;
    });
  }, [items, search, status]);

  const exportar = () => {
    if (filtered.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }
    downloadExcel(
      filtered.map((p) => ({
        CNPJ: p.cnpj,
        "Razão Social": p.razaoSocial,
        "Situação Cadastral": p.situacaoCadastral,
        Bairro: p.bairro,
        "Telefone 1": p.telefone1,
        "Telefone 2": p.telefone2,
        "Consultado em": new Date(p.consultadoEm).toLocaleString("pt-BR"),
      })),
      "Histórico",
      `historico-cnpj-${Date.now()}.xlsx`,
    );
    toast.success("Arquivo Excel baixado com sucesso!");
  };

  return (
    <div className="min-h-screen elegant-gradient">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <Link href="/"><Button variant="ghost" className="mb-4"><ArrowLeft className="h-4 w-4" />Voltar</Button></Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Histórico de Consultas</h1>
              <p className="text-muted-foreground">Visualize e gerencie suas consultas anteriores</p>
              <Link href="/cache"><Button variant="outline" className="mt-3"><Database className="h-4 w-4" />Gerenciar Cache</Button></Link>
            </div>
            <img src={LOGO} alt="Porto Fiscal" className="h-16 w-auto hidden sm:block" />
          </div>
        </div>

        <Card className="mb-6 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />Filtros</CardTitle>
            <CardDescription>Refine sua busca no histórico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="search" placeholder="CNPJ ou Razão Social" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Situação Cadastral</Label>
                <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">Todas</option>
                  <option value="ativa">Ativa</option>
                  <option value="baixada">Baixada</option>
                  <option value="suspensa">Suspensa</option>
                  <option value="inapta">Inapta</option>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={exportar} className="w-full"><Download className="h-4 w-4" />Exportar Excel</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Consultas Realizadas</CardTitle>
            <CardDescription>{filtered.length} registro(s) encontrado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhuma consulta encontrada no histórico</p>
                <Link href="/"><Button>Fazer uma Consulta</Button></Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <THead>
                    <Tr><Th>Data/Hora</Th><Th>CNPJ</Th><Th>Razão Social</Th><Th>Situação</Th><Th>Bairro</Th><Th>Telefone</Th></Tr>
                  </THead>
                  <TBody>
                    {filtered.map((u) => (
                      <Tr key={u.id}>
                        <Td className="text-sm text-muted-foreground whitespace-nowrap">{new Date(u.consultadoEm).toLocaleString("pt-BR")}</Td>
                        <Td className="font-mono whitespace-nowrap">{u.cnpj}</Td>
                        <Td>{u.razaoSocial}</Td>
                        <Td><SituacaoBadge situacao={u.situacaoCadastral} /></Td>
                        <Td>{u.bairro}</Td>
                        <Td className="whitespace-nowrap">{[u.telefone1, u.telefone2].filter(Boolean).join(" / ") || "-"}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
