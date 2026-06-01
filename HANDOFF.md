# Handoff — SIXT Pricing Simulator

## Ficheiros
- **App:** `C:\Users\andre\Desktop\SIXT_Pricing_Simulator\app.py`
- **Matriz original:** `C:\Users\andre\Desktop\Matrix-11.05.2026 - PT.xlsx`
- **Arrancar:** `python -m streamlit run "C:\Users\andre\Desktop\SIXT_Pricing_Simulator\app.py"`

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
6. **Piso mínimo TG** = 8 € c/IVA (configurável). Concorrência (Avis, Europcar, Guerin, Hertz) tem entre 8–18 €

## Parâmetros configuráveis (sidebar)
| Secção | Parâmetros |
|---|---|
| Seleção | Grupo ACRISS, Dias, IVA % |
| SMART+ | Desconto balcão %, Desconto online %, Distribuição BF/BQ % |
| Pack Easy | Desconto balcão %, Margem mín (€), Margem máx (€) |
| Piso TG | TG mínimo c/IVA (€) — default 8,00 € |
| Avançado | Extra online AI vs balcão % |

## Tabs
1. **Simulador** — KPIs por pacote, rule checks, gráfico, tabela detalhe
2. **Optimizador Global** — encontra intervalo de desconto AI válido para todos os grupos×LOR simultaneamente (botão)
3. **Exportar**:
   - Exportação analítica (5 abas Excel: Resumo_Final, SMART+, All_Inclusive, Pack_Easy, Parametros) — botão-triggered para não congelar
   - **Nova Matriz formato SIXT** — gera ficheiro no formato exacto da matriz original com BF/TG/BQ actualizados, células alteradas a amarelo, metadados actualizados. Testado: 1 300 células alteradas (BF: 570, TG: 160, BQ: 570). Campo de e-mail para Alemanha configurável
4. **Técnico** — debug, dados carregados, JSON raw

## Bugs já corrigidos
- `ArrowInvalid` na coluna "Valor" (tipos mistos) → `.astype(str)` no df_parameters
- Computação pesada no Export a correr em cada re-render → movida para botão
- `use_container_width` deprecated → removido dos dataframes/botões
- Encoding UTF-8 no Windows → `# -*- coding: utf-8 -*-` no topo

## Funções principais
- `calculate_pricing(...)` — motor principal, aceita `tg_min_iva`
- `build_all_groups_lor_export(...)` — todos grupos × 6 LOR para Excel analítico
- `generate_sixt_matrix(...)` — nova matriz no formato original SIXT
- `optimize_global_discounts(...)` — solver global
- `build_matrix_data_from_excel(file_bytes, sheet_name)` — parser da matriz
