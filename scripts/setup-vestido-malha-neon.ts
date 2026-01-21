import { prisma } from '../lib/prisma'

async function setupProduct() {
  const product = await prisma.product.findFirst({
    where: { slug: 'vestido-malha' },
  })

  if (!product) {
    console.log('Produto não encontrado no Neon!')
    await prisma.$disconnect()
    return
  }

  console.log('Produto encontrado:', product.name)

  // Verificar se já tem variantes
  const existingVariants = await prisma.productVariant.findMany({
    where: { productId: product.id },
  })

  if (existingVariants.length > 0) {
    console.log('Variantes já existem:', existingVariants.length)
  } else {
    console.log('Criando variantes...')
  }

  // Criar variante de tamanho se não existir
  let sizeVariant = await prisma.productVariant.findFirst({
    where: { productId: product.id, type: 'TAMANHO' },
  })

  if (!sizeVariant) {
    sizeVariant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        type: 'TAMANHO',
        label: 'Tamanho Único',
        value: 'TU',
        position: 0,
      },
    })
    console.log('Variante de tamanho criada:', sizeVariant.label)
  }

  // Criar variante de cor se não existir
  let colorVariant = await prisma.productVariant.findFirst({
    where: { productId: product.id, type: 'COR' },
  })

  if (!colorVariant) {
    colorVariant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        type: 'COR',
        label: 'Preto',
        value: '#000000',
        position: 0,
      },
    })
    console.log('Variante de cor criada:', colorVariant.label)
  }

  // Verificar se já tem stockItem
  const existingStock = await prisma.stockItem.findFirst({
    where: { productId: product.id },
  })

  if (existingStock) {
    console.log('StockItem já existe, quantidade:', existingStock.quantity)
  } else {
    // Criar stockItem
    const stockItem = await prisma.stockItem.create({
      data: {
        productId: product.id,
        sizeVariantId: sizeVariant.id,
        colorVariantId: colorVariant.id,
        quantity: 10,
        sku: 'VM-TU-PRETO',
      },
    })
    console.log('StockItem criado com quantidade:', stockItem.quantity)
  }

  console.log('\nProduto configurado com sucesso!')
  await prisma.$disconnect()
}

setupProduct()
