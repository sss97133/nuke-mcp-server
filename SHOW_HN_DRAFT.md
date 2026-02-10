# Show HN Draft

## Title (pick one)

**Option A (recommended):**
Show HN: MCP server with 758K vehicle profiles, AI valuations, and image ID

**Option B:**
Show HN: Vehicle data API for AI agents – VIN lookup, valuations, image analysis

**Option C:**
Show HN: I built a 758K-vehicle MCP server solo with Claude

## URL
GitHub repo URL (not landing page)

## First Comment (post immediately after submission)

---

Hey HN — I built this solo over the past year, mostly pair-programming with Claude.

**What it is:** An MCP server that gives any AI agent access to a vehicle intelligence database. 758K vehicle profiles aggregated from 10+ sources (Bring a Trailer, Cars & Bids, RM Sotheby's, Mecum, eBay, Craigslist, forums, and more).

**6 tools any agent can use:**
- `search_vehicles` — VIN, URL, year, text → vehicle results with thumbnails
- `extract_listing` — paste any car listing URL, get structured data back
- `get_vehicle_valuation` — 8-signal valuation engine (comps, condition, rarity, sentiment, bid curves, market trends, survival rates, originality)
- `identify_vehicle_image` — photo → year/make/model/trim with confidence score
- Plus basic CRUD for vehicle profiles

**Why I built it:** I'm a car person who got tired of vehicle data being scattered across a dozen platforms with no way to aggregate it programmatically. Started building extractors, ended up with 181 of them feeding 758K profiles with full provenance tracking.

**The thesis:** Vehicle data is going to be consumed by agents, not humans browsing websites. When someone asks their AI assistant "is this a good deal?" the agent needs structured vehicle intelligence to answer. That's what this provides.

**Technical details:**
- 300+ Supabase edge functions (Deno/TypeScript)
- PostgreSQL with 300+ tables, pgvector for embeddings
- Multi-provider AI pipeline (Claude, GPT-4o, Gemini) with automatic fallback
- React frontend, Elixir/Phoenix API
- Every data point has provenance tracking and confidence scores

**What I learned building with AI:** The entire codebase — every extractor, every edge function, the frontend, the API — was built by one person with Claude. The bottleneck isn't writing code anymore, it's knowing what to build. I spent more time on schema design and data modeling than on implementation.

**Free tier:** [X] API calls/month, enough to play with. Happy to bump limits for anyone building something interesting with it.

Would love feedback on the tool surface — what tools would you want an automotive data MCP server to have?

---

## Timing
- **When**: Sunday, 8:00 AM EST
- **Stay online**: 2-4 hours minimum, respond to every comment
- **Tone**: Technical, honest about limitations, no marketing speak

## Backup comments (have ready)

**If asked "why not just use Carfax/KBB?":**
Carfax tells you if a car was in an accident. KBB gives you a generic book value. Neither gives you: what the auction community thought about this specific car (sentiment from 364K analyzed comments), what comparable cars actually sold for in the last 90 days, or structured data extracted from the original listing. This is the difference between a phone book and a graph database.

**If asked about data quality:**
Every data point has provenance — we know which source it came from, when it was extracted, what confidence level the extraction has, and whether multiple sources agree. We don't guess. The valuation engine won't return a result if it doesn't have enough signal.

**If asked about the business model:**
Data licensing, premium vehicle reports, and margin on AI-commissioned services (the long-term vision is bots that identify undervalued vehicles needing specific repairs, then commission vetted tradespeople to do the work). But right now I just want people using the data and telling me what's useful.

**If skepticism about AI-built:**
Fair. But 758K profiles with real data from real sources isn't a demo. I've been running extraction pipelines for a year. The AI helped me write code 10x faster, but the data architecture, the extraction logic, the edge cases — that's thousands of hours of domain knowledge. Claude is a force multiplier, not a replacement for knowing what you're building.
