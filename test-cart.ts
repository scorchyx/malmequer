import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCartWithVariants() {
  try {
    console.log('🛒 Testing Cart with Product Variants...\n')

    // Get the test user
    const user = await prisma.user.findFirst({
      where: { email: 'rubenj.m.araujo@gmail.com' },
    })

    if (!user) {
      console.log('❌ No test user found.')
      return
    }

    console.log(`✅ Found user: ${user.name}`)

    // Get a product with variants
    const product = await prisma.product.findFirst({
      where: {
        status: 'ACTIVE',
        category: {
          name: {
            in: ['Parte de Cima', 'Parte de Baixo', 'Conjuntos', 'Vestidos'],
          },
        },
      },
      include: {
        category: true,
        variants: true,
        images: { take: 1 },
      },
    })

    if (!product) {
      console.log('❌ No clothing product found.')
      return
    }

    console.log(`\n👗 Selected Product: ${product.name}`)
    console.log(`   Category: ${product.category.name}`)
    console.log(`   Price: €${product.price}`)

    // Show available variants
    const sizes = product.variants.filter(v => v.name === 'Tamanho')
    const colors = product.variants.filter(v => v.name === 'Cor')

    console.log(`\n📏 Available Sizes: ${sizes.map(s => `${s.value} (${s.inventory} in stock)`).join(', ')}`)
    console.log(`🎨 Available Colors: ${colors.map(c => `${c.value} (${c.inventory} in stock)`).join(', ')}`)

    // Clear existing cart
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    })
    console.log('\n🧹 Cleared existing cart')

    // Test 1: Add product to cart (current system - no variant selection)
    console.log('\n➕ Test 1: Adding product to cart (basic system)')

    const cartItem1 = await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 2,
      },
      include: {
        product: {
          include: {
            category: true,
            images: { take: 1 },
          },
        },
      },
    })

    console.log(`   ✅ Added: ${cartItem1.product.name} x${cartItem1.quantity}`)

    // Test 2: Add same product with different quantity (should update existing)
    console.log('\n➕ Test 2: Adding same product again (should update quantity)')

    const variantId = null
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        // @ts-ignore - Prisma doesn't fully support nullable fields in unique constraints
        userId_productId_variantId: {
          userId: user.id,
          productId: product.id,
          // @ts-ignore
          variantId,
        },
      },
    })

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
        include: {
          product: {
            include: { category: true },
          },
        },
      })
      console.log(`   ✅ Updated quantity: ${updatedItem.product.name} x${updatedItem.quantity}`)
    }

    // Show current cart
    const currentCart = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
            variants: true,
            images: { take: 1 },
          },
        },
      },
    })

    console.log(`\n🛒 Current Cart (${currentCart.length} items):`)
    let total = 0
    let totalItems = 0

    currentCart.forEach((item, index) => {
      const itemTotal = Number(item.product.price) * item.quantity
      total += itemTotal
      totalItems += item.quantity

      console.log(`   ${index + 1}. ${item.product.name}`)
      console.log(`      Category: ${item.product.category.name}`)
      console.log(`      Quantity: ${item.quantity}`)
      console.log(`      Price: €${item.product.price} each`)
      console.log(`      Subtotal: €${itemTotal.toFixed(2)}`)

      // Show variants for context (even though not selected)
      const productSizes = item.product.variants.filter(v => v.name === 'Tamanho')
      const productColors = item.product.variants.filter(v => v.name === 'Cor')
      console.log(`      Available sizes: ${productSizes.map(s => s.value).join(', ')}`)
      console.log(`      Available colors: ${productColors.map(c => c.value).join(', ')}`)
      console.log('')
    })

    console.log(`💰 Cart Total: €${total.toFixed(2)} (${totalItems} items)`)

    // Test 3: Add another product
    const anotherProduct = await prisma.product.findFirst({
      where: {
        status: 'ACTIVE',
        category: {
          name: 'Vestidos',
        },
        id: { not: product.id },
      },
      include: {
        category: true,
        variants: true,
      },
    })

    if (anotherProduct) {
      console.log(`\n➕ Test 3: Adding another product: ${anotherProduct.name}`)

      await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: anotherProduct.id,
          quantity: 1,
        },
      })

      console.log(`   ✅ Added: ${anotherProduct.name} x1`)
    }

    // Final cart summary
    const finalCart = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: true },
        },
      },
    })

    console.log('\n🎯 Final Cart Summary:')
    let finalTotal = 0
    let finalItems = 0

    finalCart.forEach((item) => {
      const itemTotal = Number(item.product.price) * item.quantity
      finalTotal += itemTotal
      finalItems += item.quantity
      console.log(`   - ${item.product.name} x${item.quantity} = €${itemTotal.toFixed(2)}`)
    })

    console.log(`\n💳 TOTAL: €${finalTotal.toFixed(2)} (${finalItems} items)`)

    console.log('\n🎉 Cart test completed!')
    console.log('\n📝 Note: This test uses the basic cart system without variant selection.')
    console.log('   In a real e-commerce, users would select specific size/color combinations.')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

void testCartWithVariants()