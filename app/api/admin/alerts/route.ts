import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { alertManager } from '@/lib/alerts'
import { log } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'active'
    const hours = parseInt(searchParams.get('hours') || '24')

    let alerts
    if (type === 'active') {
      alerts = await alertManager.getActiveAlerts()
    } else if (type === 'history') {
      alerts = await alertManager.getAlertHistory(hours)
    } else {
      return NextResponse.json(
        { error: 'Invalid alert type. Use "active" or "history"' },
        { status: 400 }
      )
    }

    log.info('Alerts retrieved', {
      adminUserId: user.id,
      type,
      count: alerts.length,
      hours: type === 'history' ? hours : undefined
    })

    return NextResponse.json({
      alerts,
      type,
      count: alerts.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log.error('Failed to retrieve alerts', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to retrieve alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, alertName, config } = body

    if (!action || !alertName) {
      return NextResponse.json(
        { error: 'Missing required fields: action, alertName' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'enable':
        alertManager.enableAlert(alertName)
        log.info('Alert enabled', {
          adminUserId: user.id,
          alertName,
          action: 'enable'
        })
        break

      case 'disable':
        alertManager.disableAlert(alertName)
        log.info('Alert disabled', {
          adminUserId: user.id,
          alertName,
          action: 'disable'
        })
        break

      case 'configure':
        if (!config) {
          return NextResponse.json(
            { error: 'Config is required for configure action' },
            { status: 400 }
          )
        }
        alertManager.configureAlert(alertName, config)
        log.info('Alert configured', {
          adminUserId: user.id,
          alertName,
          action: 'configure',
          config
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "enable", "disable", or "configure"' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      alertName,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    log.error('Failed to manage alert', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Failed to manage alert' },
      { status: 500 }
    )
  }
}