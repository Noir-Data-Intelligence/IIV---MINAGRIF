/**
 * DTOs do módulo Stock Integrado — contrato REST de 3 recursos relacionados que
 * modelam o inventário unificado do IIV (Instituto de Investigação Veterinária):
 *
 *  - `StockLocationDto` — localização de armazém (onde o stock é guardado)
 *  - `StockItemDto`     — item de stock (referido por `locationId` -> localização)
 *  - `StockMovementDto` — movimento de stock (entrada/saída/transferência/ajuste;
 *                         referido por `itemId` -> item, `fromLocationId`/
 *                         `toLocationId` -> localizações)
 *
 * Espelham as tabelas Supabase originais (`stock_locations`, `stock_items`,
 * `stock_movements`) já convertidas para camelCase, tal como o backend Laravel as
 * devolverá via API Resources (min_stock -> minStock, location_id -> locationId,
 * expiry_date -> expiryDate, unit_cost -> unitCost, from_location_id ->
 * fromLocationId, etc). A (de)serialização, quando necessária, faz-se na camada
 * de serviço.
 *
 * Domínio coeso e fortemente relacionado (item -> localização; movimento -> item
 * + localizações), por isso agrupam-se num único ficheiro por camada, à
 * semelhança de `financeiro.ts` e `missoes.ts`.
 */

/** Categoria de um item de stock. */
export type StockCategory =
  | "laboratorio"
  | "vacinas"
  | "agricola"
  | "pecuaria"
  | "administrativo"
  | "semen"
  | "combustivel";

/** Tipo de um movimento de stock. */
export type MovementType = "entrada" | "saida" | "transferencia" | "ajuste";

// --- Localização ------------------------------------------------------------

/** Localização de armazém onde o stock é guardado. */
export interface StockLocationDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

// --- Item -------------------------------------------------------------------

/** Item de stock (reagente, vacina, insumo, combustível, etc). */
export interface StockItemDto {
  id: string;
  name: string;
  category: StockCategory;
  sku: string | null;
  unit: string;
  quantity: number;
  minStock: number;
  locationId: string | null;
  expiryDate: string | null;
  supplier: string | null;
  unitCost: number | null;
  notes: string | null;
  createdAt: string;
}

// --- Movimento --------------------------------------------------------------

/** Movimento de stock (entrada/saída/transferência/ajuste). */
export interface StockMovementDto {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  fromLocationId: string | null;
  toLocationId: string | null;
  reason: string | null;
  performedBy: string | null;
  movementDate: string;
  createdAt: string;
}

// --- Regra de negócio partilhada -------------------------------------------

/**
 * Predicado "stock crítico" — verdade quando a quantidade em mão está ABAIXO do
 * stock mínimo definido para o item (`quantity < minStock`).
 *
 * Fonte ÚNICA desta comparação: usada pelo KPI "itens abaixo do mínimo" da
 * página Stock e reutilizada pelo alerta "Stock Crítico" do Dashboard (migrado a
 * seguir). Mantida aqui, ao lado do DTO, para não divergir entre os dois locais.
 * Itens sem mínimo definido (`minStock <= 0`) nunca são considerados críticos.
 */
export function isBelowMinStock(item: Pick<StockItemDto, "quantity" | "minStock">): boolean {
  return item.minStock > 0 && item.quantity < item.minStock;
}

// --- Parâmetros de listagem -------------------------------------------------

/** Parâmetros de listagem paginada/filtrada de itens. */
export interface StockItemListParams {
  page?: number;
  perPage?: number;
  search?: string;
  category?: StockCategory;
  locationId?: string;
}

/** Parâmetros de listagem paginada/filtrada de localizações. */
export interface StockLocationListParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

/** Parâmetros de listagem paginada/filtrada de movimentos. */
export interface StockMovementListParams {
  page?: number;
  perPage?: number;
  search?: string;
  type?: MovementType;
  itemId?: string;
}
