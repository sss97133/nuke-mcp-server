#!/usr/bin/env node

/**
 * Nuke MCP Server
 *
 * Exposes the Nuke vehicle data platform as MCP tools.
 * 758K vehicle profiles, AI valuations, image identification, listing extraction.
 *
 * Tools:
 *   search_vehicles         - Search by VIN, URL, year, make/model, or text
 *   extract_listing         - Extract structured vehicle data from any listing URL
 *   get_vehicle_valuation   - Multi-signal market valuation (The Nuke Estimate)
 *   identify_vehicle_image  - AI vision: photo → year/make/model/trim
 *   get_vehicle             - Fetch a vehicle profile by ID
 *   list_vehicles           - List vehicles (yours or public)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const NUKE_API_URL =
  process.env.NUKE_API_URL || "https://qkgaybvrernstplzjaam.supabase.co";
const _apiKey = process.env.NUKE_API_KEY;

if (!_apiKey) {
  console.error(
    "ERROR: NUKE_API_KEY is required. Get one at https://nuke.run/settings/api"
  );
  process.exit(1);
}

const NUKE_API_KEY: string = _apiKey;

// ---------------------------------------------------------------------------
// HTTP client for Supabase edge functions
// ---------------------------------------------------------------------------

async function callFunction(
  name: string,
  body: Record<string, unknown>,
  method: "POST" | "GET" = "POST"
): Promise<unknown> {
  const url = `${NUKE_API_URL}/functions/v1/${name}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${NUKE_API_KEY}`,
    "X-API-Key": NUKE_API_KEY,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Nuke API error (${res.status}): ${text}`);
  }

  return res.json();
}

async function callVehiclesAPI(
  path: string,
  method: "GET" | "POST" | "PATCH" = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${NUKE_API_URL}/functions/v1/api-v1-vehicles${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${NUKE_API_KEY}`,
    "X-API-Key": NUKE_API_KEY,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Nuke API error (${res.status}): ${text}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "nuke-vehicle-data",
  version: "0.1.0",
});

// ── Tool 1: Search ──────────────────────────────────────────────────────────

server.registerTool(
  "search_vehicles",
  {
    title: "Search Vehicles",
    description:
      "Search the Nuke database (758K+ vehicle profiles). Accepts any input: " +
      "VIN (17 chars), listing URL, year, make/model text, or free-text query. " +
      "Returns matching vehicles with thumbnails and relevance scores.",
    inputSchema: {
      query: z
        .string()
        .describe(
          "Search query — VIN, URL, year, 'Porsche 911', or free text"
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Max results to return (default 10)"),
    },
  },
  async ({ query, limit }) => {
    const data = await callFunction("universal-search", { query, limit });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 2: Extract Listing ─────────────────────────────────────────────────

server.registerTool(
  "extract_listing",
  {
    title: "Extract Vehicle Listing",
    description:
      "Extract structured vehicle data from ANY car listing URL. Works on " +
      "Bring a Trailer, Cars & Bids, Craigslist, eBay Motors, Facebook Marketplace, " +
      "Hagerty, PCarMarket, RM Sotheby's, Mecum, and thousands of other sites. " +
      "Returns year, make, model, VIN, price, mileage, images, and more.",
    inputSchema: {
      url: z.string().url().describe("The listing URL to extract vehicle data from"),
      source: z
        .string()
        .optional()
        .describe("Optional source hint (e.g. 'craigslist', 'bat')"),
    },
  },
  async ({ url, source }) => {
    const data = await callFunction("extract-vehicle-data-ai", { url, source });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 3: Vehicle Valuation ───────────────────────────────────────────────

server.registerTool(
  "get_vehicle_valuation",
  {
    title: "Get Vehicle Valuation",
    description:
      "Compute 'The Nuke Estimate' — a confidence-weighted multi-signal valuation. " +
      "Uses 8 signals: comparable sales, condition, rarity, sentiment, bid curves, " +
      "market trends, survival rates, and originality. Returns estimated value, " +
      "confidence score, deal score, heat score, and price tier " +
      "(budget/mainstream/enthusiast/collector/trophy).",
    inputSchema: {
      vehicle_id: z
        .string()
        .uuid()
        .describe("Nuke vehicle ID to value"),
      force: z
        .boolean()
        .optional()
        .default(false)
        .describe("Force recompute even if cached"),
    },
  },
  async ({ vehicle_id, force }) => {
    const data = await callFunction("compute-vehicle-valuation", {
      vehicle_id,
      force,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 4: Identify Vehicle from Image ─────────────────────────────────────

server.registerTool(
  "identify_vehicle_image",
  {
    title: "Identify Vehicle from Image",
    description:
      "Use AI vision to identify a vehicle's year, make, model, and trim from a photo. " +
      "Analyzes body style, grille, headlights, profile, badges, and era indicators. " +
      "Returns identification with confidence score (0.0–1.0) and reasoning.",
    inputSchema: {
      image_url: z
        .string()
        .url()
        .describe("URL of the vehicle image to identify"),
      context: z
        .object({
          title: z.string().optional().describe("Optional title/caption for context"),
          description: z
            .string()
            .optional()
            .describe("Optional description for context"),
        })
        .optional()
        .describe("Optional context to help narrow identification"),
    },
  },
  async ({ image_url, context }) => {
    const data = await callFunction("identify-vehicle-from-image", {
      image_url,
      ...(context ? { context } : {}),
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 5: Get Vehicle ─────────────────────────────────────────────────────

server.registerTool(
  "get_vehicle",
  {
    title: "Get Vehicle Details",
    description:
      "Fetch a vehicle profile from the Nuke database by ID. Returns year, make, " +
      "model, VIN, mileage, colors, transmission, engine, price, and more.",
    inputSchema: {
      vehicle_id: z.string().uuid().describe("Nuke vehicle ID"),
    },
  },
  async ({ vehicle_id }) => {
    const data = await callVehiclesAPI(`/${vehicle_id}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 6: List Vehicles ───────────────────────────────────────────────────

server.registerTool(
  "list_vehicles",
  {
    title: "List Vehicles",
    description:
      "List vehicles from the Nuke database. Returns paginated results. " +
      "Use mine=true to list only your vehicles.",
    inputSchema: {
      page: z.number().optional().default(1).describe("Page number"),
      limit: z.number().optional().default(20).describe("Results per page (max 100)"),
      mine: z
        .boolean()
        .optional()
        .default(false)
        .describe("Only list your own vehicles"),
    },
  },
  async ({ page, limit, mine }) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (mine) params.set("mine", "true");
    const data = await callVehiclesAPI(`?${params.toString()}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Nuke MCP Server v0.1.0 running on stdio");
  console.error(`API: ${NUKE_API_URL}`);
  console.error(`Tools: search_vehicles, extract_listing, get_vehicle_valuation, identify_vehicle_image, get_vehicle, list_vehicles`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
