import { prisma } from '../lib/prisma'

async function migrateProduct() {
  const product = await prisma.product.findFirst({
    where: { slug: 'vestido-malha' },
    include: { variants: true },
  })

  if (!product) {
    console.log('Produto não encontrado')
    return
  }

  console.log('Produto:', product.name)
  console.log('Variantes existentes:', product.variants.length)

  // Encontrar variantes de tamanho e cor
  const sizeVariant = product.variants.find(v => v.type === 'TAMANHO')
  const colorVariant = product.variants.find(v => v.type === 'COR')

  if (!sizeVariant || !colorVariant) {
    console.log('Falta variante de tamanho ou cor')
    console.log('Size:', sizeVariant)
    console.log('Color:', colorVariant)
    return
  }

  console.log('\nCriando stockItem...')
  console.log('  Size:', sizeVariant.label)
  console.log('  Color:', colorVariant.label)

  // Criar stockItem
  const stockItem = await prisma.stockItem.create({
    data: {
      productId: product.id,
      sizeVariantId: sizeVariant.id,
      colorVariantId: colorVariant.id,
      quantity: 10, // Stock inicial
      sku: 'VM-TU-M',
    },
  })

  console.log('\nStockItem criado:', stockItem.id)
  console.log('Quantidade:', stockItem.quantity)

  await prisma.$disconnect()
}

migrateProduct()
