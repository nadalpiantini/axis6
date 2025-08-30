/**
 * CSP violation reporting endpoint
 * Receives and processes Content Security Policy violations
 */

import { NextRequest, NextResponse } from 'next/server'

import { handleCSPViolation, type CSPViolation } from '@/lib/security/csp-hash'
import { logger } from '@/lib/utils/logger'

export async function POST(_request: NextRequest) {
  try {
    const violation: { 'csp-report': CSPViolation } = await _request.json()

    if (!violation['csp-report']) {
      return NextResponse.json({ error: 'Invalid CSP report format' }, { status: 400 })
    }

    const report = violation['csp-report']

    // Log the violation
    logger.warn('CSP Violation Reported', {
      directive: report['violated-directive'],
      blockedUri: report['blocked-uri'],
      documentUri: report['document-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      sample: report['script-sample']?.substring(0, 100),
    })

    // Handle the violation (send to monitoring, etc.)
    handleCSPViolation(report)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    logger.error('Failed to process CSP report', error as Error)
    return NextResponse.json({ error: 'Failed to process report' }, { status: 500 })
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
