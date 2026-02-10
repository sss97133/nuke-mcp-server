# Nuke MCP Server

Vehicle intelligence for AI agents. Search 758K+ vehicle profiles, extract listings, get AI valuations, identify cars from photos.

```
npx -y @anthropic-skylar/nuke-mcp-server
```

## What it does

Nuke is a vehicle data platform with 758K profiles, 627K observations, and 181 extraction tools aggregating data from Bring a Trailer, Cars & Bids, RM Sotheby's, Mecum, eBay Motors, Craigslist, forums, and more.

This MCP server gives any AI agent access to that data through 6 tools:

| Tool | Description |
|------|-------------|
| `search_vehicles` | Search by VIN, URL, year, make/model, or free text |
| `extract_listing` | Extract structured data from any car listing URL |
| `get_vehicle_valuation` | Multi-signal market valuation ("The Nuke Estimate") |
| `identify_vehicle_image` | AI vision: photo → year/make/model/trim with confidence |
| `get_vehicle` | Fetch a vehicle profile by ID |
| `list_vehicles` | List vehicles (yours or public) |

## Setup

### 1. Get an API key

Sign up at [nuke.run](https://nuke.run) and generate an API key in Settings.

### 2. Configure your MCP client

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nuke": {
      "command": "npx",
      "args": ["-y", "@anthropic-skylar/nuke-mcp-server"],
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
      "args": ["-y", "@anthropic-skylar/nuke-mcp-server"],
      "env": {
        "NUKE_API_KEY": "nk_live_your_key_here"
      }
    }
  }
}
```

#### Cursor

Add to Cursor Settings → MCP Servers:

```json
{
  "nuke": {
    "command": "npx",
    "args": ["-y", "@anthropic-skylar/nuke-mcp-server"],
    "env": {
      "NUKE_API_KEY": "nk_live_your_key_here"
    }
  }
}
```

## Example prompts

Once configured, you can ask your AI agent:

- "What's a 1973 Porsche 911 worth right now?"
- "Extract the vehicle data from this BaT listing: https://bringatrailer.com/listing/..."
- "What car is in this photo?" (with image URL)
- "Search for all BMW M3 E30s in the database"
- "Look up VIN WP0AB2966NS420176"

## Tools in detail

### search_vehicles

Accepts any input and returns rich results with thumbnails.

```
Input:  { query: "1967 Mustang", limit: 5 }
Output: { results: [...], query_type: "text", total_count: 142 }
```

Query types auto-detected:
- **VIN** (17 chars) → direct vehicle lookup
- **URL** → routes to extraction
- **Year** (4 digits) → vehicles from that year
- **Text** → multi-entity search across vehicles, orgs, users

### extract_listing

Works on any car listing URL. No configuration needed.

```
Input:  { url: "https://bringatrailer.com/listing/1988-porsche-911-turbo-68" }
Output: { year: 1988, make: "Porsche", model: "911", trim: "Turbo", vin: "...", ... }
```

Supported sources include: Bring a Trailer, Cars & Bids, Hagerty, PCarMarket, RM Sotheby's, Mecum, Gooding, Bonhams, eBay Motors, Craigslist, Facebook Marketplace, Collecting Cars, and any generic listing page.

### get_vehicle_valuation

8-signal valuation engine:

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

### identify_vehicle_image

Tiered AI approach: Gemini Flash → GPT-4o-mini → GPT-4o for cost efficiency.

```
Input:  { image_url: "https://example.com/car.jpg" }
Output: { year: 1973, make: "Porsche", model: "911", trim: "Carrera RS",
          body_style: "coupe", generation: "G-Series", confidence: 0.87,
          reasoning: "Distinctive ducktail spoiler, Carrera side script..." }
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NUKE_API_KEY` | Yes | Your Nuke API key (`nk_live_...`) |
| `NUKE_API_URL` | No | API base URL (defaults to production) |

## Data

- **758,000+** vehicle profiles
- **627,000+** observations with full provenance
- **491,000+** resolved identities across platforms
- **364,000+** auction comments analyzed
- **1,000,000+** images indexed
- **2,295** businesses identified
- **132,000+** Bring a Trailer listings

All data points have provenance tracking and confidence scores.

## Built by

Solo founder + Claude. The entire platform — 181 extraction tools, 300+ database tables, React frontend, Elixir API — was built by one person with AI.

## License

MIT
