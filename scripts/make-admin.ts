import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'rubenj.m.araujo@gmail.com'

  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  })

  console.log(`✅ User ${user.email} updated to ADMIN role`)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
