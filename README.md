# NeoBank - Premium Digital Banking Platform

NeoBank is a high-fidelity, full-stack digital banking simulator built with Next.js (App Router), React, TypeScript, Tailwind CSS, and Prisma with SQLite. 

Designed with a premium dark mode UI inspired by modern fintech leaders like Revolut and Nubank, it provides a feature-rich, interactive workspace for virtual financial management.

🔗 **Repository Link**: [https://github.com/ssk-2003/Neo-Bank.git](https://github.com/ssk-2003/Neo-Bank.git)

> ⚠️ **Disclaimer**: This is a portfolio simulation project. It **does not** handle real money, connect to any real-world banking network, or process actual credit card details. All balances, cards, loans, and transfers are simulated for demonstration purposes.

---

## 🌟 Key Features

1. **Multi-Account Dashboard**: Create checking, savings, business, or investment accounts (all starting at `$0.00`) and use the **Add Funds** feature to inject demo money.
2. **Transfer Center**: Transfer virtual funds to other NeoBank users via email with real-time balance checks, reference codes, and instant transaction receipts.
3. **Expense Tracker**: Log custom expenses, categorize them (Food, Bills, Shopping, Travel, etc.), add notes, and monitor monthly proportions.
4. **Virtual Cards**: Instantly issue virtual VISA cards with dynamic card numbers, expiry dates, CVVs, and toggle the "Freeze/Unfreeze" security overlay.
5. **Loan Center**: Access a client-facing loan simulator with EMI sliders, submit loan requests for admin review, and view loan schedules.
6. **Smart Budgeting**: Set budget limits for different transaction categories and watch progress bars fill as you spend.
7. **AI Assistant**: A conversational financial chatbot that aggregates actual account balances, parses budgets, and summarizes transaction history.
8. **Interactive Analytics**: Rich charts mapping monthly cashflow trends and category-based spending distributions.
9. **Admin Console**: Administrators can view core platform metrics, browse/filter users, freeze/activate accounts, and review/approve pending loan applications.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS, Framer Motion, Recharts
- **State & Form Management**: Zustand, React Hook Form, Zod
- **Database & Auth**: Prisma (SQLite driver), JWT sessions, BCrypt hashing

---

## 🚀 Getting Started

Follow these steps to set up and run NeoBank locally:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v18+) installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/neobank.git
cd neobank
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```
Ensure it contains the default configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="neobank-super-secret-jwt-key-change-in-production-2024"
JWT_REFRESH_SECRET="neobank-refresh-secret-key-change-in-production-2024"
```

### 4. Database Migration & Seed
Run Prisma migrations to set up the SQLite database and seed the system with demo client and admin credentials:
```bash
npx prisma db push
```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

To test the application, log in with one of the following accounts:

### 👤 Customer Persona (Alice)
- **Email**: `alice@example.com`
- **Password**: `Password123!`

### 🛡️ Admin Persona
- **Email**: `admin@neobank.com`
- **Password**: `Password123!`
