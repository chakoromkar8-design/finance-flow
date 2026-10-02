// Run with:  npm run db:seed
// Creates ONE demo user with sample data (email: demo@financeflow.local).
// Set DEMO_PASSWORD in your .env, or the default below is used.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { seedDemoUser, DEMO_EMAIL } from '../server/services/demoData.js'

const prisma = new PrismaClient()
const password = process.env.DEMO_PASSWORD || 'Demo12345'

try {
  const result = await seedDemoUser(prisma, { password })
  console.log(result.created ? `Demo user created: ${DEMO_EMAIL} / ${password}` : 'Demo user already exists, nothing changed.')
} finally {
  await prisma.$disconnect()
}
