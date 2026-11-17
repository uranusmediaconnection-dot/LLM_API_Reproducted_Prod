/**
 * Web tools smoke tests — offline + optional live.
 *
 * Offline (always run, no network, no keys):
 *   node --experimental-strip-types scripts/test_web_tools.mts
 *   (or: npx tsx scripts/test_web_tools.mts)
 *
 * Live (requires a running gateway + a valid API key):
 *   WEB_TOOLS_BASE_URL=https://your-gateway WEB_TOOLS_API_KEY=sk-... \
 *     node --experimental-strip-types scripts/test_web_tools.mts
 *
 * The offline suite stubs global fetch, so the full intent -> retrieval ->
 * WEB CONTEXT injection path is verified deterministically, including the
 * original failing case: "Summarize this page https://fortydnlab.com/".
 */

import {
  detectWebIntent,
  extractTextContent,
  maybeEnhanceMessages,
  stripHtml,
  type ChatMessage,
} from "../src/lib/web-tools.ts";

let pass = 0;
let fail = 0;

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// ---------------------------------------------------------------------------
// Offline fixtures
// ---------------------------------------------------------------------------

const FIXTURE_HTML = `<!doctype html><html><head><title>Forty Dn Lab</title>
<style>body{color:red}</style></head><body>
<script>window.tracking = "should vanish";</script>
<h1>Forty Dn Lab &amp; Partners</h1><p>We build lab&#39;s equipment.</p>
<!-- comment --><div>Second &nbsp; line</div></body></html>`;

const FIXTURE_PAGE_TEXT = "Forty Dn Lab & Partners We build lab's equipment. Second line";

function installMockFetch() {
  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  (globalThis as any).fetch = async (input: any, init?: any) => {
    const url = typeof input === "string" ? input : input.url;
    calls.push(url);
    if (url.includes("firecrawl.dev/v1/scrape")) {
      return new Response(
        JSON.stringify({ success: true, data: { markdown: "# Fixture Page\n\nMocked firecrawl body.", metadata: { title: "Fixture" } } }),
        { status: 200 }
      );
    }
    if (url.includes("api.tavily.com/search")) {
      return new Response(
        JSON.stringify({ results: [{ title: "Tavily hit", url: "https://example.com/a", content: "tavily snippet" }] }),
        { status: 200 }
      );
    }
    if (url.includes("firecrawl.dev/v1/search")) {
      return new Response(JSON.stringify({ success: true, data: [{ title: "FC hit", url: "https://example.com/b", description: "fc snippet" }] }), { status: 200 });
    }
    if (url.includes("duckduckgo.com")) {
      const html = `<div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fc">DDG &amp; hit</a><a class="result__snippet">ddg snippet</a></div>`;
      return new Response(html, { status: 200 });
    }
    if (url.startsWith("https://fortydnlab.com/")) {
      return new Response(FIXTURE_HTML, { status: 200, headers: { "content-type": "text/html" } });
    }
    return new Response("not found", { status: 404 });
  };
  return { calls, restore: () => ((globalThis as any).fetch = realFetch) };
}

const headersOn = new Headers({ "x-web-tools": "on" });
const headersOff = new Headers({ "x-web-tools": "off" });

// ---------------------------------------------------------------------------
// 1-6: pure functions
// ---------------------------------------------------------------------------

console.log("offline unit checks");

const stripped = stripHtml(FIXTURE_HTML);
check("01 stripHtml removes script/style/tags", !stripped.includes("should vanish") && !stripped.includes("<") && stripped.length > 0);
check("02 stripHtml decodes entities", stripped.includes("Forty Dn Lab & Partners") && stripped.includes("lab's"));
check("03 stripHtml collapses whitespace", !/\n{3,}| {2}/.test(stripped.replace(/\n\n/g, "")));

check("04 intent: URL -> scrape", detectWebIntent("check https://example.com/x today")?.kind === "scrape");
const replay = detectWebIntent("Summarize this page https://fortydnlab.com/");
check("05 intent: exact replay of the failing case", replay?.kind === "scrape" && replay.url === "https://fortydnlab.com/");
check("06 intent: search phrase -> search", detectWebIntent("search latest news about browsers")?.kind === "search" && detectWebIntent("what is a harness")?.kind === "search");
check("07 intent: plain text -> none", detectWebIntent("write a haiku about rain") === null);

check("08 extractTextContent handles string and parts", extractTextContent("hi") === "hi" && extractTextContent([{ text: "a" }, { text: "b" }]) === "a\nb");

// ---------------------------------------------------------------------------
// 9-10: injection path (mocked network)
// ---------------------------------------------------------------------------

const { restore } = installMockFetch();

const convo: ChatMessage[] = [
  { role: "system", content: "You are helpful." },
  { role: "user", content: "Summarize this page https://fortydnlab.com/" },
];
const result = await maybeEnhanceMessages(convo, headersOn);
const injected = result.enhanced ? result.messages.find((m) => m.role === "system" && String(m.content).startsWith("WEB CONTEXT")) : null;
check("09 URL message -> WEB CONTEXT injected before last user message", Boolean(injected) && result.messages[result.messages.length - 1].role === "user");
check("10 injected context carries real page content", Boolean(injected && String(injected.content).includes("Forty Dn Lab")));

const searchConvo: ChatMessage[] = [{ role: "user", content: "search latest news about browsers" }];
process.env.TAVILY_API_KEY = "mock-key"; // force the first tier of the chain
const searchResult = await maybeEnhanceMessages(searchConvo, headersOn);
const searchContext = searchResult.enhanced ? String(searchResult.messages.find((m) => String(m.content).startsWith("WEB CONTEXT"))?.content ?? "") : "";
check("11 search message -> Tavily results injected (engine chain first tier)", searchResult.enhanced && searchContext.includes("Tavily hit"));
delete process.env.TAVILY_API_KEY; // keyless environment falls back to DDG — correct behavior

const offResult = await maybeEnhanceMessages(convo, headersOff);
check("12 x-web-tools: off -> original messages untouched", offResult.enhanced === false && offResult.messages.length === convo.length);

restore();

// ---------------------------------------------------------------------------
// Optional live checks against a running gateway
// ---------------------------------------------------------------------------

const base = process.env.WEB_TOOLS_BASE_URL;
const key = process.env.WEB_TOOLS_API_KEY;

if (base && key) {
  console.log("live checks against", base);
  const auth = { authorization: `Bearer ${key}` };
  const searchRes = await fetch(`${base}/v1/tools/search?q=browser+automation+agents`, { headers: { ...auth, "x-web-tools": "on" } });
  const searchJson: any = await searchRes.json();
  check("L1 GET /v1/tools/search returns results or an honest note", searchRes.ok && (searchJson.results?.length > 0 || typeof searchJson.note === "string"));
  const scrapeRes = await fetch(`${base}/v1/tools/scrape?url=https://example.com/`, { headers: { ...auth, "x-web-tools": "on" } });
  const scrapeJson: any = await scrapeRes.json();
  check("L2 GET /v1/tools/scrape returns page content", scrapeRes.ok && scrapeJson.chars > 0);
  const chatRes = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/json", "x-web-tools": "on" },
    body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "user", content: "Summarize this page https://example.com/" }] }),
  });
  check("L3 chat completion with URL intent succeeds", chatRes.ok);
  const badRes = await fetch(`${base}/v1/tools/search`, { headers: auth });
  check("L4 missing query is a clean 400", badRes.status === 400);
} else {
  console.log("live checks skipped (set WEB_TOOLS_BASE_URL + WEB_TOOLS_API_KEY to enable)");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
