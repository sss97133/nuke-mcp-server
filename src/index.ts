#!/usr/bin/env node

/**
 * Nuke MCP Server
 *
 * Exposes the Nuke vehicle data platform as MCP tools.
 * 1.29M vehicle profiles, AI valuations, image analysis, listing extraction.
 *
 * Tools:
 *   search_vehicles         - Search by VIN, URL, year, make/model, or text (universal-search)
 *   search_vehicles_api     - Full-text search with filters and valuations (api-v1-search)
 *   extract_listing         - Extract structured vehicle data from any listing URL
 *   get_vehicle_valuation   - Multi-signal market valuation (compute-vehicle-valuation)
 *   get_valuation           - Cached Nuke Estimate lookup by vehicle_id or VIN (api-v1-valuations)
 *   identify_vehicle_image  - AI vision: photo -> year/make/model/trim
 *   analyze_image           - YONO vision: make, condition, zone, damage, mods ($0/image)
 *   get_comps               - Comparable vehicle sales by make/model or vehicle_id
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

// User-facing API key (nk_live_...) — used for X-API-Key header
const NUKE_API_KEY = process.env.NUKE_API_KEY || null;

// Service role key — used for Authorization: Bearer header on api-v1-* endpoints
// This bypasses API key validation and grants read access to all public data.
// Set this for internal/development use when no user API key is available.
const NUKE_SERVICE_ROLE_KEY = process.env.NUKE_SERVICE_ROLE_KEY || null;

if (!NUKE_API_KEY && !NUKE_SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: NUKE_API_KEY or NUKE_SERVICE_ROLE_KEY is required.\n" +
    "  NUKE_API_KEY: User API key (nk_live_...) — get one at https://nuke.ag/settings/api\n" +
    "  NUKE_SERVICE_ROLE_KEY: Supabase service role key — for internal/development use"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Build auth headers. Strategy:
 *   - Authorization: Bearer <service_role_key> if available (service role path in apiKeyAuth.ts)
 *   - X-API-Key: <nk_live_key> if available (API key path in apiKeyAuth.ts)
 *   - Falls back to API key as Bearer if no service role key is set
 *
 * This ensures api-v1-* endpoints authenticate correctly:
 *   1. Service role key matches SUPABASE_SERVICE_ROLE_KEY check -> instant auth
 *   2. API key goes through X-API-Key -> hash lookup in api_keys table
 */
function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (NUKE_SERVICE_ROLE_KEY) {
    // Service role key as Bearer — matches apiKeyAuth.ts line 76-85
    headers["Authorization"] = `Bearer ${NUKE_SERVICE_ROLE_KEY}`;
  } else if (NUKE_API_KEY) {
    // No service role key — use API key as Bearer for non-apiKeyAuth functions
    headers["Authorization"] = `Bearer ${NUKE_API_KEY}`;
  }

  if (NUKE_API_KEY) {
    // API key via X-API-Key header — for apiKeyAuth.ts API key validation path
    headers["X-API-Key"] = NUKE_API_KEY;
  }

  return headers;
}

/**
 * Call a Supabase edge function by name.
 * Used for non-api-v1 functions (universal-search, extract-vehicle-data-ai, etc.)
 */
