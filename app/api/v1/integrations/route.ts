import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { apiResponse, apiError } from '@/lib/api-helpers'

const DEFAULT_TENANT = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const integrations = await sql`
      SELECT id, name, base_url, api_path, mcp_path, enabled, settings, created_at, updated_at
      FROM integrations
      WHERE tenant_id = ${DEFAULT_TENANT}
      ORDER BY name ASC
    `
    
    return apiResponse(integrations)
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return apiError('FETCH_ERROR', 'Failed to fetch integrations', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, base_url, api_path = '/api', mcp_path = '/api/mcp', enabled = true, settings = {} } = body
    
    if (!name || !base_url) {
      return apiError('VALIDATION_ERROR', 'Name and base_url are required', 400)
    }
    
    const result = await sql`
      INSERT INTO integrations (tenant_id, name, base_url, api_path, mcp_path, enabled, settings)
      VALUES (${DEFAULT_TENANT}, ${name}, ${base_url}, ${api_path}, ${mcp_path}, ${enabled}, ${JSON.stringify(settings)})
      ON CONFLICT (tenant_id, name) 
      DO UPDATE SET 
        base_url = EXCLUDED.base_url,
        api_path = EXCLUDED.api_path,
        mcp_path = EXCLUDED.mcp_path,
        enabled = EXCLUDED.enabled,
        settings = EXCLUDED.settings,
        updated_at = NOW()
      RETURNING *
    `
    
    return apiResponse(result[0], undefined, 201)
  } catch (error) {
    console.error('Error creating integration:', error)
    return apiError('CREATE_ERROR', 'Failed to create integration', 500)
  }
}
