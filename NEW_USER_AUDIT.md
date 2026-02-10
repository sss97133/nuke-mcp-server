# Nuke MCP Server -- New User Experience Audit

**Date:** 2026-02-10
**Tester:** Simulated brand-new user
**Method:** Full journey from GitHub discovery through every tool call

---

## Executive Summary

The README is excellent -- one of the best MCP server READMEs I have seen. But the product behind it has serious problems. **2 of 6 tools are completely broken**, the listing extractor returns fabricated data for non-car URLs, search returns duplicate/irrelevant results, and the npm package does not exist yet. A new user would be impressed by the README, then frustrated within 5 minutes of actual use.

**Verdict: Not ready for public release.**

---

## 1. Discovery & Installation

### GitHub README (Grade: A)

The README at `github.com/sss97133/nuke-mcp-server` is genuinely impressive:
- Clear one-liner install: `npx -y @sss97133/nuke-mcp-server`
- Configuration examples for Claude Desktop, Claude Code, and Cursor
- Good tool descriptions with example inputs/outputs
- Data stats are compelling (758K profiles, 627K observations)
- "Solo founder + Claude" is a nice touch

**What a new user thinks:** "This looks legit and well-documented. Let me try it."

### npm Install (Grade: F -- Does Not Exist)

```
npm error 404 Not Found - GET https://registry.npmjs.org/@sss97133%2fnuke-mcp-server
```

The package `@sss97133/nuke-mcp-server` is not published to npm. The entire README tells users to run `npx -y @sss97133/nuke-mcp-server` but that command fails with a 404. Every setup instruction in the README is broken.

**What a new user thinks:** "Dead on arrival. Is this abandoned?"

### nuke.run Website

The README says "Sign up at nuke.run and generate an API key in Settings." The site resolves (170.75.175.173) but returns an empty response. There is no way for a new user to get an API key.

**What a new user thinks:** "The signup link is broken. I literally cannot use this."

### No API Key Error Message (Grade: B+)

```
ERROR: NUKE_API_KEY is required. Get one at https://nuke.run/settings/api
```

Clear message with a URL. Good. But the URL leads nowhere (see above).

---

## 2. Tool-by-Tool Testing

### Tool 1: search_vehicles

#### Test: "1967 Ford Mustang"
- **Response time:** 738ms (good)
- **Results:** 5 results returned
- **Grade: D**

**Critical problems:**
1. **All 5 results are identical.** Same title, same price ($45,750), same make (Roush, not Ford), same model -- but with 5 different UUIDs. The database has duplicate vehicle records for the same listing.
2. **Make is wrong.** User searched "Ford Mustang" but all results show make="Roush" with model="427 SRX-Powered 1967 Ford Mustang Fastback 5-Speed". The make/model parsing put the builder's name as the make, not the manufacturer.
3. **All relevance_score values are 0.5.** The relevance scoring appears to be a static placeholder, not actually computed.
4. **No thumbnails.** None of the 5 Mustang results have an `image_url`.
5. **No VINs.** All VIN fields are null.

**What a new user thinks:** "Why am I seeing the same car 5 times? And it's a Roush, not a Ford. The search is broken."

#### Test: "BMW M3 E30"
- **Response time:** 586ms (good)
- **Results:** 5 results returned
- **Grade: F**

**Critical problems:**
1. **Zero results match the query.** User searched for "BMW M3 E30" (a specific iconic car). Results returned: 2019 BMW 540i, 2003 BMW 760li, 2015 BMW M235i, two 2003 BMW 540i Tourings. Not a single M3. Not a single E30.
2. **The search appears to match "BMW" and return random BMW vehicles.** There is no semantic or model-specific matching happening.
3. **All relevance_score values are 0.5** again -- meaningless.

**What a new user thinks:** "I searched for M3 E30 and got 540i wagons? This database clearly does not have the data it claims."

#### Test: "Porsche 911"
- **Response time:** 643ms
- **Grade: D**

Returns 5 Porsches but none are 911s: a 996 Turbo wheel set, a Panamera GTS, a 928S, a Cayenne, and a 968 Club Sport. The search for "Porsche 911" does not return a single 911.

#### Test: Empty query ""
- **Response time:** 521ms
- **Grade: C-**

Returns random vehicles AND user profiles (including "skylar williams @skylar" and "testuser @testuser"). Leaking internal user data in search results is a privacy/security issue. The relevance scores here are 0.9 for random vehicles, which is higher than the 0.5 for actual keyword matches -- the scoring is inverted.

