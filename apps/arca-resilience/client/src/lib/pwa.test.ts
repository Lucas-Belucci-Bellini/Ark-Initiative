import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerArcaServiceWorker } from "./pwa";

describe("ARCA PWA", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registra o worker local depois do carregamento da página", async () => {
    const register = vi.fn(() => Promise.resolve({}));
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register } });
    registerArcaServiceWorker();
    window.dispatchEvent(new Event("load"));
    await Promise.resolve();

    expect(register).toHaveBeenCalledWith("/sw.js");
  });

  it("declara apenas cache público para o pacote operacional e uma rota de fallback", () => {
    const worker = readFileSync(resolve(process.cwd(), "client/public/sw.js"), "utf8");
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "client/public/manifest.webmanifest"), "utf8"));

    expect(worker).toContain('url.pathname === "/api/trpc/operational.overview"');
    expect(worker).toContain('caches.match("/operacoes")');
    expect(worker).not.toContain("assistant.");
    expect(worker).not.toContain("administration.");
    expect(manifest.start_url).toBe("/operacoes");
    expect(manifest.display).toBe("standalone");
  });

  it("devolve o pacote operacional já cacheado quando a rede falha e ignora rota administrativa", async () => {
    const worker = readFileSync(resolve(process.cwd(), "client/public/sw.js"), "utf8");
    const listeners = new Map<string, (event: { request: { method: string; url: string; mode?: string }; respondWith: (value: Promise<unknown>) => void }) => void>();
    const cachedPacket = { cached: true };
    const match = vi.fn(() => Promise.resolve(cachedPacket));
    const fetch = vi.fn(() => Promise.reject(new Error("offline")));
    const context = {
      URL,
      Response,
      Promise,
      JSON,
      caches: { match, open: vi.fn() },
      fetch,
      self: {
        location: { origin: "https://arca.test" },
        addEventListener: (type: string, callback: (event: { request: { method: string; url: string; mode?: string }; respondWith: (value: Promise<unknown>) => void }) => void) => listeners.set(type, callback),
        skipWaiting: vi.fn(),
        clients: { claim: vi.fn() },
      },
    };
    vm.runInNewContext(worker, context);

    const fetchHandler = listeners.get("fetch");
    expect(fetchHandler).toBeTruthy();
    const publicRequest = { method: "GET", url: "https://arca.test/api/trpc/operational.overview?batch=1&input=%7B%7D", mode: "cors" };
    let responsePromise: Promise<unknown> | undefined;
    fetchHandler?.({ request: publicRequest, respondWith: value => { responsePromise = value; } });
    await expect(responsePromise).resolves.toBe(cachedPacket);
    expect(match).toHaveBeenCalledWith(publicRequest);

    const privateRequest = { method: "GET", url: "https://arca.test/api/trpc/administration.safetyBoard?batch=1&input=%7B%7D", mode: "cors" };
    const privateRespondWith = vi.fn();
    fetchHandler?.({ request: privateRequest, respondWith: privateRespondWith });
    expect(privateRespondWith).not.toHaveBeenCalled();
  });
});
