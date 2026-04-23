# Minimum Discoverability Matrix

This matrix defines required discovery surfaces for first-class internal services and MCP-capable services.

## First-Class Internal Services

Every first-class service must expose all of the following:

- `/api/docs`
- `/api/health`
- `/api/version`
- `/api/capabilities`
- `/llms.txt`
- `/llms-full.txt`
- `/robots.txt`
- `/sitemap.xml`

## MCP-Capable Internal Services

MCP-capable services must additionally expose:

- `/api/mcp`

And include this contract in discoverable metadata:

```json
{
  "service": "platphorm-mcp",
  "role": "mcp_global",
  "version": "0.1.0",
  "supports": {
    "docs": true,
    "mcp": true,
    "sse": true,
    "callbacks": true,
    "auth": false
  },
  "mcp": {
    "endpoint": "/api/mcp",
    "protocol_versions": ["2025-11-25"],
    "tools": true,
    "resources": true,
    "prompts": true
  }
}
```

## External Registration Targets

- Network Graph: `https://platphormnes.com/api/network/graph`
- MCP Registry: `https://mcp.platphormnews.com/api/mcp/register`

## Ecosystem Support Targets

- MCP Hub: `https://mcp.platphormnews.com`
- Trace: `https://trace.platphormnews.com`
- Kanban: `https://kanban.platphormnews.com`

## Verification Checklist

- `GET /api/docs` returns OpenAPI JSON
- `GET /api/health` returns service and DB status
- `GET /api/version` returns build/runtime metadata
- `GET /api/capabilities` returns capability contract and matrix
- `GET /api/mcp` returns MCP metadata including protocol versions
- `GET /llms.txt` and `GET /llms-full.txt` include discovery links
- `GET /robots.txt` includes sitemap and discovery references
- `GET /sitemap.xml` includes all required discovery routes
