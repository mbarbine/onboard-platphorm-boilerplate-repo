import { NextResponse } from 'next/server'
import versionInfo from '@/lib/version'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      data: {
        version: versionInfo.version,
        build: versionInfo.build,
        timestamp: versionInfo.timestamp,
        runtime: {
          node: process.version,
          nextjs: '16.x',
          environment: versionInfo.environment,
        },
        compatibility: versionInfo.compatibility,
        vercel: {
          deploymentUrl: versionInfo.vercel.deploymentUrl || null,
          region: versionInfo.vercel.region || null,
          environment: versionInfo.vercel.env || null,
        },
      },
    },
    {
      headers: {
        'X-Version': versionInfo.version,
        'X-Build': versionInfo.build,
      },
    }
  )
}
