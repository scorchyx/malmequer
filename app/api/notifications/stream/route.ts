import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { log } from '@/lib/logger'

// Store active connections
const connections = new Map<string, {
  controller: AbortController
  writer: WritableStreamDefaultWriter
  userId?: string
  isAdmin: boolean
  lastHeartbeat: number
}>()

// Notification types
export interface Notification {
  id: string
  type: 'order_update' | 'stock_alert' | 'payment_update' | 'admin_alert' | 'system_message'
  title: string
  message: string
  data?: any
  userId?: string
  isAdminOnly?: boolean
  timestamp: number
}

// Send notification to specific user or all users
export function sendNotification(notification: Notification) {
  const message = JSON.stringify(notification)

  connections.forEach((connection, connectionId) => {
    try {
      // Check if notification should be sent to this connection
      const shouldSend =
        // Admin notifications go to admin users
        (notification.isAdminOnly && connection.isAdmin) ||
        // User-specific notifications
        (notification.userId && notification.userId === connection.userId) ||
        // Public notifications (no userId specified and not admin-only)
        (!notification.userId && !notification.isAdminOnly)

      if (shouldSend) {
        void connection.writer.write(`data: ${message}\n\n`)
      }
    } catch (_error) {
      // Connection is dead, remove it
      log.error('Failed to send notification, removing connection', {
        connectionId,
        error: _error instanceof Error ? _error.message : String(_error),
      })
      closeConnection(connectionId)
    }
  })
}

// Close and remove a connection
function closeConnection(connectionId: string) {
  const connection = connections.get(connectionId)
  if (connection) {
    try {
      connection.controller.abort()
      void connection.writer.close()
    } catch (_error) {
      // Ignore close errors
    }
    connections.delete(connectionId)
  }
}

// Cleanup dead connections
function cleanupConnections() {
  const now = Date.now()
  const timeout = 65000 // 65 seconds

  connections.forEach((connection, connectionId) => {
    if (now - connection.lastHeartbeat > timeout) {
      log.info('Removing stale connection', { connectionId })
      closeConnection(connectionId)
    }
  })
}

// Run cleanup every minute
setInterval(cleanupConnections, 60000)

export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const connectionId = crypto.randomUUID()

    log.info('New SSE connection established', {
      connectionId,
      userId: user?.id,
      isAdmin: user?.role === 'ADMIN',
    })

    // Create SSE response
    const encoder = new TextEncoder()
    const controller = new AbortController()

    const stream = new ReadableStream({
      start(streamController) {
        const writer = streamController

        // Store connection
        connections.set(connectionId, {
          controller,
          writer: {
            write: (data: string) => {
              if (!controller.signal.aborted) {
                writer.enqueue(encoder.encode(data))
              }
            },
            close: () => {
              if (!controller.signal.aborted) {
                streamController.close()
              }
            },
          } as WritableStreamDefaultWriter,
          userId: user?.id,
          isAdmin: user?.role === 'ADMIN' || false,
          lastHeartbeat: Date.now(),
        })

        // Send initial connection message
        const welcomeMessage: Notification = {
          id: crypto.randomUUID(),
          type: 'system_message',
          title: 'Connected',
          message: 'Real-time notifications enabled',
          timestamp: Date.now(),
        }

        void writer.enqueue(encoder.encode(`data: ${JSON.stringify(welcomeMessage)}\n\n`))

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          if (controller.signal.aborted) {
            clearInterval(heartbeatInterval)
            return
          }

          const connection = connections.get(connectionId)
          if (connection) {
            connection.lastHeartbeat = Date.now()
            try {
              void writer.enqueue(encoder.encode(': heartbeat\n\n'))
            } catch (_error) {
              clearInterval(heartbeatInterval)
              closeConnection(connectionId)
            }
          } else {
            clearInterval(heartbeatInterval)
          }
        }, 30000)

        // Handle connection abort
        controller.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval)
          closeConnection(connectionId)
          log.info('SSE connection closed', { connectionId })
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    log.error('Error establishing SSE connection', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to establish SSE connection' },
      { status: 500 },
    )
  }
}

// Send test notification (for admin testing)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { type, title, message, userId, isAdminOnly } = await request.json()

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 },
      )
    }

    const notification: Notification = {
      id: crypto.randomUUID(),
      type: type ?? 'system_message',
      title,
      message,
      userId,
      isAdminOnly: isAdminOnly ?? false,
      timestamp: Date.now(),
    }

    sendNotification(notification)

    log.info('Test notification sent', {
      adminId: user.id,
      notification,
      activeConnections: connections.size,
    })

    return NextResponse.json({
      success: true,
      notification,
      activeConnections: connections.size,
    })
  } catch (error) {
    log.error('Error sending test notification', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 },
    )
  }
}

// Get connection stats (admin only)
export async function PUT(_request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const connectionStats = Array.from(connections.entries()).map(([id, conn]) => ({
      id,
      userId: conn.userId ?? null,
      isAdmin: conn.isAdmin,
      connectedSince: Date.now() - conn.lastHeartbeat,
      lastHeartbeat: new Date(conn.lastHeartbeat).toISOString(),
    }))

    return NextResponse.json({
      totalConnections: connections.size,
      connections: connectionStats,
      stats: {
        adminConnections: connectionStats.filter(c => c.isAdmin).length,
        userConnections: connectionStats.filter(c => !c.isAdmin && c.userId).length,
        anonymousConnections: connectionStats.filter(c => !c.userId).length,
      },
    })
  } catch (error) {
    log.error('Error getting connection stats', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to get connection stats' },
      { status: 500 },
    )
  }
}