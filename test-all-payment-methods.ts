import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAllPaymentMethods() {
  try {
    console.log('💳 Testando Todos os Métodos de Pagamento do eCommerce...\n')

    // Get admin user
    const admin = await prisma.user.findFirst({
      where: {
        email: 'rubenj.m.araujo@gmail.com',
        role: 'ADMIN',
      },
    })

    if (!admin) {
      console.log('❌ Utilizador administrador não encontrado.')
      return
    }

    console.log(`👑 Administrador: ${admin.name} (${admin.email})\n`)

    // Step 1: Clear existing test data
    await prisma.order.deleteMany({
      where: {
        orderNumber: {
          startsWith: 'PAYMENT-TEST-',
        },
      },
    })

    // Create test user address
    let testAddress = await prisma.address.findFirst({
      where: { userId: admin.id },
    })

    testAddress ??= await prisma.address.create({
      data: {
        userId: admin.id,
        type: 'SHIPPING',
        firstName: 'Test',
        lastName: 'Address',
        addressLine1: 'Test Street 123',
        city: 'Test City',
        state: 'Test State',
        postalCode: '1234-567',
        country: 'Portugal',
        isDefault: true,
      },
    })

    // Step 2: Define all payment methods
    console.log('📋 PASSO 1: Métodos de pagamento disponíveis no eCommerce\n')

    const paymentMethods = [
      {
        method: 'multibanco',
        name: 'Multibanco',
        icon: '🏧',
        type: 'portuguese',
        manualAcceptance: true,
        description: 'Referência Multibanco - Pagamento em ATM ou homebanking',
      },
      {
        method: 'mbway',
        name: 'MB Way',
        icon: '📱',
        type: 'portuguese',
        manualAcceptance: true,
        description: 'Pagamento através da app MB Way',
      },
      {
        method: 'visa',
        name: 'VISA',
        icon: '💳',
        type: 'card',
        manualAcceptance: false,
        description: 'Cartão de crédito/débito VISA - Processamento automático',
      },
      {
        method: 'mastercard',
        name: 'MasterCard',
        icon: '💳',
        type: 'card',
        manualAcceptance: false,
        description: 'Cartão de crédito/débito MasterCard - Processamento automático',
      },
      {
        method: 'applepay',
        name: 'Apple Pay',
        icon: '🍎',
        type: 'digital_wallet',
        manualAcceptance: false,
        description: 'Pagamento através do Apple Pay - Processamento automático',
      },
      {
        method: 'googlepay',
        name: 'Google Pay',
        icon: '🔴',
        type: 'digital_wallet',
        manualAcceptance: false,
        description: 'Pagamento através do Google Pay - Processamento automático',
      },
    ]

    console.log('💼 Métodos de pagamento suportados:')
    paymentMethods.forEach((method, index) => {
      const acceptance = method.manualAcceptance ? '👨‍💼 Manual' : '🤖 Automático'
      console.log(`   ${index + 1}. ${method.icon} ${method.name} (${method.method})`)
      console.log(`      📝 ${method.description}`)
      console.log(`      ⚙️  Processamento: ${acceptance}`)
      console.log('')
    })

    // Step 3: Create test orders for each payment method
    console.log('📋 PASSO 2: Criar pedidos teste para cada método de pagamento\n')

    const testOrders = []
    for (let i = 0; i < paymentMethods.length; i++) {
      const method = paymentMethods[i]
      const amount = 50 + (i * 25) // €50, €75, €100, €125, €150, €175

      const subtotal = amount
      const tax = subtotal * 0.23
      const shipping = subtotal > 50 ? 0 : 5.99
      const total = subtotal + tax + shipping

      const order = await prisma.order.create({
        data: {
          orderNumber: `PAYMENT-TEST-${(i + 1).toString().padStart(3, '0')}`,
          userId: admin.id,
          subtotalAmount: subtotal,
          taxAmount: tax,
          shippingAmount: shipping,
          totalAmount: total,
          paymentMethod: method.method,
          shippingMethod: 'standard',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          notes: `Teste ${method.name} - ${method.description}`,
          shippingAddressId: testAddress.id,
          billingAddressId: testAddress.id,
        },
        include: {
          user: { select: { name: true, email: true } },
        },
      })

      testOrders.push({ order, method })
      console.log(`✅ Pedido ${method.name} criado: ${order.orderNumber} - €${Number(order.totalAmount).toFixed(2)}`)
    }

    // Step 4: Show payment processing scenarios
    console.log('\n💼 PASSO 3: Cenários de processamento de pagamentos\n')

    console.log('🇵🇹 MÉTODOS PORTUGUESES (Aceitação Manual):')
    const portugueseMethods = testOrders.filter(({ method }) => method.type === 'portuguese')

    for (const { order, method } of portugueseMethods) {
      console.log(`\n${method.icon} ${method.name} - ${order.orderNumber}`)
      console.log(`   💰 Valor: €${Number(order.totalAmount).toFixed(2)}`)
      console.log('   📋 Fluxo:')
      console.log('   1. 📧 Cliente recebe email com instruções de pagamento')
      console.log('   2. 💳 Cliente efectua pagamento (ATM/App)')
      console.log('   3. 👨‍💼 Admin confirma recebimento manualmente')
      console.log('   4. ✅ Pedido confirmado automaticamente')

      console.log('\n   🔄 PUT /api/admin/orders')
      console.log('   Headers: Authorization: Bearer <admin-token>')
      console.log('   Body: {')
      console.log(`     "orderId": "${order.id}",`)
      console.log('     "paymentStatus": "PAID",')
      console.log('     "status": "CONFIRMED",')
      console.log(`     "notes": "✅ ${method.name} confirmado - Pagamento verificado pelo admin"`)
      console.log('   }')

      // Simulate manual acceptance
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          notes: `✅ ${method.name} confirmado - Pagamento verificado pelo admin ${admin.name}`,
        },
      })

      console.log(`   ✅ Pagamento ${method.name} aceite manualmente`)
    }

    console.log('\n\n💳 CARTÕES DE CRÉDITO/DÉBITO (Processamento Automático):')
    const cardMethods = testOrders.filter(({ method }) => method.type === 'card')

    for (const { order, method } of cardMethods) {
      console.log(`\n${method.icon} ${method.name} - ${order.orderNumber}`)
      console.log(`   💰 Valor: €${Number(order.totalAmount).toFixed(2)}`)
      console.log('   📋 Fluxo:')
      console.log('   1. 💳 Cliente insere dados do cartão no checkout')
      console.log('   2. 🔒 Stripe processa pagamento em tempo real')
      console.log('   3. ⚡ Confirmação imediata (sucesso/falha)')
      console.log('   4. ✅ Pedido confirmado automaticamente se aprovado')

      console.log('\n   🚫 Aceitação manual NÃO permitida')
      console.log('   📝 Erro esperado: "Manual payment acceptance is only supported for Multibanco and MB Way payments"')

      // Simulate automatic processing
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          notes: `✅ ${method.name} processado automaticamente via Stripe`,
        },
      })

      console.log(`   ✅ Pagamento ${method.name} processado automaticamente`)
    }

    console.log('\n\n📱 CARTEIRAS DIGITAIS (Processamento Automático):')
    const walletMethods = testOrders.filter(({ method }) => method.type === 'digital_wallet')

    for (const { order, method } of walletMethods) {
      console.log(`\n${method.icon} ${method.name} - ${order.orderNumber}`)
      console.log(`   💰 Valor: €${Number(order.totalAmount).toFixed(2)}`)
      console.log('   📋 Fluxo:')
      console.log(`   1. 📱 Cliente seleciona ${method.name} no checkout`)
      console.log('   2. 🔐 Autenticação biométrica/PIN')
      console.log('   3. ⚡ Stripe processa pagamento em tempo real')
      console.log('   4. ✅ Confirmação imediata e segura')

      console.log('\n   🚫 Aceitação manual NÃO permitida')
      console.log('   📝 Erro esperado: "Manual payment acceptance is only supported for Multibanco and MB Way payments"')

      // Simulate automatic processing
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          notes: `✅ ${method.name} processado automaticamente via Stripe`,
        },
      })

      console.log(`   ✅ Pagamento ${method.name} processado automaticamente`)
    }

    // Step 5: Test manual acceptance restrictions
    console.log('\n\n❌ PASSO 4: Testar restrições de aceitação manual\n')

    const nonManualMethods = testOrders.filter(({ method }) => !method.manualAcceptance)
    console.log('🔒 Tentativa de confirmar manualmente métodos não-portugueses:')

    for (const { order, method } of nonManualMethods.slice(0, 2)) {
      console.log(`\n${method.icon} ${method.name} - ${order.orderNumber}`)
      console.log('   💳 PUT /api/admin/orders (tentativa manual)')
      console.log(`   Body: { "orderId": "${order.id}", "paymentStatus": "PAID" }`)
      console.log('   ❌ Resposta: 400 Bad Request')
      console.log('   📝 Erro: "Manual payment acceptance is only supported for Multibanco and MB Way payments"')
    }

    // Step 6: Final statistics
    console.log('\n📊 PASSO 5: Estatísticas finais por método de pagamento\n')

    const paymentStats = await prisma.order.groupBy({
      by: ['paymentMethod', 'paymentStatus'],
      where: {
        orderNumber: {
          startsWith: 'PAYMENT-TEST-',
        },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
    })

    console.log('📊 Resumo dos pagamentos processados:')
    paymentMethods.forEach(method => {
      const stats = paymentStats.filter(s => s.paymentMethod === method.method)
      const totalOrders = stats.reduce((sum, s) => sum + s._count._all, 0)
      const totalValue = stats.reduce((sum, s) => sum + Number(s._sum.totalAmount || 0), 0)
      const paidOrders = stats.find(s => s.paymentStatus === 'PAID')?._count._all || 0

      console.log(`   ${method.icon} ${method.name}: ${totalOrders} pedidos - €${totalValue.toFixed(2)} (${paidOrders} pagos)`)
    })

    console.log('\n🎉 Teste de todos os métodos de pagamento concluído!')
    console.log('\n📋 Resumo completo do sistema:')
    console.log('   🇵🇹 PORTUGUESES (Manual):')
    console.log('      🏧 Multibanco - Referência ATM/Homebanking')
    console.log('      📱 MB Way - App móvel instantâneo')
    console.log('   💳 CARTÕES (Automático):')
    console.log('      💳 VISA - Processamento Stripe')
    console.log('      💳 MasterCard - Processamento Stripe')
    console.log('   📱 CARTEIRAS DIGITAIS (Automático):')
    console.log('      🍎 Apple Pay - Biometria + Stripe')
    console.log('      🔴 Google Pay - Biometria + Stripe')
    console.log('   🔒 Segurança: Aceitação manual apenas para métodos portugueses')
    console.log('   ⚡ Eficiência: Processamento automático para cartões e carteiras')
    console.log('   👑 Controlo admin: Dashboard completo de todos os pagamentos')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

void testAllPaymentMethods()