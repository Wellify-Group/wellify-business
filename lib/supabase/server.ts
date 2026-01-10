// Temporary stub for Supabase Server - migration in progress
// TODO: Replace all usages with new backend API

export async function createServerSupabaseClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Temporarily disabled' } }),
      signUp: async () => ({ data: null, error: { message: 'Temporarily disabled' } }),
      exchangeCodeForSession: async () => ({ data: null, error: { message: 'Temporarily disabled' } }),
      verifyOtp: async () => ({ data: null, error: { message: 'Temporarily disabled' } }),
      updateUser: async () => ({ data: null, error: { message: 'Temporarily disabled' } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), maybeSingle: async () => ({ data: null, error: null }) }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
    }),
  } as any;
}
