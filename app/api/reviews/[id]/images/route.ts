import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { id } = await params
    const { images } = await request.json()

    if (!images || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Images array is required' },
        { status: 400 },
      )
    }

    // Verify review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 },
      )
    }

    // Create review images
    await prisma.reviewImage.createMany({
      data: images.map((image: any, index: number) => ({
        reviewId: id,
        url: image.url,
        alt: image.alt ?? null,
        order: index,
      })),
    })

    const createdImages = await prisma.reviewImage.findMany({
      where: { reviewId: id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      images: createdImages,
      message: 'Review images added successfully',
    })
  } catch (error) {
    console.error('Error adding review images:', error)
    return NextResponse.json(
      { error: 'Failed to add review images' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const { id } = await params
    const { imageId } = await request.json()

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 },
      )
    }

    // Verify review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 },
      )
    }

    await prisma.reviewImage.delete({
      where: {
        id: imageId,
        reviewId: id,
      },
    })

    return NextResponse.json({
      message: 'Review image deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting review image:', error)
    return NextResponse.json(
      { error: 'Failed to delete review image' },
      { status: 500 },
    )
  }
}