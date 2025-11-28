import { NextRequest, NextResponse } from 'next/server';
import { saveUser, findUserByEmail } from '@/lib/db';
import { User } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/auth/register
 * Register a new director
 * 
 * Body: { email, password, fullName }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await findUserByEmail('director', email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate random 16-digit company code (4 blocks of 4)
    const generateCompanyCode = () => {
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const part3 = Math.floor(1000 + Math.random() * 9000);
      const part4 = Math.floor(1000 + Math.random() * 9000);
      return `${part1}-${part2}-${part3}-${part4}`;
    };

    const companyCode = generateCompanyCode();

    // Generate unique ID
    const userId = `dir-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const businessId = `${Date.now()}-biz`;

    // Create new user object
    const newUser: User = {
      id: userId,
      name: email.split('@')[0], // Use email prefix as default name
      fullName: fullName.trim(),
      role: 'director',
      email: email.toLowerCase().trim(),
      password: password, // Save password for authentication
      businessId: businessId,
      companyCode: companyCode, // Save company code to user object
      status: 'active',
      // Initialize empty arrays for shifts and locations
    };

    // Save user to file system
    await saveUser(newUser);

    // Return user data (without password for security)
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      companyCode: companyCode, // Return company code separately
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

