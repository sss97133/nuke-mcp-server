# Nuke MCP Server

Vehicle intelligence for AI agents. Search 1.29M+ vehicle profiles, get comparable sales, AI valuations, $0/image analysis, and listing extraction.

```
npx -y @sss97133/nuke-mcp-server
```

## What it does

Nuke is a vehicle data platform with 1.29M profiles, 1.36M observations, 11.7M auction comments, and 35M images aggregated from Bring a Trailer, Cars & Bids, RM Sotheby's, Mecum, Barrett-Jackson, eBay Motors, Craigslist, forums, and 100+ more sources.

This MCP server gives any AI agent access to that data through 10 tools:

| Tool | Description |
|------|-------------|
| `search_vehicles` | Quick search by VIN, URL, year, make/model, or free text |
| `search_vehicles_api` | Full-text search with filters (make, model, year, price), pagination, and inline valuations |
| `extract_listing` | Extract structured data from any car listing URL |
| `get_vehicle_valuation` | Compute multi-signal market valuation ("The Nuke Estimate") |
| `get_valuation` | Look up cached valuation by vehicle_id or VIN |
| `identify_vehicle_image` | AI vision: photo -> year/make/model/trim with confidence |
| `analyze_image` | YONO vision: make, condition, zone, damage, mods ($0/image) |
| `get_comps` | Comparable auction sales with price statistics |
| `get_vehicle` | Fetch a vehicle profile by ID |
| `list_vehicles` | List vehicles with filters (make, model, year, price range) |

## Setup

### 1. Get an API key

Sign up at [nuke.ag](https://nuke.ag) and generate an API key in Settings.

### 2. Configure your MCP client

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nuke": {
      "command": "npx",
      "args": ["-y", "@sss97133/nuke-mcp-server"],
      "env": {
        "NUKE_API_KEY": "nk_live_your_key_here"
      }
    }
  }
}
```

#### Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "nuke": {
      "command": "npx",
      "args": ["-y", "@sss97133/nuke-mcp-server"],
      "env": {
        "NUKE_API_KEY": "nk_live_your_key_here"
      }
    }
  }
}
```

#### Cursor

Add to Cursor Settings -> MCP Servers:

```json
{
  "nuke": {
    "command": "npx",
    "args": ["-y", "@sss97133/nuke-mcp-server"],
    "env": {
      "NUKE_API_KEY": "nk_live_your_key_here"
    }
  }
}
```

## Example prompts

Once configured, you can ask your AI agent:

- "What's a 1973 Porsche 911 worth right now?"
- "Find comparable sales for a 1967 Ford Mustang Fastback"
- "Extract the vehicle data from this BaT listing: https://bringatrailer.com/listing/..."
- "What car is in this photo?" (with image URL)
- "Analyze this car photo for condition and damage" (with image URL)
- "Search for all BMW M3 E30s in the database"
- "Look up VIN WP0AB2966NS420176"

## Tools in detail

### search_vehicles

Quick search. Accepts any input and auto-detects query type.

```
Input:  { query: "1967 Mustang", limit: 5 }
Output: { results: [...], query_type: "text", total_count: 142 }
```

Query types auto-detected:
- **VIN** (17 chars) -> direct vehicle lookup
- **URL** -> routes to extraction
- **Year** (4 digits) -> vehicles from that year
- **Text** -> multi-entity search across vehicles, orgs, users

### search_vehicles_api

Full-text search with filters, pagination, sort, and inline valuations.

```
Input:  { q: "Porsche 911", make: "Porsche", year_from: 1990, year_to: 2000, limit: 50 }
Output: { data: [...], pagination: { page: 1, total_count: 312 }, search_time_ms: 45 }
```

Each result includes `valuation` with `estimated_value` and `confidence_score` when available.

### extract_listing

Works on any car listing URL. No configuration needed.

```
Input:  { url: "https://bringatrailer.com/listing/1988-porsche-911-turbo-68" }
Output: { year: 1988, make: "Porsche", model: "911", trim: "Turbo", vin: "...", ... }
```

Supported sources include: Bring a Trailer, Cars & Bids, Hagerty, PCarMarket, RM Sotheby's, Mecum, Gooding, Bonhams, eBay Motors, Craigslist, Facebook Marketplace, Collecting Cars, and any generic listing page.

### get_vehicle_valuation

Computes the Nuke Estimate using 8 signals:

1. Comparable sales (recency-weighted)
2. Condition assessment
3. Rarity (production data + survival rates)
4. Sentiment (auction comment analysis)
5. Bid curve velocity
6. Market trend (30d/90d)
7. Originality score
8. Record proximity

```
Input:  { vehicle_id: "uuid" }
Output: { estimated_value: 47500, value_low: 41000, value_high: 54000,
          confidence_score: 0.82, deal_score: "Good Deal", heat_score: 0.7,
          price_tier: "mainstream" }
```

### get_valuation

Fast cached valuation lookup (no recomputation).

```
Input:  { vehicle_id: "uuid" }  or  { vin: "WP0AB2966NS420176" }
Output: { data: { estimated_value: 47500, confidence_score: 0.82, deal_score: "buy", ... } }
```

### identify_vehicle_image

Tiered AI approach: Gemini Flash -> GPT-4o-mini -> GPT-4o for cost efficiency.

```
Input:  { image_url: "https://example.com/car.jpg" }
Output: { year: 1973, make: "Porsche", model: "911", trim: "Carrera RS",
          body_style: "coupe", generation: "G-Series", confidence: 0.87,
          reasoning: "Distinctive ducktail spoiler, Carrera side script..." }
```

### analyze_image

YONO-powered deep analysis. $0/image (local inference, zero cloud API calls).

```
Input:  { image_url: "https://example.com/car.jpg", include_comps: true }
Output: { make: "Porsche", confidence: 0.91, family: "german",
          vehicle_zone: "ext_front_driver", condition_score: 4,
          damage_flags: [], modification_flags: ["aftermarket_wheels"],
          photo_quality: 4, source: "yono", cost_usd: 0,
          comps: [...] }
```

### get_comps

Comparable vehicle sales from real auctions.

```
Input:  { make: "Porsche", model: "911", year: 1973, limit: 10 }
Output: { data: [...], summary: { count: 10, avg_price: 142000, median_price: 135000,
          min_price: 89000, max_price: 245000, auction_event_count: 8 } }
```

Data from: Bring a Trailer, Mecum, Barrett-Jackson, RM Sotheby's, Cars & Bids, Gooding, Bonhams, PCarMarket, eBay Motors, and more.

### get_vehicle / list_vehicles

Standard CRUD for vehicle profiles with full filter support.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NUKE_API_KEY` | Yes* | Your Nuke API key (`nk_live_...`) |
| `NUKE_SERVICE_ROLE_KEY` | No | Supabase service role key (internal/dev use) |
| `NUKE_API_URL` | No | API base URL (defaults to production) |

*Either `NUKE_API_KEY` or `NUKE_SERVICE_ROLE_KEY` is required.

## Data

- **1,290,000+** vehicle profiles
- **1,360,000+** observations with full provenance
- **35M+** images indexed
- **11.7M+** auction comments analyzed
- **4.1M+** bids tracked
- **773K+** valuations at 6.3% MAPE
- **3,987** businesses identified
- **112+** data sources

All data points have provenance tracking and confidence scores. BaT has NO public API -- Nuke is the only way to access structured BaT data programmatically.

## Built by

Solo founder + Claude. The entire platform -- 300+ edge functions, 1000+ database tables, React frontend, Elixir API, YONO vision model -- was built by one person with AI.

## License

MIT
