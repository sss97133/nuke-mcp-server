# MCP Registry Submissions

**Goal:** Get Nuke Vehicle Intelligence MCP listed on every major MCP directory before Vehicle Databases ships their competing automotive MCP.

**Package:** `@sss97133/nuke-mcp-server`
**Repo:** https://github.com/sss97133/nuke-mcp-server
**Install:** `npx -y @sss97133/nuke-mcp-server`

---

## BLOCKER: npm publish

The package is NOT yet published to npm. All registries except Glama require a published npm package.

```bash
cd /Users/skylar/nuke/mcp-server
npm run build
npm login
npm publish --access public
```

Verify: `npm view @sss97133/nuke-mcp-server`

---

## 1. Official MCP Registry (HIGHEST PRIORITY)

**URL:** https://registry.modelcontextprotocol.io
**Status:** [ ] Not submitted
**Type:** CLI tool (`mcp-publisher`)
**Blocks on:** npm publish

### Prerequisites
- [x] `server.json` created (in mcp-server/)
- [x] `mcpName` field added to package.json
- [ ] npm package published
- [ ] GitHub repo synced with latest code

### Steps

```bash
# Install the publisher CLI
brew install mcp-publisher

# Authenticate (uses GitHub OAuth - namespace io.github.sss97133)
mcp-publisher login github

# Publish to registry
cd /Users/skylar/nuke/mcp-server
mcp-publisher publish
```

### server.json (already created)

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-07-09/server.schema.json",
  "name": "io.github.sss97133/nuke-vehicle-data",
  "description": "Access the world's largest structured collector vehicle database. 1.29M vehicles, $19.8B tracked auction GMV, 4.18M bids, 11.7M comments. Real-time vehicle search, valuations, comparables, listing extraction, and AI-powered photo analysis via YONO vision model.",
  "version": "0.3.0",
  "repository": {
    "url": "https://github.com/sss97133/nuke-mcp-server"
  },
  "packages": [
    {
      "registry_type": "npm",
      "identifier": "@sss97133/nuke-mcp-server",
      "version": "0.3.0"
    }
  ]
}
```

### Verify after publish
```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.sss97133/nuke-vehicle-data"
```

---

## 2. Smithery.ai

**URL:** https://smithery.ai
**Status:** [ ] Not submitted
**Type:** CLI (`smithery mcp publish`)
**Blocks on:** npm publish

### Steps

```bash
# Install Smithery CLI
npm install -g @smithery/cli

# Authenticate
smithery auth login

# Publish (URL = npm package or GitHub repo)
smithery mcp publish "https://github.com/sss97133/nuke-mcp-server" -n @sss97133/nuke-vehicle-data
```

### Benefits
- Usage analytics and tool call tracking
- Discoverability to Smithery's user base (2,880+ MCP servers)
- Built-in infrastructure for hosting

---

## 3. Glama.ai

**URL:** https://glama.ai/mcp/servers
**Status:** [ ] Not submitted
**Type:** Automatic indexing from GitHub
**Blocks on:** Nothing (auto-indexes public GitHub repos)

### How it works
Glama automatically discovers and indexes MCP servers from GitHub. With 18,374+ servers listed, it's the largest directory. Once the GitHub repo is public and has proper package.json metadata + README, Glama should auto-index it.

### Speed up indexing
Submit the GitHub URL at https://glama.ai/mcp/servers (look for "Add Server" option).

Alternatively, add `.well-known/glama.json` to nuke.ag:
```json
{
  "maintainer_email": "skylar@nuke.ag"
}
```

### Verify
Search for "nuke" at https://glama.ai/mcp/servers?query=nuke

---

## 4. MCP.so

**URL:** https://mcp.so
**Status:** [ ] Not submitted
**Type:** GitHub issue submission
**Blocks on:** npm publish (recommended)

### Steps
Create a new issue at the mcp.so GitHub repository with the server details.

### Submission content

**Title:** Nuke Vehicle Intelligence MCP Server

**Body:**
```
Name: Nuke Vehicle Intelligence MCP
GitHub: https://github.com/sss97133/nuke-mcp-server
npm: @sss97133/nuke-mcp-server
Install: npx -y @sss97133/nuke-mcp-server

Description:
Access the world's largest structured collector vehicle database.
1.29M vehicles, $19.8B in tracked auction GMV, 4.18M bids, 11.7M comments, 35M images.
Real-time vehicle search, AI valuations, comparable sales, listing extraction from any URL,
and $0/image AI photo analysis via YONO vision model.

Category: Data / Automotive / Finance

