import { Helmet } from "react-helmet-async";

const SITE_NAME = "Instituto de Investigação Veterinária";
// Placeholder ate confirmacao do dominio institucional real (ver PLANO-ATUALIZACAO-FRONTEND.txt, decisao D5).
// Configuravel via VITE_SITE_URL sem alterar codigo.
export const BASE_URL = import.meta.env.VITE_SITE_URL || "https://www.iiv.gov.ao";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({ title, description, path = "", type = "website", image, noindex, jsonLd }: SEOProps) {
  const fullTitle = title.includes("IIV") || title.includes(SITE_NAME) ? title : `${title} — IIV`;
  const url = `${BASE_URL}${path}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
