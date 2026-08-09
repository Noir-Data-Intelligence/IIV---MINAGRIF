import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, FlaskConical, MapPin, Radar } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useObservatorioMapa } from "@/hooks/queries/useObservatorio";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { AmostraStatus } from "@/types/dto/amostra";
import i18n from "@/i18n";
import ptObservatorio from "@/i18n/locales/pt/admin/observatorio.json";
import enObservatorio from "@/i18n/locales/en/admin/observatorio.json";

// Namespace autónomo registado em runtime (mesmo padrão de Financeiro.tsx).
if (!i18n.hasResourceBundle("pt", "observatorio"))
  i18n.addResourceBundle("pt", "observatorio", ptObservatorio, true, true);
if (!i18n.hasResourceBundle("en", "observatorio"))
  i18n.addResourceBundle("en", "observatorio", enObservatorio, true, true);

// Centro geográfico aproximado de Angola, com zoom que enquadra o território nacional.
const ANGOLA_CENTER: [number, number] = [-12.5, 17.5];
const ANGOLA_ZOOM = 6;

const STATION_COLOR = "hsl(160, 60%, 38%)";
const STATUS_COLOR: Record<AmostraStatus, string> = {
  recebida: "hsl(45, 90%, 55%)",
  aceite: "hsl(200, 70%, 50%)",
  rejeitada: "hsl(0, 70%, 55%)",
};

/**
 * Marcadores como `divIcon` de círculo colorido em vez dos PNGs por omissão
 * do Leaflet (cujo caminho de asset por omissão parte sob bundlers como o
 * Vite) — evita depender de `leaflet/dist/images/*` sem introduzir nenhuma
 * dependência de ícone extra.
 */
function dotIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.25)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

const stationIcon = dotIcon(STATION_COLOR);
const colheitaIcons: Record<AmostraStatus, L.DivIcon> = {
  recebida: dotIcon(STATUS_COLOR.recebida),
  aceite: dotIcon(STATUS_COLOR.aceite),
  rejeitada: dotIcon(STATUS_COLOR.rejeitada),
};

export default function Observatorio() {
  const { t } = useTranslation("observatorio");
  const prefersReduced = useReducedMotion();
  const { data, isLoading } = useObservatorioMapa();

  const [showEstacoes, setShowEstacoes] = useState(true);
  const [showColheitas, setShowColheitas] = useState(true);

  const estacoes = data?.estacoes ?? [];
  const colheitas = data?.colheitas ?? [];
  const isEmpty = !isLoading && estacoes.length === 0 && colheitas.length === 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader icon={Radar} title={t("page.title")} description={t("page.description")} />

      <motion.div
        className="grid gap-4 grid-cols-1 sm:grid-cols-3"
        variants={prefersReduced ? undefined : staggerContainer}
        initial={prefersReduced ? undefined : "hidden"}
        animate={prefersReduced ? undefined : "visible"}
      >
        <motion.div variants={prefersReduced ? undefined : fadeInUp}>
          <AdminCard variant="gradient-green-gold" icon={Building2} metric={estacoes.length} title={t("kpi.estacoes")} caption={t("kpi.estacoesCaption")} />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={FlaskConical} metric={colheitas.length} title={t("kpi.colheitas")} caption={t("kpi.colheitasCaption")} />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : fadeInUp}>
          <AdminCard variant="glass" icon={MapPin} metric={estacoes.length + colheitas.length} title={t("kpi.total")} caption={t("kpi.totalCaption")} />
        </motion.div>
      </motion.div>

      <AdminCard
        title={t("map.title")}
        icon={MapPin}
        loading={isLoading}
        isEmpty={isEmpty}
        emptyMessage={t("map.empty")}
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            type="button"
            size="sm"
            variant={showEstacoes ? "default" : "outline"}
            onClick={() => setShowEstacoes((v) => !v)}
          >
            <Building2 className="mr-1.5 h-4 w-4" /> {t("map.toggleEstacoes")} ({estacoes.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={showColheitas ? "default" : "outline"}
            onClick={() => setShowColheitas((v) => !v)}
          >
            <FlaskConical className="mr-1.5 h-4 w-4" /> {t("map.toggleColheitas")} ({colheitas.length})
          </Button>
        </div>

        <div className="h-[560px] w-full overflow-hidden rounded-xl border border-border/60">
          <MapContainer center={ANGOLA_CENTER} zoom={ANGOLA_ZOOM} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {showEstacoes &&
              estacoes.map((e) => (
                <Marker key={e.id} position={[e.latitude as number, e.longitude as number]} icon={stationIcon}>
                  <Popup>
                    <p className="font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{t(`stationType.${e.stationType}`)}</p>
                    {e.location && <p className="text-xs">{e.location}</p>}
                  </Popup>
                </Marker>
              ))}
            {showColheitas &&
              colheitas.map((c) => (
                <Marker key={c.amostraId} position={[c.latitude, c.longitude]} icon={colheitaIcons[c.status]}>
                  <Popup>
                    <p className="font-semibold">{c.numero}</p>
                    <p className="text-xs">{c.tipoAmostra}</p>
                    {c.laboratorioNome && <p className="text-xs text-muted-foreground">{c.laboratorioNome}</p>}
                    <Badge variant="secondary" className="mt-1">
                      {t(`status.${c.status}`)}
                    </Badge>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATION_COLOR }} /> {t("legend.estacoes")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR.recebida }} /> {t("legend.recebida")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR.aceite }} /> {t("legend.aceite")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR.rejeitada }} /> {t("legend.rejeitada")}
          </span>
        </div>
      </AdminCard>
    </div>
  );
}
