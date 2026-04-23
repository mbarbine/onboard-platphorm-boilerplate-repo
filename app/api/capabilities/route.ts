import { NextResponse } from 'next/server'
import { sql, DEFAULT_TENANT_ID } from '@/lib/db'
import {
  BASE_URL as DEFAULT_BASE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  SERVICE_NAME,
  ECOSYSTEM,
  MCP_REGISTRY_URL,
  NETWORK_GRAPH_URL,
} from '@/lib/site-config'

export const dynamic = 'force-dynamic'

async function getBaseUrl(): Promise<string> {
  try {
    const result = await sql`SELECT value FROM settings WHERE tenant_id = ${DEFAULT_TENANT_ID} AND key = 'base_url'`
    if (result[0]?.value) return JSON.parse(result[0].value as string)
  } catch {
    // ignore; fall back to static config
  }
  return DEFAULT_BASE_URL
}

export async function GET() {
  const baseUrl = await getBaseUrl()

  const firstClassServices = [
    `${baseUrl}/api/docs`,
    `${baseUrl}/api/health`,
    `${baseUrl}/api/version`,
    `${baseUrl}/api/capabilities`,
    `${baseUrl}/llms.txt`,
    `${baseUrl}/llms-full.txt`,
    `${baseUrl}/robots.txt`,
    `${baseUrl}/sitemap.xml`,
  ]

  const response = {
    service: 'platphorm-mcp',
    role: 'mcp_global',
    version: '0.1.0',
    supports: {
      docs: true,
      mcp: true,
      sse: true,
      callbacks: true,
      auth: false,
    },
    mcp: {
      endpoint: '/api/mcp',
      protocol_versions: ['2025-11-25'],
      tools: true,
      resources: true,
      prompts: true,
    },
    metadata: {
      site_name: SITE_NAME,
      description: SITE_DESCRIPTION,
      service_name: SERVICE_NAME,
      base_url: baseUrl,
      generated_at: new Date().toISOString(),
    },
    discoverability: {
      minimum_matrix: {
        first_class_internal_services: firstClassServices,
        mcp_capable_internal_services: [`${baseUrl}/api/mcp`],
      },
      endpoints: {
        docs: `${baseUrl}/api/docs`,
        health: `${baseUrl}/api/health`,
        version: `${baseUrl}/api/version`,
        capabilities: `${baseUrl}/api/capabilities`,
        llms_txt: `${baseUrl}/llms.txt`,
        llms_full: `${baseUrl}/llms-full.txt`,
        robots: `${baseUrl}/robots.txt`,
        sitemap: `${baseUrl}/sitemap.xml`,
      },
      ecosystem: {
        mcp_hub: ECOSYSTEM.mcp,
        trace: ECOSYSTEM.trace,
        kanban: ECOSYSTEM.kanban,
      },
    },
    registration: {
      mcp_registry_url: MCP_REGISTRY_URL,
      network_graph_url: NETWORK_GRAPH_URL,
      network_graph_endpoint: 'https://platphormnes.com/api/network/graph',
    },
  }

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, max-age=600',
      'Content-Type': 'application/json',
    },
  })
}