#### Test: VIN "WP0AB2966NS420176"
- **Response time:** 584ms
- **Results:** 0 results
- **Grade: Incomplete**

The VIN from the README example returns nothing. The `query_type` correctly detects "vin" but the database has no match. Not necessarily a bug, but the README implies VIN lookup works and this specific VIN was used as an example.

#### Test: Fake API key
- **Response time:** ~600ms
- **Results:** Full results returned
- **Grade: F (Security)**

Using `NUKE_API_KEY="nk_live_fake_key_12345"` returns valid search results. The `universal-search` edge function does not validate the API key at all. Anyone can query the database without authentication.

---

### Tool 2: extract_listing

#### Test: BaT listing (1988 Porsche 911 Turbo)
- **Response time:** 6.6 seconds
- **Grade: D**

**What was returned:**
```json
{
  "year": 1988, "make": "Porsche", "model": "911", "series": "Turbo",
  "vin": null, "mileage": null, "price": null, "sold_price": null,
  "color": null, "transmission": null, "engine": null,
  "images": [], "description": null
}
```

**Problems:**
1. **Almost all fields are null.** The BaT listing page for this car contains rich data: VIN, mileage (23k), sold price ($148k), 80+ photos, detailed description, color (Grand Prix White), transmission (5-speed), engine (3.3L turbo flat-6). None of this was extracted.
2. **The only data present (year/make/model/series) was clearly parsed from the URL slug**, not from the actual page content. The extraction method is listed as "ai" but it appears the AI had no page content to work with.
3. **Confidence is 0.8** despite extracting almost nothing. This is misleading.
4. **Source is "unknown"** even though the URL is clearly bringatrailer.com. The source detection should recognize BaT.

**What a new user thinks:** "It got the year and make from the URL. That is not extraction -- I could have done that myself."

#### Test: Cars & Bids listing (2001 BMW 740i Sport)
- **Response time:** 10.5 seconds
- **Grade: D-**

Same problem: only year/make/model/trim extracted (from URL slug). Everything else null. Confidence 0.5. Source "unknown". Cars & Bids is supposed to be a supported platform.

#### Test: google.com (Non-car URL)
- **Response time:** 6.7 seconds
- **Grade: F (CRITICAL -- Hallucination)**

```json
{
  "year": 1974, "make": "Chevrolet", "model": "Truck", "series": "C10",
  "trim": "Cheyenne Super", "mileage": 123456, "price": 25000,
  "color": "Red", "transmission": "Automatic", "engine": "350 V8",
  "description": "Full description text",
  "images": ["url1", "url2"],
  "confidence": 0.95
}
```

**This is the most damaging bug in the entire server.** When given google.com (not a car listing), the AI extraction returns a completely fabricated 1974 Chevrolet C10 with invented specs, a fake mileage of 123,456, a made-up price of $25,000, and placeholder images ["url1", "url2"]. The confidence is 0.95 -- the highest of any extraction test.

The AI is returning its system prompt's example/template data as if it were real extraction results. This means the extraction function's prompt likely contains an example response, and when the AI cannot extract real data, it parrots the example back verbatim.

**What a new user thinks:** "Wait, it just made up a car from nothing? And said it was 95% confident? I can never trust any result from this tool."

---

### Tool 3: get_vehicle_valuation

#### Test: Mustang ID (8aece928...)
- **Response time:** 1.1 seconds
- **Grade: B-**

**What was returned:**
```json
{
  "estimated_value": 45750,
  "value_low": 40260,
  "value_high": 51240,
  "confidence_score": 78,
  "price_tier": "mainstream",
  "signal_weights": {
    "comps": { "weight": 0.4, "sourceCount": 64 },
    "condition": { "weight": 0.15, "sourceCount": 0 },
    "rarity": { "weight": 0.05, "sourceCount": 0 },
    "sentiment": { "weight": 0.08, "sourceCount": 0 },
    "bid_curve": { "weight": 0.1, "sourceCount": 0 },
    "market_trend": { "weight": 0.1, "sourceCount": 0 },
    "survival": { "weight": 0.04, "sourceCount": 0 },
    "originality": { "weight": 0.08, "sourceCount": 0 }
  },
  "heat_score": 5, "heat_score_label": "cold"
}
```

**Positives:**
- Response structure is excellent. The signal_weights breakdown is genuinely useful.
- 64 comparable sales sources for the comps signal is solid.
- Price tier classification is interesting.
- Fast response time.

