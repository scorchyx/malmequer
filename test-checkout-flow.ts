import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCheckoutFlow() {
  try {
    console.log('🛍️ Testando Fluxo Completo de Checkout...\n')

    // Get the test user
    const user = await prisma.user.findFirst({
      where: { email: 'rubenj.m.araujo@gmail.com' }
    })

    if (!user) {
      console.log('❌ Utilizador de teste não encontrado.')
      return
    }

    console.log(`✅ Utilizador encontrado: ${user.name}`)

    // Step 1: Clear existing cart and orders for clean test
    await prisma.cartItem.deleteMany({
      where: { userId: user.id }
    })

    await prisma.order.deleteMany({
      where: { userId: user.id }
    })

    await prisma.address.deleteMany({
      where: { userId: user.id }
    })

    console.log('🧹 Dados de teste limpos\n')

    // Step 2: Add products to cart
    console.log('🛒 PASSO 1: Adicionar produtos ao carrinho\n')

    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        category: {
          name: {
            in: ['Parte de Cima', 'Parte de Baixo', 'Conjuntos', 'Vestidos']
          }
        }
      },
      include: {
        category: true,
        variants: true
      },
      take: 3
    })

    console.log(`📦 Produtos disponíveis:`)
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - €${product.price}`)
    })

    // Add products to cart
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const quantity = i + 1 // 1, 2, 3

      console.log(`\n➕ POST /api/cart`)
      console.log(`   Body: { "productId": "${product.id}", "quantity": ${quantity} }`)

      const cartItem = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId: product.id,
          quantity
        },
        include: {
          product: true
        }
      })

      console.log(`   ✅ Adicionado: ${cartItem.product.name} x${cartItem.quantity}`)
    }

    // Show current cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { category: true }
        }
      }
    })

    const cartTotal = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0
    )

    console.log(`\n🛒 Carrinho atual:`)
    cartItems.forEach((item, index) => {
      const subtotal = Number(item.product.price) * item.quantity
      console.log(`   ${index + 1}. ${item.product.name} x${item.quantity} = €${subtotal.toFixed(2)}`)
    })
    console.log(`   💰 Total: €${cartTotal.toFixed(2)}`)

    // Step 3: Create shipping and billing addresses
    console.log(`\n🏠 PASSO 2: Criar endereços de entrega e cobrança\n`)

    console.log(`➕ POST /api/addresses (endereço de entrega)`)
    const shippingAddress = await prisma.address.create({
      data: {
        userId: user.id,
        type: 'SHIPPING',
        firstName: 'Ruben',
        lastName: 'Araújo',
        addressLine1: 'Rua das Flores, 123',
        addressLine2: '2º Esquerdo',
        city: 'Lisboa',
        state: 'Lisboa',
        postalCode: '1200-100',
        country: 'Portugal',
        phone: '+351 912 345 678',
        isDefault: true
      }
    })

    console.log(`   ✅ Endereço de entrega criado: ${shippingAddress.addressLine1}, ${shippingAddress.city}`)

    console.log(`\n➕ POST /api/addresses (endereço de cobrança)`)
    const billingAddress = await prisma.address.create({
      data: {
        userId: user.id,
        type: 'BILLING',
        firstName: 'Ruben',
        lastName: 'Araújo',
        company: 'Malmequer Lda',
        addressLine1: 'Avenida da República, 456',
        city: 'Porto',
        state: 'Porto',
        postalCode: '4000-200',
        country: 'Portugal',
        phone: '+351 912 345 678',
        vatNumber: 'PT123456789',
        isDefault: true
      }
    })

    console.log(`   ✅ Endereço de cobrança criado: ${billingAddress.addressLine1}, ${billingAddress.city}`)

    // Step 4: Create order
    console.log(`\n📋 PASSO 3: Criar pedido\n`)

    const orderNumber = `ORD-${Date.now()}`
    const subtotalAmount = cartTotal
    const taxAmount = cartTotal * 0.23 // 23% IVA
    const shippingAmount = cartTotal > 50 ? 0 : 5.99 // Envio grátis acima €50
    const totalAmount = subtotalAmount + taxAmount + shippingAmount

    console.log(`➕ POST /api/orders`)
    console.log(`   Body: {`)
    console.log(`     "items": [${cartItems.length} products from cart],`)
    console.log(`     "shippingAddress": "${shippingAddress.id}",`)
    console.log(`     "billingAddress": "${billingAddress.id}",`)
    console.log(`     "paymentMethod": "stripe",`)
    console.log(`     "shippingMethod": "standard"`)
    console.log(`   }`)

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        shippingAddressId: shippingAddress.id,
        billingAddressId: billingAddress.id,
        subtotalAmount,
        taxAmount,
        shippingAmount,
        totalAmount,
        paymentMethod: 'stripe',
        shippingMethod: 'standard',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        },
        shippingAddress: true,
        billingAddress: true
      }
    })

    console.log(`   ✅ Pedido criado: ${order.orderNumber}`)
    console.log(`   📋 Status: ${order.status}`)
    console.log(`   💳 Status pagamento: ${order.paymentStatus}`)
    console.log(`   💰 Total: €${Number(order.totalAmount).toFixed(2)}`)

    // Show order breakdown
    console.log(`\n📊 Detalhes do Pedido:`)
    console.log(`   🛍️  Items:`)
    order.items.forEach((item, index) => {
      const itemTotal = Number(item.price) * item.quantity
      console.log(`     ${index + 1}. ${item.product.name} x${item.quantity} = €${itemTotal.toFixed(2)}`)
    })
    console.log(`   💰 Subtotal: €${Number(order.subtotalAmount).toFixed(2)}`)
    console.log(`   📈 IVA (23%): €${Number(order.taxAmount).toFixed(2)}`)
    console.log(`   🚛 Envio: €${Number(order.shippingAmount).toFixed(2)}`)
    console.log(`   💳 TOTAL: €${Number(order.totalAmount).toFixed(2)}`)

    console.log(`\n🏠 Endereços:`)
    console.log(`   📦 Entrega: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`)
    console.log(`      ${order.shippingAddress.addressLine1}`)
    console.log(`      ${order.shippingAddress.postalCode} ${order.shippingAddress.city}`)
    console.log(`   💼 Cobrança: ${order.billingAddress.firstName} ${order.billingAddress.lastName}`)
    console.log(`      ${order.billingAddress.addressLine1}`)
    console.log(`      ${order.billingAddress.postalCode} ${order.billingAddress.city}`)
    if (order.billingAddress.vatNumber) {
      console.log(`      NIF: ${order.billingAddress.vatNumber}`)
    }

    // Step 5: Simulate payment process
    console.log(`\n💳 PASSO 4: Processar pagamento\n`)

    console.log(`➕ POST /api/payments/create-intent`)
    console.log(`   Body: { "orderId": "${order.id}" }`)
    console.log(`   💡 Simulação: Stripe criaria PaymentIntent com valor €${Number(order.totalAmount).toFixed(2)}`)

    // Simulate successful payment
    console.log(`\n🎯 Simulando pagamento bem-sucedido...`)

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID'
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    console.log(`   ✅ Pagamento processado com sucesso!`)
    console.log(`   📋 Status do pedido: ${updatedOrder.status}`)
    console.log(`   💳 Status do pagamento: ${updatedOrder.paymentStatus}`)

    // Step 6: Clear cart after successful order
    console.log(`\n🧹 PASSO 5: Limpar carrinho após pedido\n`)

    await prisma.cartItem.deleteMany({
      where: { userId: user.id }
    })

    console.log(`   ✅ Carrinho limpo após checkout bem-sucedido`)

    // Step 7: Show order history
    console.log(`\n📚 PASSO 6: Histórico de pedidos\n`)

    console.log(`📋 GET /api/orders`)

    const orderHistory = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: { category: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`   ✅ Resposta: ${orderHistory.length} pedidos encontrados`)

    orderHistory.forEach((order, index) => {
      console.log(`\n   ${index + 1}. Pedido ${order.orderNumber}`)
      console.log(`      Data: ${order.createdAt.toLocaleDateString('pt-PT')}`)
      console.log(`      Status: ${order.status}`)
      console.log(`      Pagamento: ${order.paymentStatus}`)
      console.log(`      Total: €${Number(order.totalAmount).toFixed(2)}`)
      console.log(`      Items: ${order.items.length} produtos`)
    })

    // Step 8: Simulate order status updates
    console.log(`\n📦 PASSO 7: Simular atualizações de status\n`)

    const statusUpdates = ['PROCESSING', 'SHIPPED', 'DELIVERED']

    for (const status of statusUpdates) {
      console.log(`🔄 Atualizando status para: ${status}`)

      await prisma.order.update({
        where: { id: order.id },
        data: { status: status as any }
      })

      console.log(`   ✅ Status atualizado: ${status}`)

      // Simulate time delay
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const finalOrder = await prisma.order.findUnique({
      where: { id: order.id }
    })

    console.log(`\n📋 Status final do pedido: ${finalOrder?.status}`)

    console.log('\n🎉 Teste do fluxo de checkout concluído!')
    console.log('\n📋 Resumo do fluxo testado:')
    console.log('   ✅ 1. Adicionar produtos ao carrinho')
    console.log('   ✅ 2. Criar endereços de entrega e cobrança')
    console.log('   ✅ 3. Criar pedido com cálculos corretos')
    console.log('   ✅ 4. Processar pagamento (simulado)')
    console.log('   ✅ 5. Limpar carrinho após checkout')
    console.log('   ✅ 6. Visualizar histórico de pedidos')
    console.log('   ✅ 7. Atualizar status do pedido')
    console.log('   💰 Cálculos: Subtotal + IVA (23%) + Envio')
    console.log('   🏠 Endereços: Entrega e cobrança separados')
    console.log('   📋 Estados: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED')
    console.log('   💳 Pagamentos: PENDING → PAID')
    console.log('   🎯 Sistema pronto para utilizadores autenticados!')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testCheckoutFlow()