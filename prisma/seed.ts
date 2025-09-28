import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = [
    {
      name: 'Parte de Cima',
      slug: 'parte-de-cima',
      description: 'Blusas, camisetas, tops e outras peças para a parte superior do corpo',
    },
    {
      name: 'Parte de Baixo',
      slug: 'parte-de-baixo',
      description: 'Calças, saias, shorts e outras peças para a parte inferior do corpo',
    },
    {
      name: 'Conjuntos',
      slug: 'conjuntos',
      description: 'Conjuntos coordenados de duas ou mais peças',
    },
    {
      name: 'Vestidos',
      slug: 'vestidos',
      description: 'Vestidos para todas as ocasiões',
    },
  ]

  console.log('Seeding categories...')

  for (const category of categories) {
    const result = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    })
    console.log(`Created/updated category: ${result.name}`)
  }

  console.log('✅ Categories seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })