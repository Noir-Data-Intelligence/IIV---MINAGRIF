## Objectivo
Integrar o módulo de **Missões** com o motor BPM, adicionando submissão para aprovação, geração de Guia de Marcha em PDF e Prestação de Contas (relatório + despesas vs. orçamento).

## 1. Base de dados (migração)
- Adicionar `process_id uuid` (FK→`processes`) à tabela `missions` para ligar a missão ao processo BPM.
- Adicionar `report_url text` em `mission_reports` (anexo do relatório final).
- Seed do tipo de processo **"Missão de Serviço"** em `process_types` + 4 passos em `process_type_steps`:
  1. Validação do Chefe de Departamento (gestor, 2 dias)
  2. Aprovação Financeira (gestor, 2 dias)
  3. Aprovação da Direcção (diretor, 3 dias)
  4. Emissão de Guia de Marcha (admin, 1 dia)
- Trigger `sync_mission_status_from_process()`: quando o processo passa a `concluido`, actualiza `missions.status='aprovada'`; se `cancelado`, missão volta a `planeada`.
- Bucket de storage: reutilizar `documents` (privado) com prefixo `missions/{mission_id}/` para recibos e relatório. Políticas RLS: leitura por participantes/gestor/admin; escrita pelo criador da missão e participantes.

## 2. UI — `src/pages/admin/Missoes.tsx`
Refactor da página para layout master-detail (lista + drawer/dialog com tabs):

**Tabs no detalhe da missão:**
1. **Resumo** — campos actuais + botão **"Submeter para aprovação"** (visível se `status='planeada'` e sem `process_id`). Cria processo BPM usando a mesma lógica de `OpenProcessButton` (`linked_entity_type='mission'`), guarda `process_id` na missão, muda `status` para `submetida` localmente, abre link **"Ver processo BPM"**.
2. **Participantes** — CRUD simples sobre `mission_participants` (selector de utilizador, papel, per_diem).
3. **Guia de Marcha** — formulário sobre `mission_guides` (número, data de emissão, per_diem, transporte, notas) + botão **"Gerar PDF"** usando `jsPDF + autotable` com cabeçalho IIV, dados da missão, participantes e per_diems. Download directo no browser; opcionalmente guardar em `documents/missions/{id}/guia-{numero}.pdf`. Bloqueado se missão não estiver `aprovada`.
4. **Prestação de Contas** com 2 sub-secções:
   - **Relatório**: upload de PDF/Doc para `mission_reports.report_url`, campo `summary`, `outcomes`, botão **"Submeter relatório"** (`status='submetido'`); diretor/admin aprova/rejeita.
   - **Despesas vs Orçamento**: tabela `mission_expenses` (categoria, descrição, valor, data, upload de recibo). Cartões KPI no topo: Orçamento, Total Gasto, Saldo, % Execução (Recharts `Progress`/barra). Aviso visual quando >100%.
5. **Processo BPM** — embed compacto (estado actual, passo, próximo responsável) ligando ao detalhe completo em `/admin/processos/:id`.

## 3. Notificações & Auditoria
- Ao submeter missão: `notifications` para responsáveis do 1º passo BPM + `activity_logs` (`action='mission_submitted'`).
- Ao aprovar processo BPM: notificação ao criador da missão + log.
- Ao submeter relatório: notificação ao diretor.

## 4. Permissões
- `canWrite('missoes')`: cria/edita missão e despesas próprias.
- `gestor`/`diretor`: aprovação via BPM (já tratado pelas políticas existentes em `processes/process_steps`).
- `admin`: tudo.

## 5. Verificação
- Build limpo.
- Browser test (Playwright) com utilizador `gestor@iiv.demo`: criar missão → submeter → confirmar criação de processo BPM + KPI actualizados → gerar PDF da guia → adicionar despesa → verificar barra de execução.

## Ficheiros a tocar
- `supabase/migrations/<timestamp>_missions_bpm_integration.sql` (novo)
- `src/pages/admin/Missoes.tsx` (refactor extenso)
- `src/components/admin/missions/MissionDetail.tsx` (novo, partir o ficheiro)
- `src/components/admin/missions/GuiaMarchaPDF.ts` (novo, gerador jsPDF)
- `src/components/admin/missions/AccountabilityTab.tsx` (novo)
- `src/integrations/supabase/types.ts` (regenerado após migração)
