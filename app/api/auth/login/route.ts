import { NextRequest, NextResponse } from 'next/server';
import { findUserByCredentials, findUserByEmail } from '@/lib/db';
import { Role } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * Login user with credentials
 * 
 * Body: { role, identifier, password }
 * - For director/manager: identifier is email, password is password
 * - For employee: identifier can be email or company code, password is PIN
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, identifier, password, businessId } = body;

    // Debug: Log the login attempt
    console.log('[Login API] Login Attempt:', { 
      role, 
      identifier: identifier ? `"${identifier}"` : 'missing',
      password: password ? `"${password}"` : 'missing',
      passwordLength: password ? password.length : 0,
      businessId 
    });

    // Validation
    if (!role || !identifier || !password) {
      console.log('[Login API] Validation failed:', { 
        hasRole: !!role, 
        hasIdentifier: !!identifier, 
        hasPassword: !!password 
      });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let user = null;

    // Universal login using findUserByCredentials with Deep Content Scan
    // For director/manager: identifier is email/phone, password is password
    // For employee: identifier is businessId (company code), password is PIN
    if (role === 'director' || role === 'manager') {
      // For director/manager: identifier can be email or phone
      const normalizedIdentifier = identifier.toLowerCase().trim();
      console.log('[Login API] Searching for director/manager:', { 
        role, 
        originalIdentifier: identifier,
        normalizedIdentifier,
        passwordType: typeof password,
        passwordValue: password
      });
      user = await findUserByCredentials(role, normalizedIdentifier, String(password));
    } 
    else if (role === 'employee') {
      // For employee: identifier is businessId (company code), password is PIN
      // Use businessId as identifier if provided, otherwise use identifier from body
      const companyCode = businessId || identifier;
      console.log('[Login API] Searching for employee:', { 
        role, 
        companyCode,
        passwordType: typeof password,
        passwordValue: password
      });
      user = await findUserByCredentials(role, companyCode, String(password));
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'error_invalid_credentials' },
        { status: 401 }
      );
    }

    // Remove password from response (keep PIN for employees as it's needed)
    const { password: userPassword, ...userWithoutPassword } = user;
    const safeUser = {
      ...userWithoutPassword,
      // Don't expose password in response, but PIN is okay for employees
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

