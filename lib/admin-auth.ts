import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }

  return user
}

export function withAdminAuth(handler: Function) {
  return async (request: NextRequest, ...args: unknown[]) => {
    try {
      const user = await requireAdmin()
      return handler(request, { user }, ...args)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access denied'
      return NextResponse.json(
        { error: message },
        { status: message === 'Authentication required' ? 401 : 403 },
      )
    }
  }
}

export async function logAdminActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  description?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  oldValues?: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newValues?: any,
) {
  const { prisma } = await import('@/lib/prisma')

  try {
    await prisma.adminActivity.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        description,
        oldValues,
        newValues,
      },
    })
  } catch {
    // Failed to log admin activity - error ignored
  }
}