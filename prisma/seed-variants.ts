import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedVariants() {
  try {
    console.log('👗 Adding variants to clothing products...\n')

    // Get all clothing products
    const products = await prisma.product.findMany({
      where: {
        category: {
          name: {
            in: ['Parte de Cima', 'Parte de Baixo', 'Conjuntos', 'Vestidos'],
          },
        },
      },
      include: {
        category: true,
        variants: true,
      },
    })

    console.log(`Found ${products.length} clothing products`)

    // Define available sizes and colors based on category
    const sizesByCategory = {
      'Parte de Cima': ['PP', 'P', 'M', 'G', 'GG'],
      'Parte de Baixo': ['PP', 'P', 'M', 'G', 'GG'],
      'Conjuntos': ['PP', 'P', 'M', 'G', 'GG'],
      'Vestidos': ['PP', 'P', 'M', 'G', 'GG'],
    }

    const colors = [
      { name: 'Preto', value: 'preto' },
      { name: 'Branco', value: 'branco' },
      { name: 'Azul Marinho', value: 'azul-marinho' },
      { name: 'Rosa', value: 'rosa' },
      { name: 'Bege', value: 'bege' },
    ]

    for (const product of products) {
      console.log(`\n📦 Processing: ${product.name}`)

      // Skip if already has variants
      if (product.variants.length > 0) {
        console.log(`   ⏭️  Already has ${product.variants.length} variants, skipping...`)
        continue
      }

      const categoryName = product.category.name as keyof typeof sizesByCategory
      const availableSizes = sizesByCategory[categoryName] || ['P', 'M', 'G']

      // Add size variants
      console.log(`   ➕ Adding size variants: ${availableSizes.join(', ')}`)
      for (const size of availableSizes) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: 'Tamanho',
            value: size,
            inventory: Math.floor(Math.random() * 20) + 5, // 5-24 units
            sku: `${product.sku}-${size}`,
          },
        })
      }

      // Add color variants (3 random colors per product)
      const productColors = colors.slice(0, 3)
      console.log(`   🎨 Adding color variants: ${productColors.map(c => c.name).join(', ')}`)
      for (const color of productColors) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: 'Cor',
            value: color.value,
            inventory: Math.floor(Math.random() * 15) + 10, // 10-24 units
            sku: `${product.sku}-${color.value}`,
          },
        })
      }

      console.log(`   ✅ Added ${availableSizes.length} sizes + ${productColors.length} colors`)
    }

    // Show summary
    console.log('\n📊 Summary:')
    for (const product of products) {
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          variants: true,
          category: true,
        },
      })

      if (updatedProduct) {
        const sizeVariants = updatedProduct.variants.filter(v => v.name === 'Tamanho')
        const colorVariants = updatedProduct.variants.filter(v => v.name === 'Cor')

        console.log(`   ${updatedProduct.name}: ${sizeVariants.length} tamanhos, ${colorVariants.length} cores`)
      }
    }

    console.log('\n🎉 Variants seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding variants:', error)
  } finally {
    await prisma.$disconnect()
  }
}

void seedVariants()