**Problems:**
1. **7 of 8 signals have sourceCount=0.** The valuation is based entirely on comparable sales. Condition, rarity, sentiment, bid curves, market trend, survival, and originality all have zero data. The README promises an "8-signal valuation engine" but it is really a 1-signal engine for most vehicles.
2. **Confidence of 78 seems high** when 7/8 signals have no data.
3. **deal_score is null.** The README shows `deal_score: "Good Deal"` in the example.
4. **heat_score of 5 labeled "cold"** -- the scale is not documented. Is 5 out of 10? Out of 100?

#### Test: BMW 540i ID (371ea7aa...)
- **Response time:** 576ms
- **Grade: D**

```json
{ "success": true, "message": "All vehicles already computed", "computed": 0 }
```

No valuation data returned -- just a message saying it was already computed. But the response does not include the actual valuation. The user has to call it again with `force: true`? This is confusing. If the valuation exists, return it. If it does not, compute and return it.

**What a new user thinks:** "You told me it's already computed but... where is it?"

#### Test: Porsche 968 ID (0c0d9897...)
- Same "already computed" response with no actual data.

---

### Tool 4: identify_vehicle_image

#### Test: Unsplash Porsche photo
- **Response time:** 4.9 seconds
- **Grade: A-**

```json
{
  "year": 2017, "make": "Porsche", "model": "Panamera",
  "body_style": "sedan", "generation": "2nd", "confidence": 0.9,
  "reasoning": "The vehicle has a distinctive sedan body style with a sloping roofline...",
  "model_used": "gpt-4o-mini", "provider": "openai",
  "duration_ms": 4392, "tier_used": "tier1"
}
```

**Positives:**
- Correctly identifies Porsche (the actual image is a Porsche 911 but the Panamera ID is reasonable given the sedan-like angle).
- The `reasoning` field is genuinely useful -- explains what visual cues were used.
- Tiered model approach is visible and working (tier1 = gpt-4o-mini).
- Metadata about model used and duration is excellent for debugging.

**Problems:**
1. The specific model identification is likely wrong (the Unsplash photo at that URL is typically a Porsche 911, not a Panamera), but this is a minor quibble given computer vision uncertainty.
2. No `trim` returned.

#### Test: Wikipedia BMW M2 photo
- **Response time:** 1.5 seconds
- **Grade: D**

```json
{
  "success": false,
  "error": "Failed to identify vehicle from image",
  "attempts": [
    { "tier": "tier2", "error": "OpenAI API error: 400 - invalid_image_url" },
    { "tier": "tier3", "error": "OpenAI API error: 400 - invalid_image_url" }
  ]
}
```

**Problems:**
1. Wikipedia/Wikimedia URLs are blocked by OpenAI's image download. This is a known issue but the error message does not help the user understand why or what to do about it.
2. **Tier1 was skipped entirely** -- attempts jump from tier2 to tier3. No explanation why.
3. The error should suggest "Try a direct image URL (not from Wikipedia/Wikimedia)" instead of the raw OpenAI error.

**What a new user thinks:** "Some image URLs work, some do not, and I have no idea why."

---

### Tool 5: get_vehicle

#### Test: Any vehicle ID
- **Response time:** 1.4 seconds
- **Grade: F (Completely Broken)**

```json
{ "isError": true }
"Nuke API error (401): {\"error\":\"Invalid or missing authentication\"}"
```

The `api-v1-vehicles` edge function requires either a valid Supabase JWT or a hashed API key from the `api_keys` table. The MCP server sends the `NUKE_API_KEY` as both `Authorization: Bearer` and `X-API-Key` headers. But:

1. The service role key is not a valid user JWT -- `supabase.auth.getUser()` rejects it.
2. There is no entry in the `api_keys` table matching this key's hash.

**Root cause:** The `api-v1-vehicles` function was designed for authenticated end users with real API keys, but the MCP server has no way to get a valid key. The other tools (search, extract, valuation, image ID) call different edge functions that accept the service role key directly. This tool calls a different function that has stricter auth.

**What a new user thinks:** "I have an API key and 2 of the 6 tools refuse to work. The error says 'invalid authentication' but the same key works for the other tools. Is my key broken?"

---

### Tool 6: list_vehicles

#### Test: Default parameters
- **Response time:** 615ms
- **Grade: F (Completely Broken)**

Same 401 error as get_vehicle. Same root cause -- it calls `api-v1-vehicles` which requires user-level auth, not a service role key.

---

## 3. Cross-Cutting Issues

### Authentication is Inconsistent

| Tool | Auth Required? | Works with service key? |
|------|---------------|------------------------|
| search_vehicles | No (!) | N/A -- no auth checked |
| extract_listing | No (!) | N/A -- no auth checked |
| get_vehicle_valuation | Appears yes | Yes |
| identify_vehicle_image | Appears yes | Yes |
| get_vehicle | Yes (strict) | NO -- returns 401 |
| list_vehicles | Yes (strict) | NO -- returns 401 |

