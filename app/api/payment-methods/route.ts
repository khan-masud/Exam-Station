import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET - Fetch available payment methods from admin settings
export async function GET(req: NextRequest) {
  try {
    // Fetch payment settings from database
    const settings = await query(
      `SELECT setting_key, setting_value FROM admin_settings 
       WHERE setting_key LIKE 'payments.%'`
    ) as any[]

    // Convert to object
    const settingsObj: Record<string, any> = {}
    for (const setting of settings) {
      try {
        settingsObj[setting.setting_key.replace('payments.', '')] = JSON.parse(setting.setting_value)
      } catch {
        settingsObj[setting.setting_key.replace('payments.', '')] = setting.setting_value
      }
    }

    // Check if manual payments are enabled
    if (!settingsObj.manualPaymentEnabled && !settingsObj.allowManualPayments) {
      return NextResponse.json({ 
        methods: [],
        message: 'Manual payments are currently disabled' 
      })
    }

    // Build payment methods array based on enabled options
    const methods = []

    // Cash Payment
    if (settingsObj.allowCash) {
      methods.push({
        id: 'cash',
        name: 'Cash Payment',
        instructions: settingsObj.cashPaymentInstructions || 'Please visit our office during business hours to make cash payments.',
        details: null
      })
    }

    // Bank Transfer
    if (settingsObj.allowBankTransfer) {
      const bankDetails = {
        bankName: settingsObj.bankName || '',
        accountName: settingsObj.bankAccountName || '',
        accountNumber: settingsObj.bankAccountNumber || '',
        routingNumber: settingsObj.bankRoutingNumber || '',
        swiftCode: settingsObj.bankSwiftCode || '',
        branch: settingsObj.bankBranch || ''
      }

      const hasDetails = Object.values(bankDetails).some(v => v !== '')
      
      let instructions = 'Bank Transfer Details:\n'
      if (bankDetails.bankName) instructions += `Bank: ${bankDetails.bankName}\n`
      if (bankDetails.branch) instructions += `Branch: ${bankDetails.branch}\n`
      if (bankDetails.accountName) instructions += `Account Name: ${bankDetails.accountName}\n`
      if (bankDetails.accountNumber) instructions += `Account Number: ${bankDetails.accountNumber}\n`
      if (bankDetails.routingNumber) instructions += `Routing Number: ${bankDetails.routingNumber}\n`
      if (bankDetails.swiftCode) instructions += `SWIFT Code: ${bankDetails.swiftCode}`

      methods.push({
        id: 'bank_transfer',
        name: 'Bank Transfer',
        instructions: hasDetails ? instructions.trim() : 'Please contact administration for bank details.',
        details: bankDetails
      })
    }

    // Mobile Money
    if (settingsObj.allowMobileMoney) {
      const mobileDetails = {
        provider: settingsObj.mobileMoneyProvider || '',
        number: settingsObj.mobileMoneyNumber || '',
        accountName: settingsObj.mobileMoneyAccountName || ''
      }

      const hasDetails = Object.values(mobileDetails).some(v => v !== '')
      
      let instructions = 'Mobile Money Details:\n'
      if (mobileDetails.provider) instructions += `Provider: ${mobileDetails.provider}\n`
      if (mobileDetails.number) instructions += `Number: ${mobileDetails.number}\n`
      if (mobileDetails.accountName) instructions += `Account Name: ${mobileDetails.accountName}`

      methods.push({
        id: 'mobile_money',
        name: 'Mobile Money',
        instructions: hasDetails ? instructions.trim() : 'Please contact administration for mobile money details.',
        details: mobileDetails
      })
    }

    // Cheque
    if (settingsObj.allowCheque) {
      methods.push({
        id: 'cheque',
        name: 'Cheque Payment',
        instructions: 'Make cheque payable to the organization. Contact administration for mailing address.',
        details: null
      })
    }

    // Other
    if (settingsObj.allowOther) {
      methods.push({
        id: 'other',
        name: 'Other Payment Method',
        instructions: 'Please contact administration for alternative payment arrangements.',
        details: null
      })
    }

    // Add currency and other settings
    const paymentConfig = {
      currency: settingsObj.paymentCurrency || 'USD',
      requirePaymentProof: settingsObj.requirePaymentProof !== false,
      autoApprove: settingsObj.autoApprovePayments === true
    }

    return NextResponse.json({ 
      methods,
      config: paymentConfig
    })
  } catch (error) {
    console.error('Fetch payment methods error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch payment methods',
      methods: []
    }, { status: 500 })
  }
}
