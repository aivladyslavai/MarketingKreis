import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Marketing Kreis database...')
  console.log('📊 Database:', process.env.DATABASE_URL?.includes('postgresql') ? 'PostgreSQL' : 'SQLite')

  // Clear existing data in correct order (respecting foreign key constraints)
  console.log('🧹 Clearing existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.file.deleteMany()
  await prisma.marketingData.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.company.deleteMany()
  await prisma.contentTask.deleteMany()
  await prisma.leadStat.deleteMany()
  await prisma.budgetPlan.deleteMany()
  await prisma.calendarItem.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ Existing data cleared')

  // Create users with proper Role enum
  const defaultPassword = await bcrypt.hash('password123', 10)
  const adminPassword = await bcrypt.hash('Admin#12345', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      lastLogin: new Date(),
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@marketingkreis.ch',
      name: 'Marketing Manager',
      password: defaultPassword,
      role: 'MANAGER',
      isActive: true,
    },
  })

  const editorUser = await prisma.user.create({
    data: {
      email: 'editor@marketingkreis.ch',
      name: 'Content Editor',
      password: defaultPassword,
      role: 'EDITOR',
      isActive: true,
    },
  })

  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@marketingkreis.ch',
      name: 'Viewer User',
      password: defaultPassword,
      role: 'VIEWER',
      isActive: true,
    },
  })

  console.log('✅ Created users')

  // Create companies
  const company1 = await prisma.company.create({
    data: {
      name: 'Swiss Tech Solutions AG',
      website: 'https://swiss-tech.ch',
      industry: 'Technology',
      size: 'Enterprise',
      revenue: 5000000,
      city: 'Zürich',
      country: 'Switzerland',
      ownerId: adminUser.id,
    },
  })

  const company2 = await prisma.company.create({
    data: {
      name: 'Alpine Consulting GmbH',
      website: 'https://alpine-consulting.ch',
      industry: 'Consulting',
      size: 'SMB',
      revenue: 1200000,
      city: 'Bern',
      country: 'Switzerland',
      ownerId: managerUser.id,
    },
  })

  console.log('✅ Created companies')

  // Create contacts
  await prisma.contact.create({
    data: {
      firstName: 'Hans',
      lastName: 'Müller',
      email: 'hans.mueller@swiss-tech.ch',
      phone: '+41 44 123 45 67',
      position: 'CEO',
      companyId: company1.id,
      ownerId: adminUser.id,
    },
  })

  await prisma.contact.create({
    data: {
      firstName: 'Anna',
      lastName: 'Weber',
      email: 'anna.weber@alpine-consulting.ch',
      phone: '+41 31 987 65 43',
      position: 'Marketing Director',
      companyId: company2.id,
      ownerId: managerUser.id,
    },
  })

  console.log('✅ Created contacts')

  // Create activities for the radial circle
  const activities = [
    {
      title: 'Google Ads Campaign Q1',
      category: 'VERKAUFSFOERDERUNG',
      ring: 1,
      angle: 45,
      budget: 15000,
      actualSpend: 12500,
      status: 'ACTIVE',
      impressions: 50000,
      clicks: 2500,
      conversions: 125,
    },
    {
      title: 'Social Media Strategy',
      category: 'IMAGE',
      ring: 2,
      angle: 135,
      budget: 8000,
      actualSpend: 6500,
      status: 'ACTIVE',
      impressions: 25000,
      clicks: 1200,
      conversions: 45,
    },
    {
      title: 'Employer Branding Video',
      category: 'EMPLOYER_BRANDING',
      ring: 3,
      angle: 225,
      budget: 12000,
      actualSpend: 8000,
      status: 'IN_PROGRESS',
      impressions: 15000,
      clicks: 800,
      conversions: 20,
    },
    {
      title: 'Newsletter Campaign',
      category: 'KUNDENPFLEGE',
      ring: 1,
      angle: 315,
      budget: 3000,
      actualSpend: 2800,
      status: 'DONE',
      impressions: 8000,
      clicks: 400,
      conversions: 85,
    },
    {
      title: 'Trade Show Participation',
      category: 'VERKAUFSFOERDERUNG',
      ring: 4,
      angle: 90,
      budget: 25000,
      actualSpend: 0,
      status: 'PLANNED',
      impressions: 0,
      clicks: 0,
      conversions: 0,
    },
    {
      title: 'Website Redesign',
      category: 'IMAGE',
      ring: 2,
      angle: 180,
      budget: 18000,
      actualSpend: 15000,
      status: 'ACTIVE',
      impressions: 30000,
      clicks: 1500,
      conversions: 75,
    },
  ]

  for (const activity of activities) {
    await prisma.activity.create({
      data: {
        ...activity,
        userId: adminUser.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      },
    })
  }

  console.log('✅ Created activities')

  // Create budget plans
  const currentYear = new Date().getFullYear()
  const categories = ['VERKAUFSFOERDERUNG', 'IMAGE', 'EMPLOYER_BRANDING', 'KUNDENPFLEGE']
  
  for (let quarter = 1; quarter <= 4; quarter++) {
    for (const category of categories) {
      await prisma.budgetPlan.create({
        data: {
          year: currentYear,
          quarter: quarter,
          category: category,
          budgetAmount: Math.floor(Math.random() * 50000) + 10000,
          actualSpend: Math.floor(Math.random() * 40000) + 5000,
          targetImpressions: Math.floor(Math.random() * 100000) + 20000,
          actualImpressions: Math.floor(Math.random() * 80000) + 15000,
          targetClicks: Math.floor(Math.random() * 5000) + 1000,
          actualClicks: Math.floor(Math.random() * 4000) + 800,
          targetConversions: Math.floor(Math.random() * 200) + 50,
          actualConversions: Math.floor(Math.random() * 150) + 30,
        },
      })
    }
  }

  console.log('✅ Created budget plans')

  // Create lead statistics
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    for (const category of categories) {
      await prisma.leadStat.create({
        data: {
          date: date,
          category: category,
          spend: Math.floor(Math.random() * 1000) + 100,
          leads: Math.floor(Math.random() * 50) + 5,
          cpl: Math.floor(Math.random() * 50) + 10,
        },
      })
    }
  }

  console.log('✅ Created lead statistics')

  // Create content tasks
  const contentTasks = [
    {
      title: 'Q1 Social Media Posts',
      description: 'Create 12 social media posts for Q1 campaign',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'Social Media',
      contentType: 'social',
      platform: 'LinkedIn',
      dueDate: new Date('2024-03-15'),
    },
    {
      title: 'Website Content Update',
      description: 'Update homepage and product pages',
      status: 'TODO',
      priority: 'MEDIUM',
      category: 'Website',
      contentType: 'web',
      platform: 'Website',
      dueDate: new Date('2024-03-30'),
      wordCount: 2000,
    },
    {
      title: 'Email Newsletter March',
      description: 'Monthly newsletter with company updates',
      status: 'REVIEW',
      priority: 'MEDIUM',
      category: 'Email',
      contentType: 'email',
      platform: 'Mailchimp',
      dueDate: new Date('2024-03-25'),
      wordCount: 800,
    },
    {
      title: 'Product Demo Video',
      description: 'Create a 3-minute product demonstration video',
      status: 'APPROVED',
      priority: 'HIGH',
      category: 'Video',
      contentType: 'video',
      platform: 'YouTube',
      dueDate: new Date('2024-04-01'),
    },
  ]

  for (const task of contentTasks) {
    await prisma.contentTask.create({
      data: {
        ...task,
        assigneeId: editorUser.id,
      },
    })
  }

  console.log('✅ Created content tasks')

  // Create deals
  await prisma.deal.create({
    data: {
      title: 'Swiss Tech - Annual Marketing Package',
      description: 'Comprehensive marketing services for 2024',
      value: 120000,
      stage: 'PROPOSAL',
      probability: 75,
      expectedCloseDate: new Date('2024-04-30'),
      companyId: company1.id,
      ownerId: adminUser.id,
    },
  })

  await prisma.deal.create({
    data: {
      title: 'Alpine Consulting - Rebranding Project',
      description: 'Complete rebranding including logo and website',
      value: 45000,
      stage: 'NEGOTIATION',
      probability: 60,
      expectedCloseDate: new Date('2024-05-15'),
      companyId: company2.id,
      ownerId: managerUser.id,
    },
  })

  console.log('✅ Created deals')

  // Create marketing data entries
  const marketingDataEntries = [
    {
      category: 'Marketing',
      subcategory: 'Digital Marketing',
      title: 'Google Ads Q1 Campaign',
      description: 'Comprehensive Google Ads campaign for Q1 2024',
      budget: 15000,
      actual: 12500,
      value: 45000,
      month: 'März',
      year: 2024,
      status: 'active',
      priority: 'high',
      impressions: 150000,
      clicks: 7500,
      conversions: 375,
      ctr: 5.0,
      cpc: 1.67,
      cpl: 33.33,
      tags: '["google-ads", "ppc", "conversion-optimization"]',
      userId: adminUser.id,
      companyId: company1.id,
    },
    {
      category: 'Sales',
      subcategory: 'Lead Generation',
      title: 'LinkedIn Lead Gen Campaign',
      description: 'B2B lead generation through LinkedIn advertising',
      budget: 8000,
      actual: 7200,
      value: 24000,
      month: 'Februar',
      year: 2024,
      status: 'completed',
      priority: 'medium',
      impressions: 85000,
      clicks: 2550,
      conversions: 127,
      ctr: 3.0,
      cpc: 2.82,
      cpl: 56.69,
      tags: '["linkedin", "b2b", "lead-generation"]',
      userId: managerUser.id,
      companyId: company2.id,
    },
    {
      category: 'Operations',
      subcategory: 'Content Creation',
      title: 'Website Content Optimization',
      description: 'SEO-optimized content creation for website',
      budget: 5000,
      actual: 4500,
      value: 15000,
      month: 'Januar',
      year: 2024,
      status: 'active',
      priority: 'medium',
      impressions: 45000,
      clicks: 1350,
      conversions: 67,
      ctr: 3.0,
      cpc: 3.33,
      cpl: 67.16,
      tags: '["seo", "content", "website"]',
      userId: editorUser.id,
    },
    {
      category: 'Finance',
      subcategory: 'Budget Planning',
      title: 'Q2 Marketing Budget Allocation',
      description: 'Strategic budget allocation for Q2 marketing activities',
      budget: 50000,
      actual: 0,
      value: 150000,
      month: 'April',
      year: 2024,
      status: 'planned',
      priority: 'high',
      tags: '["budget", "planning", "q2"]',
      userId: adminUser.id,
    },
  ]

  for (const entry of marketingDataEntries) {
    await prisma.marketingData.create({
      data: {
        ...entry,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      },
    })
  }

  console.log('✅ Created marketing data entries')

  // Create audit log entries for compliance
  const auditEntries = [
    {
      action: 'CREATE',
      resource: 'users',
      resourceId: adminUser.id,
      userId: adminUser.id,
      metadata: JSON.stringify({ role: 'ADMIN', email: 'admin@example.com' }),
    },
    {
      action: 'CREATE',
      resource: 'companies',
      resourceId: company1.id,
      userId: adminUser.id,
      metadata: JSON.stringify({ name: 'Swiss Tech Solutions AG', industry: 'Technology' }),
    },
    {
      action: 'CREATE',
      resource: 'companies',
      resourceId: company2.id,
      userId: managerUser.id,
      metadata: JSON.stringify({ name: 'Alpine Consulting GmbH', industry: 'Consulting' }),
    },
  ]

  for (const audit of auditEntries) {
    await prisma.auditLog.create({
      data: audit,
    })
  }

  console.log('✅ Created audit log entries')

  // Print summary
  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('📊 Summary:')
  console.log(`  👥 Users: ${await prisma.user.count()}`)
  console.log(`  🏢 Companies: ${await prisma.company.count()}`)
  console.log(`  👤 Contacts: ${await prisma.contact.count()}`)
  console.log(`  🎯 Activities: ${await prisma.activity.count()}`)
  console.log(`  💰 Deals: ${await prisma.deal.count()}`)
  console.log(`  📝 Content Tasks: ${await prisma.contentTask.count()}`)
  console.log(`  📈 Marketing Data: ${await prisma.marketingData.count()}`)
  console.log(`  📋 Budget Plans: ${await prisma.budgetPlan.count()}`)
  console.log(`  📊 Lead Stats: ${await prisma.leadStat.count()}`)
  console.log(`  📋 Audit Logs: ${await prisma.auditLog.count()}`)
  console.log('')
  console.log('🔑 Admin Login:')
  console.log('  Email: admin@example.com')
  console.log('  Password: Admin#12345')
  console.log('  Role: ADMIN')
  console.log('')
  console.log('🌐 Access URLs:')
  console.log('  Frontend: http://localhost:3000')
  console.log('  Backend API: http://localhost:8080/api')
  console.log('  API Docs: http://localhost:8080/api/docs')
  console.log('  pgAdmin: http://localhost:5050')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })