import { afterEach, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
