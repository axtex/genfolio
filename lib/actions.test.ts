import { beforeEach, describe, expect, it, vi } from "vitest";
import { refreshPortfolio } from "@/lib/actions";
import { auth } from "@/auth";
import { revalidatePath, updateTag } from "next/cache";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

const authMock = vi.mocked(auth);
const updateTagMock = vi.mocked(updateTag);
const revalidatePathMock = vi.mocked(revalidatePath);

describe("refreshPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when there is no session", async () => {
    authMock.mockResolvedValue(null as never);
    await expect(refreshPortfolio("alice")).rejects.toThrow("Unauthorized");
    expect(updateTagMock).not.toHaveBeenCalled();
  });

  it("throws when the session login does not match", async () => {
    authMock.mockResolvedValue({ user: { login: "bob" } } as never);
    await expect(refreshPortfolio("alice")).rejects.toThrow("Unauthorized");
    expect(updateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("busts the username tag and paths when the owner refreshes", async () => {
    authMock.mockResolvedValue({ user: { login: "alice" } } as never);
    await refreshPortfolio("alice");
    expect(updateTagMock).toHaveBeenCalledWith("alice");
    expect(revalidatePathMock).toHaveBeenCalledWith("/alice");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });
});
