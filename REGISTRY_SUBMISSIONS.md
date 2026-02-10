# Registry Submission Checklist

## Pre-submission
- [ ] npm package published (`npm publish --access public`)
- [ ] GitHub repo created (or moved to public subdirectory)
- [ ] README polished with install instructions
- [ ] Tested with Claude Desktop, Claude Code, and Cursor

## 1. Official MCP Registry (PRIORITY)
**URL**: registry.modelcontextprotocol.io
**Process**:
```bash
npm install -g mcp-publisher
cd /Users/skylar/nuke/mcp-server
mcp-publisher init          # Creates server.json
mcp-publisher login github  # Authenticate
mcp-publisher publish       # Submit
```
**Requires**: npm package must be published first, "mcpName" field in package.json

## 2. Smithery.ai
**URL**: smithery.ai
**Process**: `smithery publish` CLI or submit URL
**Benefits**: Usage analytics, tool call tracking

## 3. Glama.ai
**URL**: glama.ai/mcp
**Process**: Publish `/.well-known/glama.json` on nuke.run:
```json
{
  "maintainer_email": "skylar@nuke.run"
}
```
**Scale**: 6,150+ servers, largest directory

## 4. Awesome-MCP-Servers (GitHub PRs)
Submit PRs to these repos:
- [ ] github.com/wong2/awesome-mcp-servers
- [ ] github.com/punkpeye/awesome-mcp-servers
- [ ] github.com/appcypher/awesome-mcp-servers
- [ ] github.com/TensorBlock/awesome-mcp-servers

**Category**: "Data" or "Automotive" (propose new category)
**Format**: `- [Nuke Vehicle Data](https://github.com/...) - Search 758K vehicle profiles, extract listings, get AI valuations, identify cars from photos`

## 5. PulseMCP
**URL**: pulsemcp.com/servers
**Process**: Automatic indexing from npm/GitHub. Verify listing after publish.

## 6. MCP.so
**URL**: mcp.so
**Process**: Submit through their form after npm publish.

## 7. Composio
**URL**: composio.dev
**Process**: Create OpenAPI spec, configure integrations.yaml, submit for review.
**Timeline**: 1-2 weeks for review

## 8. MCP Market
**URL**: mcpmarket.com
**Process**: Automatic listing from npm registry.

## Post-submission
- [ ] Monitor analytics on Smithery
- [ ] Respond to issues within 24h
- [ ] Write blog post about the launch
- [ ] Post on r/ClaudeAI, r/LocalLLaMA
- [ ] Share on Twitter/LinkedIn
