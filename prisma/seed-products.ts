import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fetching categories...')

  // Get categories first
  const categories = await prisma.category.findMany()
  console.log(`Found ${categories.length} categories`)

  if (categories.length === 0) {
    console.log('No categories found. Please run the category seed first.')
    return
  }

  const products = [
    // Parte de Cima
    {
      name: 'Blusa Floral Elegante',
      slug: 'blusa-floral-elegante',
      description: 'Linda blusa com estampa floral, perfeita para ocasiões especiais. Tecido leve e confortável.',
      price: 89.90,
      comparePrice: 119.90,
      sku: 'BFE-001',
      inventory: 25,
      categoryName: 'Parte de Cima',
      status: 'ACTIVE',
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
          alt: 'Blusa Floral Elegante - Vista Frontal'
        },
        {
          url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&crop=faces',
          alt: 'Blusa Floral Elegante - Detalhe'
        }
      ]
    },
    {
      name: 'Camiseta Básica Premium',
      slug: 'camiseta-basica-premium',
      description: 'Camiseta básica de algodão 100%, corte moderno e cores versáteis.',
      price: 49.90,
      sku: 'CBP-002',
      inventory: 50,
      categoryName: 'Parte de Cima',
      status: 'ACTIVE',
      featured: false,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
          alt: 'Camiseta Básica Premium'
        }
      ]
    },
    // Parte de Baixo
    {
      name: 'Calça Jeans Skinny',
      slug: 'calca-jeans-skinny',
      description: 'Calça jeans com corte skinny, cintura alta e lavagem moderna. Perfeita para o dia a dia.',
      price: 129.90,
      comparePrice: 159.90,
      sku: 'CJS-003',
      inventory: 30,
      categoryName: 'Parte de Baixo',
      status: 'ACTIVE',
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1541840031508-326b77c9a17e?w=800',
          alt: 'Calça Jeans Skinny'
        }
      ]
    },
    {
      name: 'Saia Midi Plissada',
      slug: 'saia-midi-plissada',
      description: 'Saia midi com pregas elegantes, ideal para looks femininos e sofisticados.',
      price: 79.90,
      sku: 'SMP-004',
      inventory: 20,
      categoryName: 'Parte de Baixo',
      status: 'ACTIVE',
      featured: false,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1583496661160-fb5886a13d44?w=800',
          alt: 'Saia Midi Plissada'
        }
      ]
    },
    // Conjuntos
    {
      name: 'Conjunto Blazer e Calça',
      slug: 'conjunto-blazer-calca',
      description: 'Conjunto executivo composto por blazer estruturado e calça de alfaiataria.',
      price: 299.90,
      comparePrice: 399.90,
      sku: 'CBC-005',
      inventory: 15,
      categoryName: 'Conjuntos',
      status: 'ACTIVE',
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800',
          alt: 'Conjunto Blazer e Calça'
        }
      ]
    },
    {
      name: 'Conjunto Cropped e Short',
      slug: 'conjunto-cropped-short',
      description: 'Conjunto casual jovem com top cropped e short cintura alta, perfeito para o verão.',
      price: 89.90,
      sku: 'CCS-006',
      inventory: 35,
      categoryName: 'Conjuntos',
      status: 'ACTIVE',
      featured: false,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
          alt: 'Conjunto Cropped e Short'
        }
      ]
    },
    // Vestidos
    {
      name: 'Vestido Longo Floral',
      slug: 'vestido-longo-floral',
      description: 'Vestido longo com estampa floral delicada, ideal para eventos especiais e casamentos.',
      price: 189.90,
      comparePrice: 249.90,
      sku: 'VLF-007',
      inventory: 12,
      categoryName: 'Vestidos',
      status: 'ACTIVE',
      featured: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
          alt: 'Vestido Longo Floral'
        }
      ]
    },
    {
      name: 'Vestido Curto Social',
      slug: 'vestido-curto-social',
      description: 'Vestido curto elegante, corte evasê, perfeito para eventos corporativos e sociais.',
      price: 149.90,
      sku: 'VCS-008',
      inventory: 18,
      categoryName: 'Vestidos',
      status: 'ACTIVE',
      featured: false,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1566479179817-c14070c1f0a5?w=800',
          alt: 'Vestido Curto Social'
        }
      ]
    }
  ]

  console.log('Creating products...')

  for (const productData of products) {
    const category = categories.find(c => c.name === productData.categoryName)
    if (!category) {
      console.log(`Category '${productData.categoryName}' not found, skipping product '${productData.name}'`)
      continue
    }

    const existingProduct = await prisma.product.findUnique({
      where: { slug: productData.slug }
    })

    if (existingProduct) {
      console.log(`Product '${productData.name}' already exists, skipping...`)
      continue
    }

    const { categoryName, images, ...productProps } = productData

    const product = await prisma.product.create({
      data: {
        ...productProps,
        categoryId: category.id,
        images: {
          create: images.map((image, index) => ({
            url: image.url,
            alt: image.alt,
            order: index
          }))
        }
      },
      include: {
        category: true,
        images: true
      }
    })

    console.log(`✅ Created product: ${product.name} (${product.category.name})`)
  }

  console.log('✅ Products seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })