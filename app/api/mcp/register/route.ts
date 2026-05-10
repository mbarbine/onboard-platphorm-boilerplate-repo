import { NextRequest, NextResponse } from 'next/server'
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SERVICE_NAME,
  MCP_REGISTRY_URL,
  NETWORK_GRAPH_URL,
  BASE_URL,
  ECOSYSTEM,
} from '@/lib/site-config'

/**
 * MCP Registry Registration Endpoint
 * 
 * This endpoint provides metadata for MCP registry services like mcp.platphormnews.com
 * to discover and index this MCP server.
 */

const FALLBACK_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : BASE_URL)

export async function GET(request: NextRequest) {
  const serverUrl = request.nextUrl.origin || FALLBACK_BASE_URL

  return NextResponse.json({
    // MCP Server Metadata
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    version: '1.0.0',
    service: 'platphorm-mcp',
    role: 'mcp_global',
    
    // MCP Endpoint
    mcp_endpoint: `${serverUrl}/api/mcp`,
    protocol: 'JSON-RPC 2.0',
    
    // Capabilities
    supports: {
      docs: true,
      mcp: true,
      sse: true,
      callbacks: true,
      auth: false,
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
      logging: false
    },
    
    // Available Tools
    tools: [
      {
        name: 'list_documents',
        description: 'List and filter documentation pages',
        parameters: ['query', 'category', 'status', 'limit', 'offset']
      },
      {
        name: 'get_document',
        description: 'Get a specific document by slug',
        parameters: ['slug']
      },
      {
        name: 'search_documents',
        description: 'Full-text search across all documentation',
        parameters: ['query', 'limit']
      },
      {
        name: 'create_document',
        description: 'Create a new documentation page',
        parameters: ['title', 'content', 'description', 'category', 'tags', 'status']
      },
      {
        name: 'update_document',
        description: 'Update an existing document',
        parameters: ['slug', 'title', 'content', 'description', 'category', 'tags', 'status']
      },
      {
        name: 'submit_content',
        description: 'Submit content for review from external sources',
        parameters: ['source_url', 'title', 'content', 'author_name', 'author_email']
      },
      {
        name: 'ingest_url',
        description: 'Fetch and ingest content from a URL',
        parameters: ['url', 'category', 'tags', 'auto_publish']
      },
      {
        name: 'list_categories',
        description: 'List all documentation categories',
        parameters: []
      }
    ],
    
    // Available Resources
    resources: [
      {
        uri: 'docs://all',
        name: 'All Documents',
        description: 'All published documentation pages',
        mimeType: 'application/json'
      },
      {
        uri: 'docs://categories',
        name: 'Categories',
        description: 'All documentation categories',
        mimeType: 'application/json'
      },
      {
        uri: 'docs://recent',
        name: 'Recent Documents',
        description: 'Recently published documentation',
        mimeType: 'application/json'
      },
      {
        uri: 'docs://{slug}',
        name: 'Document by Slug',
        description: 'Get specific document by slug',
        mimeType: 'text/markdown'
      }
    ],
    
    // API Endpoints (REST)
    api: {
      base_url: `${serverUrl}/api/v1`,
      documentation: `${serverUrl}/api/docs`,
      endpoints: [
        { method: 'GET', path: '/documents', description: 'List documents' },
        { method: 'POST', path: '/documents', description: 'Create document' },
        { method: 'GET', path: '/documents/{slug}', description: 'Get document' },
        { method: 'PUT', path: '/documents/{slug}', description: 'Update document' },
        { method: 'DELETE', path: '/documents/{slug}', description: 'Delete document' },
        { method: 'POST', path: '/submissions', description: 'Submit content' },
        { method: 'POST', path: '/ingest', description: 'Ingest from URL' },
        { method: 'GET', path: '/search', description: 'Search documents' },
        { method: 'GET', path: '/categories', description: 'List categories' }
      ]
    },
    
    // Discovery Files
    discovery: {
      capabilities: `${serverUrl}/api/capabilities`,
      llms_txt: `${serverUrl}/llms.txt`,
      llms_full: `${serverUrl}/llms-full.txt`,
      llms_index: `${serverUrl}/llms-index.json`,
      sitemap: `${serverUrl}/sitemap.xml`,
      rss: `${serverUrl}/rss.xml`,
      robots: `${serverUrl}/robots.txt`,
      openapi: `${serverUrl}/api/docs`
    },
    
    // Contact & Links
    links: {
      documentation: `${serverUrl}/docs`,
      api_docs: `${serverUrl}/docs/api`,
      mcp_docs: `${serverUrl}/docs/mcp`,
      submit: `${serverUrl}/submit`
    },
    ecosystem: {
      mcp_hub: ECOSYSTEM.mcp,
      trace: ECOSYSTEM.trace,
      graph: NETWORK_GRAPH_URL,
    },
    
    // Server Info
    server: {
      framework: 'Next.js 16',
      database: 'Neon PostgreSQL',
      features: [
        'Full-text search',
        'Multi-source submissions',
        'URL ingestion',
        'Webhook notifications',
        'API versioning',
        'LLM discovery files'
      ]
    },
    
    // Registration timestamp
    registered_at: new Date().toISOString()
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json'
    }
  })
}

export async function POST(request: NextRequest) {
  // Handle registration ping from MCP registries
  try {
    const body = await request.json()
    const serverUrl = request.nextUrl.origin || FALLBACK_BASE_URL
    const apiKey = process.env.PLATPHORM_API_KEY || ''

    const payload = {
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
        endpoint: `${serverUrl}/api/mcp`,
        protocol_versions: ['2025-11-25'],
        tools: true,
        resources: true,
        prompts: true,
      },
      discoverability: {
        docs: `${serverUrl}/api/docs`,
        health: `${serverUrl}/api/health`,
        version: `${serverUrl}/api/version`,
        capabilities: `${serverUrl}/api/capabilities`,
        llms_txt: `${serverUrl}/llms.txt`,
        llms_full: `${serverUrl}/llms-full.txt`,
        robots: `${serverUrl}/robots.txt`,
        sitemap: `${serverUrl}/sitemap.xml`,
      },
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    const [mcpRegistry, networkGraph] = await Promise.allSettled([
      fetch(MCP_REGISTRY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }),
      fetch(NETWORK_GRAPH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }),
    ])
    
    return NextResponse.json({
      success: true,
      message: 'Registration acknowledged',
      server: {
        name: SITE_NAME,
        mcp_endpoint: `${serverUrl}/api/mcp`,
        version: '1.0.0'
      },
      registration: {
        mcp_registry: {
          endpoint: MCP_REGISTRY_URL,
          status:
            mcpRegistry.status === 'fulfilled'
              ? mcpRegistry.value.status
              : 'failed',
        },
        network_graph: {
          endpoint: NETWORK_GRAPH_URL,
          status:
            networkGraph.status === 'fulfilled'
              ? networkGraph.value.status
              : 'failed',
        },
      },
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch {
    return NextResponse.json({
      success: true,
      message: 'Registration ping received',
      timestamp: new Date().toISOString()
    })
  }
}
