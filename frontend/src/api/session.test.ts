import { vi } from "vitest";
import axios from "axios";
import { accessExpired, readTokens, writeTokens } from "./session";
import { refreshAccess } from "./axiosInstance";
function token(exp: number) {
  return `e30.${btoa(JSON.stringify({ exp }))}.signature`;
}
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
test("invalid, malformed and expired stored sessions do not crash startup", () => {
  localStorage.setItem("authTokens", "{broken");
  expect(readTokens()).toBeNull();
  writeTokens({ access: "broken", refresh: token(Date.now() / 1000 + 100) });
  expect(readTokens()).toBeNull();
  writeTokens({ access: token(1), refresh: token(1) });
  expect(readTokens()).toBeNull();
});
test("expired access token preserves a usable refresh session", () => {
  writeTokens({ access: token(1), refresh: token(Date.now() / 1000 + 100) });
  expect(readTokens()).not.toBeNull();
  expect(accessExpired(readTokens()!.access)).toBe(true);
});
test("concurrent requests share one refresh and preserve the refresh token", async () => {
  const refresh = token(Date.now() / 1000 + 100);
  writeTokens({ access: token(1), refresh });
  const access = token(Date.now() / 1000 + 60);
  const post = vi
    .spyOn(axios, "post")
    .mockResolvedValueOnce({ data: { access } });
  expect(
    await Promise.all([refreshAccess(), refreshAccess(), refreshAccess()]),
  ).toEqual([access, access, access]);
  expect(post).toHaveBeenCalledTimes(1);
  expect(readTokens()?.refresh).toBe(refresh);
});
test("rejected refresh clears session; transient errors preserve it", async () => {
  const tokens = { access: token(1), refresh: token(Date.now() / 1000 + 100) };
  writeTokens(tokens);
  vi.spyOn(axios, "post").mockRejectedValueOnce({ response: { status: 401 } });
  await expect(refreshAccess()).rejects.toBeDefined();
  expect(readTokens()).toBeNull();
  writeTokens(tokens);
  vi.mocked(axios.post).mockRejectedValueOnce(new Error("offline"));
  await expect(refreshAccess()).rejects.toBeDefined();
  expect(readTokens()).not.toBeNull();
});

test("logout during an in-flight refresh cannot restore the session", async () => {
  writeTokens({ access: token(1), refresh: token(Date.now() / 1000 + 100) });
  let resolve!: (value: { data: { access: string } }) => void;
  vi.spyOn(axios, "post").mockReturnValueOnce(
    new Promise((r) => {
      resolve = r;
    }),
  );
  const pending = refreshAccess();
  writeTokens(null);
  resolve({ data: { access: token(Date.now() / 1000 + 60) } });
  await expect(pending).rejects.toThrow("Sesión finalizada");
  expect(readTokens()).toBeNull();
});
