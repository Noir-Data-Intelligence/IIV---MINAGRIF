// Chat assistant edge function using Lovable AI Gateway (streaming)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `És o assistente institucional do IIV — Instituto de Investigação Veterinária de Angola.

Responde sempre em português europeu, de forma clara, profissional e concisa.

Conheces estes módulos do sistema de gestão (acessíveis em /admin/...):
- Painel, Histórico de Alertas, Utilizadores, Permissões (RBAC), Departamentos, Legislação, Notícias, Mensagens, Slideshow
- Laboratório: Laboratórios, Análises, Resultados, Insumos
- Produção: Produtos, Lotes, Planeamento, Distribuição
- Qualidade: Estações, Auditorias, Não-Conformidades, Auditoria (logs), Acessibilidade
- Gestão: Documentos (com versões, permissões, aprovação), Processos (workflow com etapas, SLAs, analítica)

Quando faz sentido, sugere o caminho exacto (ex.: "vai a /admin/processos") em vez de explicações longas.
Não inventes funcionalidades. Se não souberes, diz que o utilizador deve contactar o administrador.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de pedidos atingido. Tente novamente em instantes." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos esgotados. Contacte o administrador." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text();
      return new Response(JSON.stringify({ error: text || "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
