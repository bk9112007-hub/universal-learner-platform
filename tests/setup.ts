import { afterEach, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: ((callback: (...args: any[]) => unknown) => callback) as typeof import("next/cache").unstable_cache
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
