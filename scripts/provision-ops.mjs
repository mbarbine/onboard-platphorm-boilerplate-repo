#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const OPS_DIR = path.join(ROOT, 'docs', 'ops')
const RUNTIME_ENV_PATH = path.join(ROOT, '.env.runtime.local')
const LOCAL_ENV_PATH = path.join(ROOT, '.env.local')

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const raw = fs.readFileSync(filePath, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '')
    env[key] = value
  }
  return env
}

function getEnv() {
  const runtime = parseEnvFile(RUNTIME_ENV_PATH)
  const local = parseEnvFile(LOCAL_ENV_PATH)
  return { ...runtime, ...local, ...process.env }
}

function requireEnv(env, keyAliases) {
  for (const key of keyAliases) {
    if (env[key]) return env[key]
  }
  throw new Error(`Missing required env variable. Expected one of: ${keyAliases.join(', ')}`)
}

function plusDaysISO(days) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString()
}

async function postJson(url, token, body) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    let parsed = null
    try {
      parsed = await response.json()
    } catch {
      parsed = null
    }

    return { status: response.status, data: parsed, error: null }
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function createKanbanTasks(env) {
  const kanbanToken = requireEnv(env, ['PLATPHORM_API_KEY'])
  const kanbanBase = env.KANBAN_API_URL || 'https://kanban.platphormnews.com/api'
  const origin = new URL(kanbanBase).origin
  const endpoint = `${origin}/api/v1/tasks`

  const dueDate = plusDaysISO(7)
  const tasks = [
    {
      title: 'Investigate onboarding publish regression',
      description: 'Trace submission approval and publishing flow for onboarding source identifiers.',
    },
    {
      title: 'Add approval default publish behavior',
      description: 'Ensure approvals publish by default unless explicitly disabled.',
    },
    {
      title: 'Add regression tests for submission approval publish default',
      description: 'Cover default publish behavior in integration tests.',
    },
    {
      title: 'Backfill existing draft onboarding docs by source_identifier',
      description: 'Publish existing draft docs produced by onboarding registrations.',
    },
    {
      title: 'Verify automation route integrity and dedupe imports',
      description: 'Clean route-level regressions and enforce compile stability.',
    },
    {
      title: 'Update deployment checklist for kanban+v0 provisioning',
      description: 'Document env requirements and bootstrap workflow.',
    },
  ]

  const created = []
  for (const task of tasks) {
    const payload = {
      ...task,
      projectId: 'engineering',
      dueDate,
      customFields: [{ key: 'source', value: 'onboard-ops-bootstrap' }],
    }
    const result = await postJson(endpoint, kanbanToken, payload)
    created.push({
      title: task.title,
      status: result.status,
      id: result?.data?.id || result?.data?.data?.id || null,
    })
  }

  return created
}

async function createV0Project(env) {
  const v0Token = requireEnv(env, ['V0_API_KEY', 'v0_token'])
  const endpoint = 'https://api.v0.dev/v1/projects'
  const payload = {
    name: env.V0_PROJECT_NAME || 'onboard-platphorm-bp',
    description:
      env.V0_PROJECT_DESCRIPTION ||
      'Boilerplate docs platform for Platphorm network',
  }

  const result = await postJson(endpoint, v0Token, payload)

  return {
    timestamp: new Date().toISOString(),
    endpoint,
    http_status: result.status,
    request: payload,
    response: {
      id: result?.data?.id || null,
      name: result?.data?.name || payload.name,
      url: result?.data?.url || null,
      object: result?.data?.object || null,
      privacy: result?.data?.privacy || null,
      vercelProjectId: result?.data?.vercelProjectId || null,
    },
  }
}

async function registerDiscovery(env, baseUrl) {
  const token = requireEnv(env, ['PLATPHORM_API_KEY'])
  const mcpRegistryUrl =
    env.MCP_REGISTRY_URL || 'https://mcp.platphormnews.com/api/mcp/register'
  const networkGraphUrl =
    env.NETWORK_GRAPH_URL || 'https://platphormnes.com/api/network/graph'

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
      endpoint: `${baseUrl}/api/mcp`,
      protocol_versions: ['2025-11-25'],
      tools: true,
      resources: true,
      prompts: true,
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
  }

  const [mcp, graph] = await Promise.all([
    postJson(mcpRegistryUrl, token, payload),
    postJson(networkGraphUrl, token, payload),
  ])

  return {
    timestamp: new Date().toISOString(),
    payload,
    registrations: {
      mcp_registry: { endpoint: mcpRegistryUrl, status: mcp.status, error: mcp.error || null },
      network_graph: { endpoint: networkGraphUrl, status: graph.status, error: graph.error || null },
    },
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

async function main() {
  const env = getEnv()
  const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  const tasks = await createKanbanTasks(env)
  const v0Project = await createV0Project(env)
  const registration = await registerDiscovery(env, baseUrl)

  writeJson(path.join(OPS_DIR, 'kanban-created-tasks.json'), tasks)
  writeJson(path.join(OPS_DIR, 'v0-project.json'), v0Project)
  writeJson(path.join(OPS_DIR, 'discovery-registration.json'), registration)

  const successCount = tasks.filter((t) => t.status >= 200 && t.status < 300).length
  console.log(`Kanban tasks: ${successCount}/${tasks.length} successful`)
  console.log(`v0 project create status: ${v0Project.http_status}`)
  console.log(
    `Discovery registrations: MCP=${registration.registrations.mcp_registry.status}, Graph=${registration.registrations.network_graph.status}`
  )
  if (registration.registrations.mcp_registry.error) {
    console.log(`MCP registration error: ${registration.registrations.mcp_registry.error}`)
  }
  if (registration.registrations.network_graph.error) {
    console.log(`Network graph registration error: ${registration.registrations.network_graph.error}`)
  }
  console.log('Artifacts written to docs/ops/*.json')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
