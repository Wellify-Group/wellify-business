import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();

    const exists =
      existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

    if (exists) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const generateCompanyCode = () => {
      const part = () => Math.floor(1000 + Math.random() * 9000);
      return `${part()}-${part()}-${part()}-${part()}`;
    };

    const companyCode = generateCompanyCode();
    const businessId = `biz-${Date.now()}`;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        fullName,
        role: 'director',
        businessId,
        companyCode,
      },
    });

    if (error) {
      console.error('Supabase createUser error:', error);
      return NextResponse.json(
        { success: false, error: 'Registration failed' },
        { status: 500 }
      );
    }

    const user = data.user;

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user?.id,
          email: user?.email,
          fullName,
          role: 'director',
          businessId,
          companyCode,
        },
        companyCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
