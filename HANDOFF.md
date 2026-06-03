# Handoff — SIXT Pricing Simulator

## Ficheiros
- **App:** `C:\Users\andre\Desktop\SIXT_Pricing_Simulator\app.py`
- **Matriz original:** `C:\Users\andre\Desktop\Matrix-11.05.2026 - PT.xlsx`
- **BD Concorrência:** `C:\Users\andre\Desktop\SIXT_Pricing_Simulator\BD_Pacotes_Concorrentes.xlsx`
- **Arrancar local:** `python -m streamlit run "C:\Users\andre\Desktop\SIXT_Pricing_Simulator\app.py"`
- **Arrancar cloud:** Streamlit Cloud via GitHub `Lage-DataScientist/sixt-pricing-simulator` (branch `main`)

## Stack
Streamlit 1.54 · Pandas · Plotly · openpyxl · xlsxwriter · Python (Anaconda)

---

## O que o app faz
Simulador de pricing para pacotes de proteções SIXT Portugal. Lê uma matriz Excel (`Matrix - DD.MM.YYYY - PT.xlsx`, folha `Matrix - DD.MM.YYYY`) com preços unitários por grupo ACRISS × LOR e calcula novos preços segundo regras de negócio.

## Estrutura da Matriz Excel
- Linhas 1–16: metadados (`gdat`, `vdat`, `wakz=EUR`, `liso=PT`, `chco`, `vont`, `bist`, `cart`, etc.)
- Linhas 17–115: 99 grupos ACRISS (CCCC, CDAR…) × 34 colunas de produtos
- Produtos: LD (6 LOR), BF (6 LOR), TG (6 LOR), BQ (6 LOR), BE (3 LOR), AY, AE, I, BC
- LOR intervals: 1–3 · 4–6 · 7–10 · 11–29 · 30 · 31–999 dias

## BD Concorrência — BD_Pacotes_Concorrentes.xlsx
4 sheets (Hertz, Avis, Guerin, Europcar). Estrutura: row 0 = título, row 1 = header, rows 2+ = dados.
Colunas: `ACRISS Sixt | Modelo | Pacote | Preço | Tipo Cobrança`

**Equivalências de pacotes:**
| Concorrente | Pacote | Equivale a |
|---|---|---|
| Europcar | Medium | SMART+ |
| Europcar | Premium | All Inclusive |
| Guerin | Pack Premium Gold | SMART+ |
| Guerin | Pack Platinum | All Inclusive |
| Guerin | Pack Light Gold | ignorado |
| Avis | Veículo | SMART+ |
| Avis | Veículo Plus | All Inclusive |
| Hertz | SuperCover | All Inclusive |

- 37 grupos ACRISS mapeados · preços em €/dia c/IVA
- Duplicados (mesmo ACRISS, modelos diferentes) → média automática
- Ficheiro está no repo GitHub (removido do .gitignore para funcionar no Streamlit Cloud)
- Parsing em `load_competitor_bd(file_bytes)` — keyword matching robusto a encoding

## Regras de negócio implementadas
1. **LD não muda**
2. **SMART+** = LD + BF + BQ (TG removido). Preço de balcão novo = preço de balcão antigo (com TG). BF e BQ sobem para compensar, distribuídos pelo slider BF%/BQ%
3. **All Inclusive** = BC + LD + BF + BQ + I + TG. LD/BF/BQ = SMART+ novo. TG é a única variável de ajuste (nunca desce)
4. **Pack Easy** = TG + BC — só balcão, sem canal online
5. **Solver AI**: desconto AI calculado automaticamente como ponto médio do intervalo válido [vl, vh] que satisfaz todas as restrições:
   - AI(canal) > SMART+(canal)
   - SMART+(bal) + Easy(bal) > AI(bal), margem ∈ [min€; max€]
   - SMART+(bal) + TG > AI(bal)
   - AI online ≥ AI balcão + X%
6. **Piso mínimo TG** = 8 € c/IVA (configurável)

## Parâmetros configuráveis (sidebar)
| Secção | Parâmetros |
|---|---|
| Fonte de dados | Upload matriz Excel + nome da folha |
| Seleção | Grupo ACRISS, Dias, IVA % |
| SMART+ | Desconto balcão %, Desconto online %, Distribuição BF/BQ % |
| Pack Easy | Desconto balcão %, Margem mín (€), Margem máx (€) |
| Piso TG | TG mínimo c/IVA (€) — default 8,00 € |
| Avançado | Extra online AI vs balcão % |

## Tabs (ordem actual)
1. **📊 Simulador** — KPIs por pacote (SMART+, AI, Pack Easy), rule checks, gráfico de barras, tabela detalhe
2. **💰 Comparação** — preços antigo vs novo por pacote, gráfico comparativo
3. **🏁 Análise Concorrência** — duas secções:
   - **Por grupo ACRISS** (grupo seleccionado na sidebar): preços da BD por concorrente, tabela, gráficos SMART+/AI, cartões de desconto para igualar o mais barato/média/mais caro, zona de conforto competitivo vs solver AI
   - **Por cluster de segmento** (M/E/C/I/F/P/L/S/X): tabela agregada €/dia por cluster × concorrente, gráfico SMART+ por cluster, gráfico AI por cluster — SIXT incluído como linha de referência
4. **🎯 Optimizador Global** — encontra intervalo de desconto AI válido para todos os grupos×LOR simultaneamente (botão)
5. **📥 Exportar**:
   - Exportação analítica (5 abas Excel: Resumo_Final, SMART+, All_Inclusive, Pack_Easy, Parametros)
   - **Nova Matriz formato SIXT** — ficheiro no formato original com BF/TG/BQ actualizados, células a amarelo, metadados actualizados. Campo de e-mail para Alemanha
6. **🔬 Técnico** — debug, dados carregados, JSON raw

## Clusters de segmento
```
M — Minis        E — Económicos   C — Compactos
I — Intermédios  F — Full Size    P — Premium
L — Luxury       S — Standard     X — Extraordinary
```
Definidos pela primeira letra do código ACRISS.

## Funções principais
- `calculate_pricing(...)` — motor principal, aceita `tg_min_iva`
- `load_competitor_bd(file_bytes)` — parser BD concorrência → dict {acriss: {field: preço}}
- `build_all_groups_lor_export(...)` — todos grupos × 6 LOR para Excel analítico
- `generate_sixt_matrix(...)` — nova matriz no formato original SIXT
- `optimize_global_discounts(...)` — solver global
- `build_matrix_data_from_excel(file_bytes, sheet_name)` — parser da matriz SIXT

## Bugs já corrigidos
- `ArrowInvalid` na coluna "Valor" (tipos mistos) → `.astype(str)` no df_parameters
- Computação pesada no Export a correr em cada re-render → movida para botão
- `use_container_width` deprecated → removido dos dataframes/botões
- Encoding UTF-8 no Windows → `# -*- coding: utf-8 -*-` no topo
- BD não encontrada no Streamlit Cloud → path resolution com múltiplos candidatos (`__file__`, `getcwd`, relativo)
- BD excluída do git → removida regra `*.xlsx` do .gitignore, substituída por `Matrix*.xlsx`

## Git / Deploy
- Repo: `https://github.com/Lage-DataScientist/sixt-pricing-simulator`
- Branch principal: `main`
- Último commit relevante: cluster analysis na aba concorrência
- `.gitignore` exclui `Matrix*.xlsx` (matriz de preços SIXT, dados sensíveis) mas inclui `BD_Pacotes_Concorrentes.xlsx`
