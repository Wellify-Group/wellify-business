import { NextRequest, NextResponse } from 'next/server';
import { saveUser } from '@/lib/db';
import { User } from '@/lib/store';

export const runtime = 'nodejs';

/**
 * POST /api/user/create
 * Create a new user (employee or manager)
 * 
 * Body: { name, pin?, email?, password?, role, businessId, assignedPointId?, jobTitle?, fullName?, phone?, dob?, address? }
 * 
 * For employees: pin is required
 * For managers: email and password are required
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pin, email, password, role, businessId, assignedPointId, jobTitle, fullName, phone, dob, address } = body;

    // Validation
    if (!name || !role || !businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, role, businessId' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['employee', 'manager'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be employee or manager' },
        { status: 400 }
      );
    }

    // Role-specific validation
    if (role === 'employee') {
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return NextResponse.json(
          { success: false, error: 'PIN must be exactly 4 digits for employees' },
          { status: 400 }
        );
      }
    } else if (role === 'manager') {
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required for managers' },
          { status: 400 }
        );
      }
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Generate unique ID
    const userId = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Create new user object
    const newUser: User = {
      id: userId,
      name: name.trim(),
      fullName: fullName?.trim() || name.trim(),
      role: role as 'employee' | 'manager',
      businessId: businessId,
      assignedPointId: assignedPointId || null,
      status: 'active',
      ...(role === 'employee' && { pin: pin }),
      ...(role === 'manager' && { email: email.toLowerCase().trim(), password: password }),
      ...(email && role === 'employee' && { email: email.toLowerCase().trim() }), // Optional email for employees
      ...(jobTitle && { jobTitle }),
      ...(phone && { phone }),
      ...(dob && { dob }),
      ...(address && { address }),
    };

    // Save user to file system
    await saveUser(newUser);

    // Return user data (without sensitive info)
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

