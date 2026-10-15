import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Database, HardDrive, Trash2, TrendingUp } from "lucide-react";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, SituacaoBadge, Table, TBody, Td, Th, THead, Tr } from "../components/ui";
import { clearHistory, historySize, loadHistory, removeFromHistory } from "../lib/history";

export default function CacheManagement() {
  const [items, setItems] = useState(loadHistory);
  const reload = () => setItems(loadHistory());

  const stats = useMemo(() => {
    const active = items.filter((i) => i.situacaoCadastral.toUpperCase() === "ATIVA").length;
    const counts = new Map<string, number>();
    items.forEach((i) => counts.set(i.cnpj, (counts.get(i.cnpj) ?? 0) + 1));
    const mostQueried = [...counts.entries()]
      .map(([cnpj, count]) => ({ cnpj, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { total: items.length, size: historySize(), active, inactive: items.length - active, mostQueried };
  }, [items]);

  const limparTudo = () => {
    if (!confirm("Tem certeza que deseja limpar todo o cache? Esta ação não pode ser desfeita.")) return;
    clearHistory();
    reload();
    toast.success("Cache limpo com sucesso!");
  };

  const remover = (id: number) => {
    removeFromHistory(id);
    reload();
    toast.success("Item removido do cache");
  };

  const statCards = [
    { label: "Total de Consultas", value: stats.total, cls: "text-3xl font-bold text-primary" },
    { label: "Espaço Ocupado", value: stats.size, cls: "text-2xl font-bold", icon: true },
    { label: "CNPJs Ativos", value: stats.active, cls: "text-3xl font-bold text-accent" },
    { label: "CNPJs Inativos", value: stats.inactive, cls: "text-3xl font-bold text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen elegant-gradient">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <Link href="/historico"><Button variant="ghost" className="mb-4"><ArrowLeft className="h-4 w-4" />Voltar ao Histórico</Button></Link>
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Gerenciamento de Cache</h1>
          </div>
          <p className="text-muted-foreground">Visualize e gerencie os dados armazenados localmente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((s) => (
            <Card key={s.label} className="glass-card">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {s.icon && <HardDrive className="h-5 w-5 text-muted-foreground" />}
                  <div className={s.cls}>{s.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats.mostQueried.length > 0 && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /><CardTitle>CNPJs Mais Consultados</CardTitle></div>
              <CardDescription>Top 5 CNPJs com mais consultas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.mostQueried.map((m, i) => (
                  <div key={m.cnpj} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{i + 1}º</Badge>
                      <span className="font-mono font-medium">{m.cnpj}</span>
                    </div>
                    <Badge>{m.count} consulta{m.count > 1 ? "s" : ""}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle>Consultas Armazenadas</CardTitle>
                <CardDescription>{items.length} item(ns) no cache local</CardDescription>
              </div>
              {items.length > 0 && (
                <Button variant="destructive" onClick={limparTudo}><Trash2 className="h-4 w-4" />Limpar Todo Cache</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum dado em cache</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <THead>
                    <Tr><Th>CNPJ</Th><Th>Razão Social</Th><Th>Situação</Th><Th>Data</Th><Th className="text-center">Ações</Th></Tr>
                  </THead>
                  <TBody>
                    {items.map((u) => (
                      <Tr key={u.id}>
                        <Td className="font-mono whitespace-nowrap">{u.cnpj}</Td>
                        <Td>{u.razaoSocial}</Td>
                        <Td><SituacaoBadge situacao={u.situacaoCadastral} /></Td>
                        <Td className="whitespace-nowrap">{new Date(u.consultadoEm).toLocaleString("pt-BR")}</Td>
                        <Td className="text-center">
                          <Button variant="ghost" size="sm" onClick={() => remover(u.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />Remover
                          </Button>
                        </Td>
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
