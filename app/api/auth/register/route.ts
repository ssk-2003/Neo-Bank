import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signAccessToken, signRefreshToken, setAuthCookies } from '@/lib/auth'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12)

    // Generate referral code
    const referralCode = data.firstName.toUpperCase().slice(0, 4) + Math.random().toString(36).slice(2, 6).toUpperCase()

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        referralCode,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    })

    // Create default checking account
    const accountNumber = Math.random().toString().slice(2, 12).padStart(10, '0')
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber,
        type: 'CHECKING',
        balance: 1000, // Welcome bonus
        currency: 'USD',
        status: 'ACTIVE',
      },
    })

    // Create default settings
    await prisma.settings.create({
      data: { userId: user.id },
    })

    // Create reward points record
    await prisma.rewardPoints.create({
      data: { userId: user.id, points: 100, totalEarned: 100 },
    })

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to NeoBank! 🎉',
        message: 'Your account is ready. We\'ve added a $1,000 welcome bonus to your checking account!',
        type: 'SUCCESS',
      },
    })

    // Generate tokens
    const tokenPayload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(tokenPayload)
    const refreshToken = signRefreshToken(tokenPayload)

    const response = NextResponse.json({ user, accessToken, message: 'Account created successfully' }, { status: 201 })
    return setAuthCookies(response, accessToken, refreshToken)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
