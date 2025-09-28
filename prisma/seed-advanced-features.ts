/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAdvancedFeatures() {
  try {
    console.log('🚀 Seeding advanced e-commerce features...\n')

    // 1. Create Product Relations (Cross-sell, Up-sell, Related)
    console.log('📦 Creating product relations...')
    const products = await prisma.product.findMany({ take: 10 })

    if (products.length >= 4) {
      await prisma.productRelation.createMany({
        data: [
          {
            productId: products[0].id,
            relatedProductId: products[1].id,
            type: 'CROSS_SELL',
            position: 1,
          },
          {
            productId: products[0].id,
            relatedProductId: products[2].id,
            type: 'RELATED',
            position: 2,
          },
          {
            productId: products[1].id,
            relatedProductId: products[3].id,
            type: 'UP_SELL',
            position: 1,
          },
          {
            productId: products[2].id,
            relatedProductId: products[0].id,
            type: 'ALTERNATIVE',
            position: 1,
          },
        ],
        skipDuplicates: true,
      })
      console.log('   ✅ Product relations created')
    }

    // 2. Create Loyalty Points for existing users
    console.log('🏆 Setting up loyalty points...')
    const users = await prisma.user.findMany({ where: { role: 'USER' }, take: 5 })

    for (const user of users) {
      await prisma.loyaltyPoints.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          totalPoints: Math.floor(Math.random() * 1000),
          availablePoints: Math.floor(Math.random() * 500),
          lifetimePoints: Math.floor(Math.random() * 2000),
          tier: ['BRONZE', 'SILVER', 'GOLD'][Math.floor(Math.random() * 3)] as any,
        },
      })

      // Create some loyalty transactions
      await prisma.loyaltyTransaction.createMany({
        data: [
          {
            userId: user.id,
            type: 'EARNED',
            points: 100,
            description: 'Welcome bonus',
          },
          {
            userId: user.id,
            type: 'EARNED',
            points: 50,
            description: 'Purchase reward',
          },
        ],
        skipDuplicates: true,
      })
    }
    console.log('   ✅ Loyalty points system initialized')

    // 3. Create User Coupons
    console.log('🎫 Creating user coupons...')
    const discounts = await prisma.discount.findMany({ take: 3 })

    if (users.length > 0 && discounts.length > 0) {
      for (const user of users.slice(0, 3)) {
        for (const discount of discounts.slice(0, 2)) {
          await prisma.userCoupon.upsert({
            where: {
              userId_discountId: {
                userId: user.id,
                discountId: discount.id,
              },
            },
            update: {},
            create: {
              userId: user.id,
              discountId: discount.id,
              used: Math.random() > 0.7,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
          })
        }
      }
      console.log('   ✅ User coupons created')
    }

    // 4. Create Wishlists
    console.log('💝 Creating wishlists...')
    for (const user of users.slice(0, 3)) {
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          name: `${user.name || 'User'}'s Favorites`,
          description: 'My favorite products',
          isPublic: Math.random() > 0.5,
          shareToken: Math.random().toString(36).substring(2, 15),
        },
      })
    }
    console.log('   ✅ Wishlists created')

    // 5. Enhance Product Variants with Attributes
    console.log('🎨 Adding variant attributes...')
    const variants = await prisma.productVariant.findMany({ take: 10 })

    const attributeExamples = [
      { name: 'Color', values: ['Red', 'Blue', 'Green', 'Black', 'White'] },
      { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
      { name: 'Material', values: ['Cotton', 'Polyester', 'Wool', 'Silk'] },
    ]

    for (const variant of variants) {
      const attributeType = attributeExamples[Math.floor(Math.random() * attributeExamples.length)]
      const attributeValue = attributeType.values[Math.floor(Math.random() * attributeType.values.length)]

      await prisma.productVariantAttribute.upsert({
        where: {
          variantId_name: {
            variantId: variant.id,
            name: attributeType.name,
          },
        },
        update: {},
        create: {
          variantId: variant.id,
          name: attributeType.name,
          value: attributeValue,
        },
      })
    }
    console.log('   ✅ Variant attributes added')

    // 6. Create Price History
    console.log('💰 Creating price history...')
    for (const product of products.slice(0, 5)) {
      await prisma.priceHistory.createMany({
        data: [
          {
            productId: product.id,
            price: product.price,
            comparePrice: product.comparePrice,
            reason: 'Initial price',
          },
          {
            productId: product.id,
            price: Number(product.price) * 0.9,
            comparePrice: product.price,
            reason: 'Sale discount',
          },
        ],
        skipDuplicates: true,
      })
    }
    console.log('   ✅ Price history created')

    // 7. Create Notifications
    console.log('🔔 Creating sample notifications...')
    for (const user of users.slice(0, 3)) {
      await prisma.notification.createMany({
        data: [
          {
            userId: user.id,
            type: 'STOCK_ALERT',
            title: 'Product Back in Stock',
            message: 'Your favorite product is now available!',
            data: { productId: products[0]?.id },
          },
          {
            userId: user.id,
            type: 'PROMOTION',
            title: 'Special Offer',
            message: 'Get 20% off your next order',
            data: { discountCode: 'SAVE20' },
          },
        ],
        skipDuplicates: true,
      })
    }
    console.log('   ✅ Sample notifications created')

    console.log('\n✨ Advanced features seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   • Product relations: Cross-sell, up-sell, related products`)
    console.log(`   • Loyalty system: Points, tiers, transactions`)
    console.log(`   • User coupons: Personalized discount tracking`)
    console.log(`   • Enhanced wishlists: Public/private with sharing`)
    console.log(`   • Variant attributes: Color, size, material`)
    console.log(`   • Price history: Track price changes`)
    console.log(`   • Notifications: Stock alerts and promotions`)

  } catch (error) {
    console.error('Error seeding advanced features:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdvancedFeatures()
    .then(() => {
      console.log('\n🎉 Advanced features seeding completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Advanced features seeding failed:', error)
      process.exit(1)
    })
}

export default seedAdvancedFeatures