Tools (10):
- search_vehicles: Quick search by VIN, URL, year, make/model, or text
- search_vehicles_api: Full-text search with filters, pagination, valuations
- extract_listing: Extract structured data from any car listing URL
- get_vehicle_valuation: Multi-signal market valuation (The Nuke Estimate)
- get_valuation: Cached valuation lookup by vehicle_id or VIN
- identify_vehicle_image: AI vision: photo -> year/make/model/trim
- analyze_image: YONO vision: make, condition, zone, damage ($0/image)
- get_comps: Comparable auction sales with price statistics
- get_vehicle: Fetch vehicle profile by ID
- list_vehicles: List vehicles with filters

Auth: API key (NUKE_API_KEY)
Data sources: Bring a Trailer, Cars & Bids, Mecum, Barrett-Jackson, RM Sotheby's, eBay Motors, Craigslist, and 100+ more
License: MIT
```

---

## 5. PulseMCP

**URL:** https://www.pulsemcp.com/servers
**Status:** [ ] Not submitted
**Type:** Form submission at pulsemcp.com/submit + auto-indexing
**Blocks on:** npm publish

### Steps
Submit at https://www.pulsemcp.com/submit

### Submission content

**Server Name:** Nuke Vehicle Intelligence MCP
**GitHub URL:** https://github.com/sss97133/nuke-mcp-server
**npm Package:** @sss97133/nuke-mcp-server
**Description:** Access the world's largest structured collector vehicle database. 1.29M vehicles, $19.8B tracked auction GMV. Vehicle search, AI valuations, comparable sales, listing extraction, and YONO vision analysis at $0/image.
**Category:** Data

PulseMCP also auto-indexes from npm and the Official MCP Registry, so publishing to those first may trigger automatic listing.

---

## 6. Cline MCP Marketplace

**URL:** https://github.com/cline/mcp-marketplace
**Status:** [ ] Not submitted
**Type:** GitHub issue (template-based)
**Blocks on:** npm publish, 400x400 PNG logo

### Steps
1. Create 400x400 PNG logo for the server
2. Test installation: give Cline just the README.md and verify it can set up the server
3. Submit: https://github.com/cline/mcp-marketplace/issues/new?template=mcp-server-submission.yml

### Required fields

**GitHub Repo URL:** https://github.com/sss97133/nuke-mcp-server

**Logo:** 400x400 PNG (needs to be created -- use Nuke brand icon)

**Reason for addition:**
```
Nuke is the only MCP server that gives AI agents access to structured collector vehicle data at scale.

