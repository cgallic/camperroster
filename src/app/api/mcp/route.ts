import { NextResponse } from "next/server";

/**
 * MCP is deliberately unavailable.
 *
 * The former endpoint advertised seven tools and returned fabricated success
 * payloads without reading or writing the product. Re-enable this surface only
 * after every tool has authenticated, tenant-scoped persistence.
 */
export async function GET() {
  return NextResponse.json({
    name: "camperroster-mcp-server",
    version: "1.0.0",
    enabled: false,
    description: "MCP tools are disabled; no operations are available.",
    capabilities: { tools: [] },
  });
}

export async function POST(req: Request) {
  const id = await req.json().then((body: unknown) => {
    if (body && typeof body === "object" && "id" in body) return (body as { id?: unknown }).id ?? null;
    return null;
  }).catch(() => null);
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      error: { code: -32004, message: "MCP tools are disabled; no operation was performed." },
    },
    { status: 503 }
  );
}
