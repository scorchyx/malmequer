/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPaymentMethods() {
  try {
    console.log('🔧 Seeding payment method configurations...\n')

    // Clear existing payment method configs
    await prisma.paymentMethodConfig.deleteMany()

    // Define all payment methods with default configurations
    const paymentMethods = [
      {
        method: 'multibanco',
        name: 'Multibanco',
        icon: '🏧',
        enabled: true,
        processingMode: 'MANUAL' as const,
        description: 'Referência Multibanco - Pagamento em ATM ou homebanking',
        displayOrder: 1,
      },
      {
        method: 'mbway',
        name: 'MB Way',
        icon: '📱',
        enabled: true,
        processingMode: 'MANUAL' as const,
        description: 'Pagamento através da app MB Way',
        displayOrder: 2,
      },
      {
        method: 'visa',
        name: 'VISA',
        icon: '💳',
        enabled: true,
        processingMode: 'AUTO' as const,
        description: 'Cartão de crédito/débito VISA - Processamento automático',
        displayOrder: 3,
      },
      {
        method: 'mastercard',
        name: 'MasterCard',
        icon: '💳',
        enabled: true,
        processingMode: 'AUTO' as const,
        description: 'Cartão de crédito/débito MasterCard - Processamento automático',
        displayOrder: 4,
      },
      {
        method: 'applepay',
        name: 'Apple Pay',
        icon: '🍎',
        enabled: true,
        processingMode: 'AUTO' as const,
        description: 'Pagamento através do Apple Pay - Processamento automático',
        displayOrder: 5,
      },
      {
        method: 'googlepay',
        name: 'Google Pay',
        icon: '🔴',
        enabled: true,
        processingMode: 'AUTO' as const,
        description: 'Pagamento através do Google Pay - Processamento automático',
        displayOrder: 6,
      },
    ]

    // Create payment method configurations
    for (const methodConfig of paymentMethods) {
      const _created = await prisma.paymentMethodConfig.create({
        data: methodConfig,
      })

      const processingType = methodConfig.processingMode === 'MANUAL' ? '👨‍💼 Manual' : '🤖 Automático'
      console.log(`✅ ${methodConfig.icon} ${methodConfig.name} (${methodConfig.method})`)
      console.log(`   📝 ${methodConfig.description}`)
      console.log(`   ⚙️  Processamento: ${processingType}`)
      console.log(`   🔢 Ordem: ${methodConfig.displayOrder}`)
      console.log(`   ✅ Ativo: ${methodConfig.enabled ? 'Sim' : 'Não'}`)
      console.log('')
    }

    console.log('🎉 Payment method configurations seeded successfully!')

    // Show summary
    const summary = await prisma.paymentMethodConfig.groupBy({
      by: ['processingMode'],
      _count: { _all: true },
    })

    console.log('\n📊 Summary:')
    summary.forEach(stat => {
      const type = stat.processingMode === 'MANUAL' ? '👨‍💼 Manual' : '🤖 Automático'
      console.log(`   ${type}: ${stat._count._all} métodos`)
    })

    const totalEnabled = await prisma.paymentMethodConfig.count({
      where: { enabled: true },
    })

    console.log(`   ✅ Ativos: ${totalEnabled} métodos`)
    console.log(`   📱 Total configurado: ${paymentMethods.length} métodos`)

  } catch (error) {
    console.error('❌ Error seeding payment methods:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
if (require.main === module) {
  seedPaymentMethods()
    .then(() => {
      console.log('✅ Payment methods seeded successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Payment methods seeding failed:', error)
      process.exit(1)
    })
}

export default seedPaymentMethods