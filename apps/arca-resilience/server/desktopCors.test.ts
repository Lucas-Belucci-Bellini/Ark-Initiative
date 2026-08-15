import { describe, expect, it } from "vitest";
import { isDesktopCorsOriginAllowed } from "./_core/desktopCors";

describe("desktop CORS policy", () => {
  it("allows only the Tauri origins, explicit HTTPS origins and development localhost", () => {
    expect(isDesktopCorsOriginAllowed("tauri://localhost", "", false)).toBe(true);
    expect(isDesktopCorsOriginAllowed("http://tauri.localhost", "", false)).toBe(true);
    expect(isDesktopCorsOriginAllowed("https://desktop.arca.example", "https://desktop.arca.example", false)).toBe(true);
    expect(isDesktopCorsOriginAllowed("http://localhost:3000", "", true)).toBe(true);
  });

  it("rejects unknown origins and never treats wildcard configuration as permission", () => {
    expect(isDesktopCorsOriginAllowed("https://untrusted.example", "https://desktop.arca.example", false)).toBe(false);
    expect(isDesktopCorsOriginAllowed("https://untrusted.example", "*", false)).toBe(false);
    expect(isDesktopCorsOriginAllowed("null", "", false)).toBe(false);
  });
});
