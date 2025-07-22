import { NextRequest } from 'next/server'
import { exportGuardSnapshotsToXLSX } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId; // Changed from destructuring to direct access
  const { searchParams } = new URL(req.url)
  const details = searchParams.get('details') === 'true'
  const limit = parseInt(searchParams.get('limit') || '100', 10)

  try {
    const xlsxBuffer = await exportGuardSnapshotsToXLSX(roomId, limit, details)
    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${roomId}-snapshots.xlsx"`,
      },
    })
  } catch (error) {
    return new Response('Failed to export snapshots', { status: 500 })
  }
} 