describe("frontend/lib/api", () => {
  const ENV_KEY = "NEXT_PUBLIC_API_URL"

  const originalEnv = process.env[ENV_KEY]
  const originalFetch = (globalThis as any).fetch

  afterEach(() => {
    process.env[ENV_KEY] = originalEnv
    ;(globalThis as any).fetch = originalFetch
    jest.resetModules()
  })

  it("uses /api when NEXT_PUBLIC_API_URL is absolute", () => {
    process.env[ENV_KEY] = "https://example.com/api"
    jest.resetModules()
    const { apiBase } = require("@/lib/api")
    expect(apiBase).toBe("/api")
  })

  it("uses relative NEXT_PUBLIC_API_URL when it starts with /", () => {
    process.env[ENV_KEY] = "/api"
    jest.resetModules()
    const { apiBase } = require("@/lib/api")
    expect(apiBase).toBe("/api")
  })

  it("authFetch prefixes apiBase and includes credentials", async () => {
    process.env[ENV_KEY] = "/api"
    jest.resetModules()
    const { authFetch } = require("@/lib/api")

    const fetchMock = jest.fn(async () => ({ ok: true } as any))
    ;(globalThis as any).fetch = fetchMock

    await authFetch("/crm/stats", { method: "GET", headers: { "X-Test": "1" } })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/crm/stats",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Test": "1",
        }),
      })
    )
  })
})

