import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ANGOLA_PROVINCES, provinceByName, municipalityByName } from "@/data/angola-locations";

export interface AngolaAddress {
  provincia: string;
  municipio: string;
  comuna: string;
  detalhe?: string;
}

interface Props {
  value: AngolaAddress;
  onChange: (next: AngolaAddress) => void;
  required?: boolean;
  showDetail?: boolean;
  idPrefix?: string;
  compact?: boolean;
}

/**
 * Endereço Angola em cascata: Província → Município → Comuna (+ detalhe livre).
 * Dataset estático (sem fetch). Limpa selecções dependentes ao mudar pai.
 */
export function AngolaAddressFields({
  value,
  onChange,
  required,
  showDetail = true,
  idPrefix = "addr",
  compact = false,
}: Props) {
  const province = useMemo(() => provinceByName(value.provincia), [value.provincia]);
  const municipality = useMemo(
    () => (value.provincia ? municipalityByName(value.provincia, value.municipio) : undefined),
    [value.provincia, value.municipio],
  );

  return (
    <div className={compact ? "grid gap-3 sm:grid-cols-3" : "space-y-4"}>
      <div className={compact ? "" : "grid gap-4 sm:grid-cols-3"}>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-prov`}>Província {required && <span className="text-destructive">*</span>}</Label>
          <Select
            value={value.provincia || undefined}
            onValueChange={(v) => onChange({ provincia: v, municipio: "", comuna: "", detalhe: value.detalhe })}
          >
            <SelectTrigger id={`${idPrefix}-prov`}>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {ANGOLA_PROVINCES.map((p) => (
                <SelectItem key={p.code} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-mun`}>Município {required && <span className="text-destructive">*</span>}</Label>
          <Select
            value={value.municipio || undefined}
            onValueChange={(v) => onChange({ ...value, municipio: v, comuna: "" })}
            disabled={!province}
          >
            <SelectTrigger id={`${idPrefix}-mun`}>
              <SelectValue placeholder={province ? "Selecionar" : "Escolha a província"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {province?.municipalities.map((m) => (
                <SelectItem key={m.name} value={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-com`}>Comuna</Label>
          <Select
            value={value.comuna || undefined}
            onValueChange={(v) => onChange({ ...value, comuna: v })}
            disabled={!municipality}
          >
            <SelectTrigger id={`${idPrefix}-com`}>
              <SelectValue placeholder={municipality ? "Selecionar" : "Escolha o município"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {municipality?.communes.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showDetail && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-det`}>Bairro / Rua / Referência</Label>
          <Input
            id={`${idPrefix}-det`}
            value={value.detalhe ?? ""}
            onChange={(e) => onChange({ ...value, detalhe: e.target.value })}
            placeholder="Ex.: Bairro Maianga, Rua Comandante Valódia, nº 12"
          />
        </div>
      )}
    </div>
  );
}
