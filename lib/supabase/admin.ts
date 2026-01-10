// Temporary stub for Supabase Admin - migration in progress
// TODO: Replace all usages with new backend API

export function createAdminSupabaseClient() {
  return {
    auth: {
      admin: {
        listUsers: async () => ({ users: [], error: null }),
        updateUserById: async () => ({ data: null, error: null }),
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), maybeSingle: async () => ({ data: null, error: null }), order: () => ({ limit: async () => ({ data: null, error: null }) }) }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
      insert: async () => ({ error: null }),
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  } as any;
}
