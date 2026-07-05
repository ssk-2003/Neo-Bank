const { PrismaClient } = require('../lib/generated/prisma/client');
const { PrismaBetterSQLite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'dev.db');
const adapter = new PrismaBetterSQLite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

function generateAccountNumber() {
  return Math.random().toString().slice(2, 12).padStart(10, '0');
}

function generateCardNumber() {
  const groups = Array.from({ length: 4 }, () =>
    Math.floor(1000 + Math.random() * 9000)
  );
  return groups.join(' ');
}

function generateExpiry() {
  const year = new Date().getFullYear() + Math.floor(Math.random() * 5) + 1;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  return `${month}/${String(year).slice(2)}`;
}

function generateCVV() {
  return String(Math.floor(100 + Math.random() * 900));
}

function randomRef() {
  return 'TXN' + Date.now() + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function main() {
  console.log('🌱 Seeding NeoBank database (JS version)...');

  // Clear existing data
  await prisma.scheduledTransfer.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.rewardPoints.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.card.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  // --- ADMIN USER ---
  const admin = await prisma.user.create({
    data: {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@neobank.com',
      phone: '+1-555-0100',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'ADMIN001',
    },
  });

  // --- CUSTOMER USERS ---
  const alice = await prisma.user.create({
    data: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0101',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'ALICE001',
    },
  });

  const bob = await prisma.user.create({
    data: {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      phone: '+1-555-0102',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'BOB001',
      referredBy: 'ALICE001',
    },
  });

  const carol = await prisma.user.create({
    data: {
      firstName: 'Carol',
      lastName: 'Williams',
      email: 'carol@example.com',
      phone: '+1-555-0103',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'CAROL001',
    },
  });

  const david = await prisma.user.create({
    data: {
      firstName: 'David',
      lastName: 'Brown',
      email: 'david@example.com',
      phone: '+1-555-0104',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'FROZEN',
      emailVerified: true,
      referralCode: 'DAVID001',
    },
  });

  // --- ACCOUNTS ---
  const aliceChecking = await prisma.account.create({
    data: {
      userId: alice.id,
      accountNumber: generateAccountNumber(),
      type: 'CHECKING',
      balance: 12450.75,
      currency: 'USD',
      status: 'ACTIVE',
    },
  });

  const aliceSavings = await prisma.account.create({
    data: {
      userId: alice.id,
      accountNumber: generateAccountNumber(),
      type: 'SAVINGS',
      balance: 35200.00,
      currency: 'USD',
      status: 'ACTIVE',
    },
  });

  const bobChecking = await prisma.account.create({
    data: {
      userId: bob.id,
      accountNumber: generateAccountNumber(),
      type: 'CHECKING',
      balance: 5320.50,
      currency: 'USD',
      status: 'ACTIVE',
    },
  });

  const carolChecking = await prisma.account.create({
    data: {
      userId: carol.id,
      accountNumber: generateAccountNumber(),
      type: 'CHECKING',
      balance: 8900.00,
      currency: 'USD',
      status: 'ACTIVE',
    },
  });

  const carolBusiness = await prisma.account.create({
    data: {
      userId: carol.id,
      accountNumber: generateAccountNumber(),
      type: 'BUSINESS',
      balance: 52000.00,
      currency: 'USD',
      status: 'ACTIVE',
    },
  });

  const davidChecking = await prisma.account.create({
    data: {
      userId: david.id,
      accountNumber: generateAccountNumber(),
      type: 'CHECKING',
      balance: 1200.00,
      currency: 'USD',
      status: 'FROZEN',
    },
  });

  // --- TRANSACTIONS ---
  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const categories = ['FOOD', 'SHOPPING', 'BILLS', 'TRAVEL', 'ENTERTAINMENT', 'HEALTHCARE', 'SALARY', 'OTHER'];
  const descriptions = {
    FOOD: ['Starbucks', "McDonald's", 'Whole Foods', 'Pizza Hut', 'Chipotle'],
    SHOPPING: ['Amazon', 'Nike Store', 'Apple Store', 'Target', 'Walmart'],
    BILLS: ['Electric Bill', 'Internet Bill', 'Phone Bill', 'Rent Payment', 'Water Bill'],
    TRAVEL: ['Uber', 'Delta Airlines', 'Marriott Hotel', 'Airbnb', 'Gas Station'],
    ENTERTAINMENT: ['Netflix', 'Spotify', 'Cinema Ticket', 'Gaming', 'Concert'],
    HEALTHCARE: ['CVS Pharmacy', 'Doctor Visit', 'Dental Care', 'Health Insurance', 'Gym'],
    SALARY: ['Monthly Salary', 'Bonus', 'Freelance Payment', 'Consulting Fee'],
    OTHER: ['ATM Withdrawal', 'Bank Transfer', 'Miscellaneous'],
  };

  const txns = [];
  for (let i = 60; i >= 0; i--) {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const desc = descriptions[cat][Math.floor(Math.random() * descriptions[cat].length)];
    const isIncome = cat === 'SALARY';
    txns.push({
      accountId: aliceChecking.id,
      senderId: isIncome ? bob.id : alice.id,
      receiverId: isIncome ? alice.id : null,
      amount: isIncome ? Math.random() * 3000 + 2000 : Math.random() * 200 + 5,
      type: isIncome ? 'DEPOSIT' : 'PAYMENT',
      category: cat,
      description: desc,
      status: 'COMPLETED',
      reference: randomRef(),
      createdAt: daysAgo(i),
    });
  }

  // Alice→Bob transfers
  for (let i = 0; i < 5; i++) {
    txns.push({
      accountId: aliceChecking.id,
      senderId: alice.id,
      receiverId: bob.id,
      amount: Math.random() * 500 + 50,
      type: 'TRANSFER',
      category: 'OTHER',
      description: `Transfer to Bob #${i + 1}`,
      status: 'COMPLETED',
      reference: randomRef(),
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
    });
  }

  await prisma.transaction.createMany({ data: txns });

  // Bob transactions
  const bobTxns = [];
  for (let i = 30; i >= 0; i--) {
    const cat = categories[Math.floor(Math.random() * (categories.length - 1))];
    const desc = descriptions[cat][Math.floor(Math.random() * descriptions[cat].length)];
    bobTxns.push({
      accountId: bobChecking.id,
      senderId: bob.id,
      amount: Math.random() * 150 + 10,
      type: 'PAYMENT',
      category: cat,
      description: desc,
      status: 'COMPLETED',
      reference: randomRef(),
      createdAt: daysAgo(i),
    });
  }
  await prisma.transaction.createMany({ data: bobTxns });

  // --- CARDS ---
  await prisma.card.createMany({
    data: [
      { userId: alice.id, cardNumber: generateCardNumber(), expiry: generateExpiry(), cvv: generateCVV(), cardType: 'VISA', status: 'ACTIVE' },
      { userId: alice.id, cardNumber: generateCardNumber(), expiry: generateExpiry(), cvv: generateCVV(), cardType: 'MASTERCARD', status: 'ACTIVE' },
      { userId: bob.id, cardNumber: generateCardNumber(), expiry: generateExpiry(), cvv: generateCVV(), cardType: 'VISA', status: 'ACTIVE' },
      { userId: carol.id, cardNumber: generateCardNumber(), expiry: generateExpiry(), cvv: generateCVV(), cardType: 'MASTERCARD', status: 'FROZEN' },
      { userId: david.id, cardNumber: generateCardNumber(), expiry: generateExpiry(), cvv: generateCVV(), cardType: 'VISA', status: 'CANCELLED' },
    ],
  });

  // --- LOANS ---
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await prisma.loan.createMany({
    data: [
      { userId: alice.id, amount: 10000, interestRate: 7.5, duration: 24, purpose: 'Home Renovation', employment: 'Full-time', income: 75000, status: 'APPROVED' },
      { userId: bob.id, amount: 5000, interestRate: 9.0, duration: 12, purpose: 'Car Repair', employment: 'Full-time', income: 45000, status: 'PENDING' },
      { userId: carol.id, amount: 25000, interestRate: 6.5, duration: 36, purpose: 'Business Expansion', employment: 'Self-employed', income: 120000, status: 'ACTIVE' },
      { userId: david.id, amount: 2000, interestRate: 11.0, duration: 6, purpose: 'Medical Emergency', employment: 'Part-time', income: 25000, status: 'REJECTED', notes: 'Credit score too low' },
    ],
  });

  // --- BUDGETS ---
  await prisma.budget.createMany({
    data: [
      { userId: alice.id, category: 'FOOD', limit: 600, spent: 420, month: currentMonth, year: currentYear },
      { userId: alice.id, category: 'SHOPPING', limit: 500, spent: 310, month: currentMonth, year: currentYear },
      { userId: alice.id, category: 'BILLS', limit: 1200, spent: 980, month: currentMonth, year: currentYear },
      { userId: alice.id, category: 'TRAVEL', limit: 400, spent: 125, month: currentMonth, year: currentYear },
      { userId: alice.id, category: 'ENTERTAINMENT', limit: 200, spent: 189, month: currentMonth, year: currentYear },
      { userId: alice.id, category: 'HEALTHCARE', limit: 300, spent: 80, month: currentMonth, year: currentYear },
      { userId: bob.id, category: 'FOOD', limit: 400, spent: 220, month: currentMonth, year: currentYear },
      { userId: bob.id, category: 'SHOPPING', limit: 300, spent: 290, month: currentMonth, year: currentYear },
      { userId: bob.id, category: 'ENTERTAINMENT', limit: 150, spent: 145, month: currentMonth, year: currentYear },
    ],
  });

  // --- NOTIFICATIONS ---
  await prisma.notification.createMany({
    data: [
      { userId: alice.id, title: 'Welcome to NeoBank!', message: 'Your account is ready. Start exploring your dashboard.', type: 'SUCCESS', read: true },
      { userId: alice.id, title: 'Transfer Successful', message: 'You sent $250.00 to Bob Smith.', type: 'SUCCESS', read: false },
      { userId: alice.id, title: 'Budget Alert', message: "You've used 94% of your Entertainment budget.", type: 'WARNING', read: false },
      { userId: alice.id, title: 'Loan Approved', message: 'Your loan of $10,000 has been approved!', type: 'SUCCESS', read: false },
      { userId: alice.id, title: 'Security Alert', message: 'New login detected from Chrome on Windows.', type: 'INFO', read: true },
      { userId: bob.id, title: 'Welcome to NeoBank!', message: 'Your account is ready.', type: 'SUCCESS', read: true },
      { userId: bob.id, title: 'Money Received', message: 'You received $250.00 from Alice Johnson.', type: 'SUCCESS', read: false },
      { userId: bob.id, title: 'Loan Application', message: 'Your loan application is under review.', type: 'INFO', read: true },
    ],
  });

  // --- SETTINGS ---
  for (const user of [alice, bob, carol, david, admin]) {
    await prisma.settings.create({
      data: {
        userId: user.id,
        theme: 'dark',
        language: 'en',
        currency: 'USD',
        emailNotifications: true,
        pushNotifications: true,
        transferAlerts: true,
        loginAlerts: true,
      },
    });
  }

  // --- REWARD POINTS ---
  await prisma.rewardPoints.createMany({
    data: [
      { userId: alice.id, points: 2450, totalEarned: 3200, totalRedeemed: 750, tier: 'GOLD' },
      { userId: bob.id, points: 680, totalEarned: 900, totalRedeemed: 220, tier: 'SILVER' },
      { userId: carol.id, points: 5100, totalEarned: 5600, totalRedeemed: 500, tier: 'PLATINUM' },
      { userId: david.id, points: 120, totalEarned: 120, totalRedeemed: 0, tier: 'BRONZE' },
    ],
  });

  // --- GOALS ---
  await prisma.goal.createMany({
    data: [
      { userId: alice.id, name: 'Dream Vacation', targetAmount: 5000, savedAmount: 2200, deadline: new Date('2025-12-31'), category: 'TRAVEL' },
      { userId: alice.id, name: 'Emergency Fund', targetAmount: 10000, savedAmount: 8500, category: 'OTHER' },
      { userId: alice.id, name: 'New MacBook', targetAmount: 2500, savedAmount: 1800, category: 'SHOPPING' },
      { userId: bob.id, name: 'Down Payment', targetAmount: 20000, savedAmount: 3500, category: 'OTHER' },
    ],
  });

  // --- SCHEDULED TRANSFERS ---
  await prisma.scheduledTransfer.createMany({
    data: [
      { userId: alice.id, toEmail: 'bob@example.com', amount: 200, category: 'BILLS', description: 'Monthly rent split', frequency: 'MONTHLY', nextRunAt: new Date('2025-02-01'), status: 'ACTIVE' },
      { userId: alice.id, toEmail: 'carol@example.com', amount: 50, category: 'ENTERTAINMENT', description: 'Netflix split', frequency: 'MONTHLY', nextRunAt: new Date('2025-02-01'), status: 'ACTIVE' },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('📧 Login credentials:');
  console.log('   Admin: admin@neobank.com / Password123!');
  console.log('   Alice: alice@example.com / Password123!');
  console.log('   Bob:   bob@example.com / Password123!');
  console.log('   Carol: carol@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
