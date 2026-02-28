import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection
    const customerCount = await prisma.customer.count()
    const productCount = await prisma.product.count()
    const transactionCount = await prisma.transaction.count()
    const alertCount = await prisma.alert.count()

    return NextResponse.json({
      success: true,
      connected: true,
      data: {
        customers: customerCount,
        products: productCount,
        transactions: transactionCount,
        alerts: alertCount,
      },
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
