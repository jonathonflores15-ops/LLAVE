// AI search assistant -- helps visitors narrow down listings or ask questions about
// how Llave works. Runs in MOCK mode (assistantAvailable() === false) until
// ANTHROPIC_API_KEY is set, same pattern as Stripe/Resend elsewhere in this app.
import { z } from "zod";

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

let _client = null;
async function getClient() {
  if (!API_KEY) return null;
  if (_client) return _client;
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  _client = new Anthropic({ apiKey: API_KEY });
  return _client;
}

export function assistantAvailable() {
  return !!API_KEY;
}

const ReplySchema = z.object({
  reply: z.string(),
  filters: z.object({
    kind: z.enum(["rent", "sale", "auction"]).nullable(),
    use: z.enum(["all", "res", "com"]).nullable(),
    muni: z.string().nullable(),
    maxPrice: z.number().nullable(),
    minBeds: z.number().nullable(),
  }),
});

// Returns { reply, filters } or null if the assistant isn't configured (caller returns 503).
export async function askAssistant(message, { munis }) {
  const client = await getClient();
  if (!client) return null;

  const { zodOutputFormat } = await import("@anthropic-ai/sdk/helpers/zod");

  const system = [
    "You are Llave's property search assistant for a Puerto Rico real estate site.",
    "Help the visitor narrow down what they're looking for -- rental, sale, or auction; residential or commercial; municipality; price range; bedrooms -- and answer short factual questions about how Llave works (every listing is anchored to its número de catastro and links free to the Registro de la Propiedad and CRIM; the $19 Property Report adds title, liens, taxes, flood zone and comps).",
    "You are not a real estate agent, lawyer, or financial advisor -- never give legal, tax, or investment advice, and never claim a specific property is a good or bad deal.",
    "Reply in the same language the visitor wrote in (Spanish or English), in 1-3 short sentences.",
    `Known municipalities right now: ${munis.join(", ") || "none yet"}.`,
    "If the visitor's message implies search filters, fill in the fields you're confident about in \"filters\" and leave the rest null. Only set a municipality if it's one of the known ones above.",
  ].join(" ");

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: message }],
    output_config: { format: zodOutputFormat(ReplySchema) },
  });
  return response.parsed_output;
}
