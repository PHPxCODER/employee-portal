import { NextRequest, NextResponse } from 'next/server'
import * as ldap from 'ldapjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required'
      }, { status: 400 })
    }

    // Get LDAP configuration from environment
    const ldapUrl = process.env.LDAP_URI || process.env.LDAP_URL
    const domain = process.env.AD_DOMAIN || 'company.com'

    if (!ldapUrl) {
      return NextResponse.json({
        success: false,
        error: 'LDAP_URI not configured in environment variables'
      }, { status: 500 })
    }

    console.log(`Testing LDAP connection to: ${ldapUrl}`)
    console.log(`Using domain: ${domain}`)

    // Create LDAP client
    const client = ldap.createClient({
      url: ldapUrl,
      timeout: 10000,
      connectTimeout: 10000,
    })

    // Prepare bind DN
    let bindDN = username
    
    // Convert username to UPN format if needed
    if (!bindDN.includes('@') && !bindDN.includes('\\') && !bindDN.includes('=')) {
      bindDN = `${username}@${domain}`
    }

    console.log(`Attempting to bind with DN: ${bindDN}`)

    // Test the connection
    const result = await new Promise<{
      success: boolean
      user?: {
        username: string
        email: string
        name: string
      }
      details?: {
        ldapUrl: string
        bindDN: string
        domain: string
      }
      error?: string
      errorCode?: string
      errorName?: string
    }>((resolve) => {
      client.bind(bindDN, password, (error: Error | null) => {
        if (error) {
          console.error('LDAP bind error:', error)
          client.unbind()
          resolve({
            success: false,
            error: `LDAP bind failed: ${error.message}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            errorCode: (error as any).code,
            errorName: error.name
          })
        } else {
          console.log('LDAP bind successful!')
          client.unbind()
          resolve({
            success: true,
            user: {
              username: username,
              email: bindDN.includes('@') ? bindDN : `${username}@${domain}`,
              name: username
            },
            details: {
              ldapUrl: ldapUrl,
              bindDN: bindDN,
              domain: domain
            }
          })
        }
      })
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Test LDAP error:', error)
    return NextResponse.json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}