- 1.29M vehicle profiles from 112+ sources (BaT, C&B, Mecum, Barrett-Jackson, RM Sotheby's, eBay Motors, etc.)
- AI-powered valuations using 8 signals (comparable sales, condition, rarity, sentiment, bid curves, market trends)
- $0/image vehicle photo analysis via YONO local vision model
- Extract structured vehicle data from ANY car listing URL
- Comparable auction sales with price statistics

Use cases: AI agents that help users buy/sell collector cars, auto insurance underwriting, dealer inventory pricing, automotive content creation, fleet management, and market research.
```

**Tested with Cline:** [ ] Confirm tested (must test before submitting)

---

## 7. MCP Market

**URL:** https://mcpmarket.com
**Status:** [ ] Not submitted
**Type:** Form submission at mcpmarket.com/submit
**Blocks on:** npm publish, 400x400 PNG logo

### Steps
Submit at https://mcpmarket.com/submit

**GitHub Repository:** https://github.com/sss97133/nuke-mcp-server
**Logo:** 400x400 PNG

---

## 8. MCPServers.org (punkpeye/awesome-mcp-servers)

**URL:** https://mcpservers.org / https://github.com/punkpeye/awesome-mcp-servers
**Status:** [ ] Not submitted
**Type:** Submit at mcpservers.org/submit (feeds into punkpeye list)
**Blocks on:** npm publish

### Steps
Submit at https://mcpservers.org/submit

OR fork the repo and submit a PR to README.md:

### PR content (add under "Finance & Fintech" section, alphabetically after "Financial Datasets")

```markdown
- [sss97133/nuke-mcp-server](https://github.com/sss97133/nuke-mcp-server) 📇 ☁️ - 1.29M collector vehicle profiles, AI valuations, comparable auction sales, $0/image YONO photo analysis, and structured data extraction from any car listing URL. 112+ sources including BaT, Mecum, Barrett-Jackson, RM Sotheby's.
```

Legend: 📇 = TypeScript, ☁️ = Cloud API

---

## 9. Awesome MCP Servers (wong2)

**URL:** https://github.com/wong2/awesome-mcp-servers
**Status:** [ ] Not submitted
**Type:** Pull request to README.md
**Blocks on:** Nothing (just needs repo URL)

### PR content (add to "Community Servers" section, alphabetically after "NocoDB")

```markdown
- **[Nuke Vehicle Intelligence](https://github.com/sss97133/nuke-mcp-server)** - Search 1.29M collector vehicle profiles, get AI valuations, comparable auction sales, $0/image YONO photo analysis, and extract structured data from any car listing URL. 112+ sources including BaT, Mecum, Barrett-Jackson, RM Sotheby's.
```

---

## 10. Awesome MCP Servers (appcypher)

**URL:** https://github.com/appcypher/awesome-mcp-servers
**Status:** [ ] Not submitted
**Type:** Pull request to README.md
**Blocks on:** Nothing (just needs repo URL)

### PR content

```markdown
- [Nuke Vehicle Intelligence](https://github.com/sss97133/nuke-mcp-server) - Search 1.29M vehicle profiles, get AI valuations and comparable sales, analyze vehicle photos ($0/image), and extract structured data from any car listing URL.
```

---

## 11. Composio

**URL:** https://composio.dev
**Status:** [ ] Not submitted (low priority)
**Type:** OpenAPI spec + integrations.yaml + manual review
**Timeline:** 1-2 weeks for review
**Blocks on:** OpenAPI spec creation

### Notes
Requires creating an OpenAPI spec for the Nuke API and configuring an integrations.yaml file. Lower priority than the above registries but worth doing for the enterprise audience.

---

## 12. LobeHub MCP Servers

**URL:** https://lobehub.com/mcp
**Status:** [ ] Not submitted
**Type:** Auto-indexed from GitHub + manual submit option
**Blocks on:** Nothing (auto-indexes)

### Steps
LobeHub auto-discovers MCP servers from GitHub. Visit https://lobehub.com/mcp and look for "Submit MCP" option if auto-indexing hasn't picked it up.

---

## 13. MCP Server Hub (mcpserver.dev)

**URL:** https://mcpserver.dev
**Status:** [ ] Not submitted
**Type:** Form submission
**Blocks on:** npm publish

### Steps
Submit at https://mcpserver.dev (look for Submit button).

---

## 14. MCP Hub (mcp-hub.info)

**URL:** https://mcp-hub.info
**Status:** [ ] Not submitted
**Type:** Web dashboard submission (provides Git repo URL)
**Blocks on:** Nothing

### Steps
Submit via web dashboard at mcp-hub.info. Provide Git repo URL -- they auto-analyze for vulnerabilities and assign a security score.

---

## Execution Order

**Phase 1 (do immediately):**
1. `npm publish --access public` (unblocks everything)
2. Push latest code to GitHub repo sss97133/nuke-mcp-server
3. Official MCP Registry (mcp-publisher publish)
4. Smithery (smithery mcp publish)

**Phase 2 (same day):**
5. PulseMCP (form at pulsemcp.com/submit)
6. Glama (auto-indexes, verify listing)
7. MCP.so (GitHub issue)

**Phase 3 (next day):**
8. Cline Marketplace (needs logo + Cline testing)
9. MCP Market (needs logo)
10. MCPServers.org (submit form or PR)
11. awesome-mcp-servers PRs (wong2, appcypher)
12. LobeHub (auto-index or manual submit)
13. MCP Server Hub (form at mcpserver.dev)
14. MCP Hub (dashboard at mcp-hub.info)

**Phase 4 (if time permits):**
15. Composio (needs OpenAPI spec)

---

## Shared Description (copy-paste ready)

### Short (1 line)
```
Search 1.29M collector vehicles, get AI valuations, comparable auction sales, and $0/image photo analysis.
```

### Medium (2-3 lines)
```
Access the world's largest structured collector vehicle database. 1.29M vehicles, $19.8B tracked auction GMV, 4.18M bids, 11.7M comments. Real-time vehicle search, AI valuations, comparable sales, listing extraction, and YONO vision analysis.
```

### Long (paragraph)
```
Nuke Vehicle Intelligence MCP gives AI agents access to the world's largest structured collector vehicle database. 1.29M vehicle profiles aggregated from 112+ sources including Bring a Trailer, Cars & Bids, Mecum, Barrett-Jackson, RM Sotheby's, eBay Motors, and more. Features include multi-signal AI valuations ("The Nuke Estimate"), comparable auction sales with price statistics, structured data extraction from any car listing URL, and $0/image vehicle photo analysis powered by YONO (You Only Nuke Once) local vision model. 10 tools: search, advanced search, extract listing, compute valuation, cached valuation, identify image, analyze image, get comps, get vehicle, list vehicles. All data points include provenance tracking and confidence scores.
```

### Keywords
```
mcp, mcp-server, model-context-protocol, vehicle-data, automotive, vin-lookup, car-valuation, ai-agents, collector-cars, auction-data, bring-a-trailer, vehicle-identification, image-analysis
```
