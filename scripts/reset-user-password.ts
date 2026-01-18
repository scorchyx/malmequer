import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'rubenj.m.araujo@gmail.com'
  const newPassword = process.argv[3] || 'ruben123'

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
    },
  })

  console.log('✅ Password alterada com sucesso!')
  console.log(`   Email: ${email}`)
  console.log(`   Nova Password: ${newPassword}`)
  console.log(`   Nome: ${user.name}`)
  console.log(`   Role: ${user.role}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e.message)
    console.log('\nUso: npx tsx scripts/reset-user-password.ts [email] [nova-password]')
    console.log('Exemplo: npx tsx scripts/reset-user-password.ts rubenj.m.araujo@gmail.com novapassword123')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
