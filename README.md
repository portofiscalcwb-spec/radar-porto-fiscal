# Radar Porto Fiscal

Consulta de CNPJ (individual e em lote), copiada do app feito no Manus
(`cnpjapp-ihiaev24.manus.space`). Roda só no navegador, sem servidor nem login.

## Rodar

```bash
npm install
npm run dev
```

Abre em http://localhost:5173. Para publicar: `npm run build` gera a pasta `dist/`,
que pode ir para qualquer hospedagem estática (Vercel, Netlify, Cloudflare Pages).

## Como funciona

- **Fontes de dados:** Minha Receita (`minhareceita.org`) e BrasilAPI de reserva.
  Se uma fonte falha, o app usa a outra por 30 s (`src/lib/cnpj.ts`).
- **Lote:** CSV (`;`, `,` ou tab) ou Excel; procura a coluna cujo cabeçalho contém
  "CNPJ" (ex.: `CPF/CNPJ`) e ignora CPFs mascarados. 4 consultas em paralelo.
- **Histórico:** fica no navegador (`localStorage`, chave `cnpj-history`, últimas 100).
- **Rotas:** `/` consulta · `/historico` · `/cache`.

## Diferenças em relação ao original

- Excel em lote também acha a coluna `CPF/CNPJ` (o original só lia `CNPJ` exato).
- Lote 4x mais rápido (paralelo) e com fonte reserva.
- Data na tela de cache corrigida (o original mostrava "Invalid Date").
- Aceita o CNPJ alfanumérico (em vigor desde jul/2026) e formata telefones.
