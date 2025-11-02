import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@zynxai.com' },
    update: {},
    create: {
      email: 'admin@zynxai.com',
      passwordHash: adminPasswordHash,
      role: 'superadmin',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create test users
  const testUsers = [
    {
      email: 'test1@example.com',
      password: 'password123',
      phone: '+1234567890',
      phoneVerified: true,
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
    {
      email: 'test2@example.com',
      password: 'password123',
      phone: '+1234567891',
      phoneVerified: true,
      trialStart: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
      trialEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago (expired)
    },
    {
      email: 'subscriber@example.com',
      password: 'password123',
      phone: '+1234567892',
      phoneVerified: true,
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
    },
  ];

  for (const userData of testUsers) {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        passwordHash,
        phone: userData.phone,
        phoneVerified: userData.phoneVerified,
        trialStart: userData.trialStart,
        trialEnd: userData.trialEnd,
        subscriptionPlan: userData.subscriptionPlan,
        subscriptionStatus: userData.subscriptionStatus,
      },
    });
    console.log('✅ Created test user:', user.email);

    // Create sample messages for active users
    if (user.email === 'test1@example.com' || user.email === 'subscriber@example.com') {
      await prisma.message.createMany({
        data: [
          {
            userId: user.id,
            role: 'user',
            content: 'Hello, how are you?',
            response: 'I am doing well, thank you! How can I assist you today?',
            tokens: 25,
          },
          {
            userId: user.id,
            role: 'user',
            content: 'What is the weather like?',
            response: 'I apologize, but I don\'t have access to real-time weather data. You can check weather websites or apps for current conditions.',
            tokens: 35,
          },
        ],
      });
      console.log(`  ✅ Created sample messages for ${user.email}`);
    }
  }

  // Create sample subscription for subscriber user
  const subscriberUser = await prisma.user.findUnique({
    where: { email: 'subscriber@example.com' },
  });

  if (subscriberUser) {
    await prisma.subscription.upsert({
      where: { stripeCustomerId: 'cus_test_subscriber' },
      update: {},
      create: {
        userId: subscriberUser.id,
        stripeCustomerId: 'cus_test_subscriber',
        stripeSubscriptionId: 'sub_test_subscriber',
        stripePriceId: 'price_pro_test',
        status: 'active',
        plan: 'pro',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    console.log('✅ Created sample subscription');
  }

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: subscriberUser?.id,
        action: 'signup',
        resource: 'user',
        details: 'User signed up successfully',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
      {
        userId: subscriberUser?.id,
        action: 'subscribe',
        resource: 'subscription',
        details: 'User subscribed to Pro plan',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      },
    ],
  });
  console.log('✅ Created audit logs');

  console.log('🎉 Database seed completed!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@zynxai.com / admin123');
  console.log('User (active trial): test1@example.com / password123');
  console.log('User (expired trial): test2@example.com / password123');
  console.log('User (subscribed): subscriber@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
