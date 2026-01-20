import { prisma } from '../lib/prisma'

async function checkAllProducts() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: {
      category: true,
      stockItems: {
        include: {
          sizeVariant: true,
          colorVariant: true,
        },
      },
    },
  })

  for (const product of products) {
    console.log(`\nProduto: ${product.name} (slug: ${product.slug})`)
    console.log(`  Category: ${product.category ? product.category.name : 'NULL - PROBLEMA!'}`)
    console.log(`  Stock Items: ${product.stockItems.length}`)

    for (const si of product.stockItems) {
      if (!si.sizeVariant || !si.colorVariant) {
        console.log(`  PROBLEMA: Stock item sem variante! sizeVariant: ${si.sizeVariant ? 'OK' : 'NULL'}, colorVariant: ${si.colorVariant ? 'OK' : 'NULL'}`)
      }
    }
  }

  await prisma.$disconnect()
}

checkAllProducts()
