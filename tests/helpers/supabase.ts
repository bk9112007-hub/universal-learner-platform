import { vi } from "vitest";

type QueryConfig = {
  awaitResult?: any;
  singleResult?: any;
  maybeSingleResult?: any;
};

export function createQuery(config: QueryConfig = {}) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    not: vi.fn(() => query),
    is: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    update: vi.fn(() => query),
    insert: vi.fn(() => query),
    upsert: vi.fn(() => query),
    delete: vi.fn(() => query),
    single: vi.fn(async () => config.singleResult ?? config.awaitResult ?? { data: null, error: null }),
    maybeSingle: vi.fn(async () => config.maybeSingleResult ?? config.awaitResult ?? { data: null, error: null }),
    then: (resolve: (value: any) => void) => resolve(config.awaitResult ?? { data: null, error: null })
  };

  return query;
}

export function createSupabaseMock(tables: Record<string, any>) {
  return {
    from: vi.fn((table: string) => {
      const value = tables[table];
      if (!value) {
        throw new Error(`No mock configured for table ${table}`);
      }
      return typeof value === "function" ? value() : value;
    }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ data: { path: "mock-path" }, error: null }))
      }))
    },
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      exchangeCodeForSession: vi.fn(async () => ({ data: {}, error: null }))
    }
  } as any;
}