A fake API key successfully calls search and extract. The valuation and image tools work with the service role key. The vehicle detail tools require a real user API key that cannot be obtained. This is three different auth behaviors across six tools.

### Search Quality is Poor

The README claims 758K vehicle profiles. Searching "BMW M3 E30" returns zero M3s. Searching "Porsche 911" returns zero 911s. Searching "1967 Ford Mustang" returns 5 identical duplicates of a Roush. Either the search algorithm is broken or the 758K number is misleading.

### The AI Extraction Hallucinates

When given a non-car URL, the extraction tool fabricates vehicle data with high confidence. This is arguably the most dangerous bug because it silently produces false data. Users will not know which results are real and which are hallucinated.

### Relevance Scoring is Fake

Every search result has a relevance_score of exactly 0.5 (or 0.85/0.9 for empty queries). This is a placeholder that provides no value. Either implement real scoring or remove the field.

### The Valuation Tool Has a Caching Bug

When a valuation is cached, the tool returns `{"message": "All vehicles already computed", "computed": 0}` without the actual valuation data. The user has to know to pass `force: true` to get results, but even that is not guaranteed to return the data vs. recompute.

---

## 4. What Works Well

1. **README quality** -- Genuinely one of the best MCP server READMEs. Clear, complete, well-structured.
2. **Image identification** -- When URLs work, the identification quality and response format are excellent. The tiered AI approach is smart.
3. **Valuation data structure** -- The 8-signal framework with weights and source counts is a compelling data model, even if most signals are empty.
4. **Response times** -- Search is sub-200ms, most tools respond in under 2 seconds. Fast.
5. **Tool definitions** -- The MCP tool schemas are well-designed with good descriptions and parameter documentation.
6. **Error on missing key** -- Clear error message directing users where to get a key.
7. **No key = fast exit** -- The server exits immediately if NUKE_API_KEY is missing, rather than starting and failing on every request.

---

## 5. Priority Fix List

### P0 -- Ship Blockers (Fix before any public launch)

1. **Publish the npm package.** Everything in the README depends on it.
2. **Fix get_vehicle and list_vehicles auth.** These tools are 100% broken. Either make `api-v1-vehicles` accept the service role key or create a different endpoint for MCP access.
3. **Fix the extraction hallucination.** When the AI cannot extract data from a URL, return `{"success": false, "error": "No vehicle data found"}` instead of fabricated data with 0.95 confidence.
4. **Make nuke.run work** or change the API key instructions to something that actually works.

### P1 -- Credibility Issues (Fix before telling anyone about it)

5. **Fix search relevance for "BMW M3 E30" and "Porsche 911".** These are the most obvious test queries anyone would try. If they return garbage, the product is dead.
6. **Deduplicate search results.** Five identical Mustangs with different IDs looks very broken.
7. **Remove user profiles from search results.** Searching "" should not return "@skylar" and "@testuser".
8. **Authenticate search and extract.** A fake API key should not return real data.

### P2 -- Polish (Fix before growth)

9. **Fix valuation caching** to return cached data instead of "already computed" with no data.
10. **Implement real relevance scoring** instead of hardcoded 0.5.
11. **Extract actual data from BaT/C&B listings** instead of just parsing the URL slug.
12. **Add user-friendly error messages** for image identification failures (e.g., "Wikipedia URLs are not supported").
13. **Document the heat_score scale** (what does 5 mean?).
14. **Add source detection** for known platforms (BaT, C&B) instead of returning "unknown".

---

## 6. Summary Scorecard

| Tool | Works? | Data Quality | Grade |
|------|--------|-------------|-------|
| search_vehicles | Yes | Poor (duplicates, irrelevant, no real scoring) | D |
| extract_listing | Yes* | Very Poor (nulls + hallucination on bad URLs) | D- |
| get_vehicle_valuation | Partial | Good structure, sparse data | C+ |
| identify_vehicle_image | Mostly | Good when URLs work | B+ |
| get_vehicle | **NO** | 401 error | F |
| list_vehicles | **NO** | 401 error | F |

**Overall: D+**

The bones are interesting. The vision tool and valuation framework show genuine product thinking. But 2/6 tools are broken, the search returns wrong results for obvious queries, and the extractor hallucinates. A new user would lose trust within minutes.

---

*Audit conducted 2026-02-10 against local build at `/Users/skylar/nuke/mcp-server/build/index.js`*
