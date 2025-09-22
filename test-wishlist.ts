import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testWishlist() {
  try {
    console.log('🧪 Testing Wishlist Functionality...\n')

    // Get a test user (one we created earlier)
    const user = await prisma.user.findFirst({
      where: {
        email: 'rubenj.m.araujo@gmail.com'
      }
    })

    if (!user) {
      console.log('❌ No test user found. Please register first.')
      return
    }

    console.log(`✅ Found test user: ${user.name} (${user.email})`)

    // Get a product to add to wishlist
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE' },
      include: { category: true }
    })

    if (!product) {
      console.log('❌ No products found.')
      return
    }

    console.log(`✅ Found product: ${product.name} (${product.category.name})`)

    // Check current wishlist
    const currentWishlist = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: true }
        }
      }
    })

    console.log(`\n📋 Current wishlist items: ${currentWishlist.length}`)
    currentWishlist.forEach(item => {
      console.log(`   - ${item.product.name} (${item.product.category.name})`)
    })

    // Test 1: Add to wishlist
    console.log(`\n➕ Adding "${product.name}" to wishlist...`)

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId: product.id
        }
      }
    })

    if (existingItem) {
      console.log('ℹ️  Product already in wishlist, skipping add test')
    } else {
      const newWishlistItem = await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId: product.id
        },
        include: {
          product: {
            include: { category: true }
          }
        }
      })
      console.log(`✅ Added to wishlist: ${newWishlistItem.product.name}`)
    }

    // Check wishlist after adding
    const updatedWishlist = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: true }
        }
      }
    })

    console.log(`\n📋 Updated wishlist items: ${updatedWishlist.length}`)
    updatedWishlist.forEach(item => {
      console.log(`   - ${item.product.name} (${item.product.category.name})`)
    })

    // Test 2: Remove from wishlist
    if (updatedWishlist.length > 0) {
      const itemToRemove = updatedWishlist[0]
      console.log(`\n➖ Removing "${itemToRemove.product.name}" from wishlist...`)

      await prisma.wishlistItem.delete({
        where: { id: itemToRemove.id }
      })

      console.log(`✅ Removed from wishlist: ${itemToRemove.product.name}`)
    }

    // Final wishlist check
    const finalWishlist = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: true }
        }
      }
    })

    console.log(`\n📋 Final wishlist items: ${finalWishlist.length}`)
    finalWishlist.forEach(item => {
      console.log(`   - ${item.product.name} (${item.product.category.name})`)
    })

    console.log('\n🎉 Wishlist test completed successfully!')

  } catch (error) {
    console.error('❌ Error testing wishlist:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testWishlist()