async function callFunction(
  name: string,
  body: Record<string, unknown>,
  method: "POST" | "GET" = "POST"
): Promise<unknown> {
  const url = `${NUKE_API_URL}/functions/v1/${name}`;
  const headers = buildAuthHeaders();

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

/**
 * Call an api-v1-* endpoint with proper auth headers.
 * These endpoints use apiKeyAuth.ts which checks service role, JWT, then API key.
 */
async function callAPI(
  endpoint: string,
  path: string = "",
  method: "GET" | "POST" | "PATCH" = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${NUKE_API_URL}/functions/v1/api-v1-${endpoint}${path}`;
  const headers = buildAuthHeaders();

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
  version: "0.3.0",
});

// ── Tool 1: Search (universal-search) ─────────────────────────────────────

server.registerTool(
  "search_vehicles",
  {
    title: "Search Vehicles",
    description:
      "Quick search the Nuke database (1.29M+ vehicle profiles). Accepts any input: " +
      "VIN (17 chars), listing URL, year, make/model text, or free-text query. " +
      "Returns matching vehicles with thumbnails. For filtered search with " +
      "pagination and valuations, use search_vehicles_api instead.",
    inputSchema: {
      query: z
        .string()
        .describe(
          "Search query -- VIN, URL, year, 'Porsche 911', or free text"
        ),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .describe("Max results to return (1-100, default 10)"),
    },
  },
  async ({ query, limit }) => {
    const data = await callFunction("universal-search", { query, limit });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 2: Search API (api-v1-search) ────────────────────────────────────

server.registerTool(
  "search_vehicles_api",
  {
    title: "Search Vehicles (Advanced)",
    description:
      "Full-text search across 1.29M+ vehicles with filters, pagination, and " +
      "inline valuation data. Filter by make, model, year range. Results include " +
      "VIN, price, mileage, color, transmission, body style, auction source, " +
      "and Nuke Estimate valuation when available. Sorted by relevance, price, or year.",
    inputSchema: {
      q: z.string().describe("Search query text (e.g. 'Porsche 911 Carrera')"),
      make: z.string().optional().describe("Filter by make (e.g. 'Porsche')"),
      model: z.string().optional().describe("Filter by model (e.g. '911')"),
      year_from: z.number().optional().describe("Minimum year (e.g. 1990)"),
      year_to: z.number().optional().describe("Maximum year (e.g. 2000)"),
      sort: z.enum(["relevance", "price_desc", "price_asc", "year_desc", "year_asc"])
        .optional()
        .default("relevance")
        .describe("Sort order (default: relevance)"),
      limit: z.number().min(1).max(200).optional().default(50)
        .describe("Results per page (1-200, default 50)"),
      page: z.number().min(1).optional().default(1)
        .describe("Page number (starts at 1)"),
    },
  },
  async ({ q, make, model, year_from, year_to, sort, limit, page }) => {
    const params = new URLSearchParams();
    params.set("q", q);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (year_from) params.set("year_from", String(year_from));
    if (year_to) params.set("year_to", String(year_to));
    if (sort) params.set("sort", sort);
    if (limit) params.set("limit", String(limit));
    if (page) params.set("page", String(page));

    const data = await callAPI("search", `?${params.toString()}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 3: Extract Listing ───────────────────────────────────────────────

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

// ── Tool 4: Vehicle Valuation (compute) ───────────────────────────────────

server.registerTool(
  "get_vehicle_valuation",
  {
    title: "Compute Vehicle Valuation",
    description:
      "Compute 'The Nuke Estimate' -- a confidence-weighted multi-signal valuation. " +
      "Uses 8 signals: comparable sales, condition, rarity, sentiment, bid curves, " +
      "market trends, survival rates, and originality. Returns estimated value, " +
      "confidence score, deal score, heat score, and price tier " +
      "(budget/mainstream/enthusiast/collector/trophy). " +
      "For cached valuations without recompute, use get_valuation instead.",
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

// ── Tool 5: Valuation Lookup (api-v1-valuations) ──────────────────────────

server.registerTool(
  "get_valuation",
  {
    title: "Get Vehicle Valuation",
    description:
      "Look up a cached Nuke Estimate (vehicle valuation) by vehicle_id or VIN. " +
      "Returns estimated value, confidence score, value range (low/high), " +
      "deal score, heat score, price tier, and signal weights. " +
      "Faster than get_vehicle_valuation because it reads cached data " +
      "instead of recomputing. Falls back to vehicle pricing fields if " +
      "no computed estimate exists.",
    inputSchema: {
      vehicle_id: z.string().uuid().optional()
        .describe("Nuke vehicle ID -- provide this or vin"),
      vin: z.string().optional()
        .describe("Vehicle VIN -- provide this or vehicle_id"),
    },
  },
  async ({ vehicle_id, vin }) => {
    const params = new URLSearchParams();
    if (vehicle_id) params.set("vehicle_id", vehicle_id);
    if (vin) params.set("vin", vin);

    const data = await callAPI("valuations", `?${params.toString()}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 6: Identify Vehicle from Image ───────────────────────────────────

server.registerTool(
  "identify_vehicle_image",
  {
    title: "Identify Vehicle from Image",
    description:
      "Use AI vision to identify a vehicle's year, make, model, and trim from a photo. " +
      "Analyzes body style, grille, headlights, profile, badges, and era indicators. " +
      "Returns identification with confidence score (0.0-1.0) and reasoning. " +
      "Uses tiered AI approach (Gemini Flash -> GPT-4o-mini -> GPT-4o). " +
      "For deeper analysis with condition/damage/zone detection, use analyze_image instead.",
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

// ── Tool 7: Analyze Image (api-v1-vision) ─────────────────────────────────

server.registerTool(
  "analyze_image",
  {
    title: "Analyze Vehicle Image (YONO)",
    description:
      "Deep vehicle image analysis powered by YONO (You Only Nuke Once). " +
      "Returns make classification, condition score (1-5), vehicle zone " +
      "(ext_front, ext_rear, interior, engine_bay, etc.), damage flags, " +
      "modification flags, photo quality score, and optionally comparable sales. " +
      "Costs $0/image (local YONO inference, zero cloud API calls). " +
      "For simple make/model identification, use identify_vehicle_image instead.",
    inputSchema: {
      image_url: z.string().url()
        .describe("URL of the vehicle image to analyze"),
      include_comps: z.boolean().optional().default(false)
        .describe("Include comparable sales for the identified make (default: false)"),
    },
  },
  async ({ image_url, include_comps }) => {
    const data = await callAPI("vision", "/analyze", "POST", {
      image_url,
      include_comps,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 8: Comparable Sales (api-v1-comps) ───────────────────────────────

server.registerTool(
  "get_comps",
  {
    title: "Get Comparable Sales",
    description:
      "Find comparable vehicle sales for valuation context. Query by make/model, " +
      "vehicle_id, or VIN to find similar vehicles that have sold. Returns actual " +
      "auction results from Bring a Trailer, Mecum, Barrett-Jackson, RM Sotheby's, " +
      "Cars & Bids, and more. Includes sale price, sold date, platform, mileage, " +
      "color, images, and listing URLs. Also returns price statistics: " +
      "average, median, min, max across all comps.",
    inputSchema: {
      make: z.string().optional()
        .describe("Vehicle make (e.g. 'Porsche') -- required unless vehicle_id or vin provided"),
      model: z.string().optional()
        .describe("Vehicle model (e.g. '911')"),
      year: z.number().optional()
        .describe("Target year -- comps within +/- year_range"),
      year_range: z.number().optional().default(2)
        .describe("Year range around target year (default: +/- 2 years)"),
      vehicle_id: z.string().uuid().optional()
        .describe("Nuke vehicle ID -- auto-resolves make/model/year"),
      vin: z.string().optional()
        .describe("VIN -- auto-resolves make/model/year"),
      min_price: z.number().optional()
        .describe("Minimum sale price filter"),
      max_price: z.number().optional()
        .describe("Maximum sale price filter"),
      limit: z.number().min(1).max(100).optional().default(20)
        .describe("Max results (1-100, default 20)"),
    },
  },
  async ({ make, model, year, year_range, vehicle_id, vin, min_price, max_price, limit }) => {
    const body: Record<string, unknown> = {};
    if (make) body.make = make;
    if (model) body.model = model;
    if (year) body.year = year;
    if (year_range !== undefined) body.year_range = year_range;
    if (vehicle_id) body.vehicle_id = vehicle_id;
    if (vin) body.vin = vin;
    if (min_price !== undefined) body.min_price = min_price;
    if (max_price !== undefined) body.max_price = max_price;
    if (limit) body.limit = limit;

    const data = await callAPI("comps", "", "POST", body);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 9: Get Vehicle ───────────────────────────────────────────────────

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
    const data = await callAPI("vehicles", `/${vehicle_id}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ── Tool 10: List Vehicles ────────────────────────────────────────────────

server.registerTool(
  "list_vehicles",
  {
    title: "List Vehicles",
    description:
      "List vehicles from the Nuke database with optional filters. Returns " +
      "paginated results with year, make, model, VIN, price, mileage, and more. " +
      "Filter by make, model, year, year range, price range, transmission, " +
      "and max mileage. Sort by created_at, year, sale_price, or mileage.",
    inputSchema: {
      page: z.number().min(1).optional().default(1)
        .describe("Page number (starts at 1)"),
      limit: z.number().min(1).max(100).optional().default(20)
        .describe("Results per page (1-100, default 20)"),
      mine: z.boolean().optional().default(false)
        .describe("Only list your own vehicles"),
      make: z.string().optional()
        .describe("Filter by make (e.g. 'Porsche')"),
      model: z.string().optional()
        .describe("Filter by model (e.g. '911')"),
      year: z.number().optional()
        .describe("Filter by exact year"),
      year_min: z.number().optional()
        .describe("Minimum year"),
      year_max: z.number().optional()
        .describe("Maximum year"),
      price_min: z.number().optional()
        .describe("Minimum price"),
      price_max: z.number().optional()
        .describe("Maximum price"),
      sort: z.enum(["created_at", "year", "sale_price", "mileage", "updated_at"])
        .optional().default("created_at")
        .describe("Sort field"),
      sort_dir: z.enum(["asc", "desc"]).optional().default("desc")
        .describe("Sort direction"),
    },
  },
  async ({ page, limit, mine, make, model, year, year_min, year_max, price_min, price_max, sort, sort_dir }) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));
    if (mine) params.set("mine", "true");
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (year) params.set("year", String(year));
    if (year_min) params.set("year_min", String(year_min));
    if (year_max) params.set("year_max", String(year_max));
    if (price_min) params.set("price_min", String(price_min));
    if (price_max) params.set("price_max", String(price_max));
    if (sort) params.set("sort", sort);
    if (sort_dir) params.set("sort_dir", sort_dir);

    const data = await callAPI("vehicles", `?${params.toString()}`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const TOOL_NAMES = [
  "search_vehicles", "search_vehicles_api", "extract_listing",
  "get_vehicle_valuation", "get_valuation", "identify_vehicle_image",
  "analyze_image", "get_comps", "get_vehicle", "list_vehicles",
];

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Nuke MCP Server v0.3.0 running on stdio");
  console.error(`API: ${NUKE_API_URL}`);
  console.error(`Auth: ${NUKE_SERVICE_ROLE_KEY ? "service-role" : "api-key"}`);
  console.error(`Tools (${TOOL_NAMES.length}): ${TOOL_NAMES.join(", ")}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
