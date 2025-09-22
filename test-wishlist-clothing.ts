import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testClothingWishlist() {
  try {
    console.log('👗 Testing Wishlist with Clothing Products...\n')

    // Get the test user
    const user = await prisma.user.findFirst({
      where: { email: 'rubenj.m.araujo@gmail.com' }
    })

    if (!user) {
      console.log('❌ No test user found.')
      return
    }

    console.log(`✅ Found user: ${user.name}`)

    // Get some clothing products
    const clothingProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        category: {
          name: {
            in: ['Parte de Cima', 'Parte de Baixo', 'Conjuntos', 'Vestidos']
          }
        }
      },
      include: { category: true },
      take: 4
    })

    console.log(`\n🛍️  Found ${clothingProducts.length} clothing products:`)
    clothingProducts.forEach(product => {
      console.log(`   - ${product.name} (${product.category.name}) - €${product.price}`)
    })

    // Clear existing wishlist
    await prisma.wishlistItem.deleteMany({
      where: { userId: user.id }
    })
    console.log('\n🧹 Cleared existing wishlist')

    // Add first 3 products to wishlist
    console.log('\n➕ Adding products to wishlist...')
    for (let i = 0; i < Math.min(3, clothingProducts.length); i++) {
      const product = clothingProducts[i]

      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId: product.id
        }
      })

      console.log(`   ✅ Added: ${product.name}`)
    }

    // Show current wishlist with full details
    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
            images: { take: 1, orderBy: { order: 'asc' } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`\n💝 Current Wishlist (${wishlist.length} items):`)
    wishlist.forEach((item, index) => {
      const p = item.product
      console.log(`   ${index + 1}. ${p.name}`)
      console.log(`      Category: ${p.category.name}`)
      console.log(`      Price: €${p.price}${p.comparePrice ? ` (was €${p.comparePrice})` : ''}`)
      console.log(`      Description: ${p.description?.substring(0, 50)}...`)
      if (p.images.length > 0) {
        console.log(`      Image: ${p.images[0].url}`)
      }
      console.log('')
    })

    // Test removing one item
    if (wishlist.length > 0) {
      const itemToRemove = wishlist[1] // Remove second item
      console.log(`➖ Removing "${itemToRemove.product.name}" from wishlist...`)

      await prisma.wishlistItem.delete({
        where: { id: itemToRemove.id }
      })

      console.log('   ✅ Removed successfully')
    }

    // Show final wishlist
    const finalWishlist = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: true }
        }
      }
    })

    console.log(`\n💝 Final Wishlist (${finalWishlist.length} items):`)
    finalWishlist.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.product.name} (${item.product.category.name}) - €${item.product.price}`)
    })

    console.log('\n🎉 Clothing wishlist test completed!')

    // Test duplicate prevention
    if (finalWishlist.length > 0) {
      console.log('\n🔄 Testing duplicate prevention...')
      const existingProduct = finalWishlist[0].product

      try {
        await prisma.wishlistItem.create({
          data: {
            userId: user.id,
            productId: existingProduct.id
          }
        })
        console.log('❌ ERROR: Duplicate was allowed (should not happen)')
      } catch (error) {
        console.log(`✅ Duplicate prevented correctly: ${existingProduct.name}`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testClothingWishlist()