import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const config = JSON.parse(readFileSync(resolve(root, "src-tauri/tauri.conf.json"), "utf8"));
const cargo = readFileSync(resolve(root, "src-tauri/Cargo.toml"), "utf8");
const clientEntry = readFileSync(resolve(root, "client/src/main.tsx"), "utf8");

describe("ARCA Tauri desktop scaffold", () => {
  it("declara identidade, versão e uma janela operacional compatíveis com o desktop", () => {
    expect(config.identifier).toBe("im.arkinitiative.arca");
    expect(config.version).toBe("0.2.0");
    expect(config.build.frontendDist).toBe("../dist/public");
    expect(config.app.windows[0]).toEqual(expect.objectContaining({ minWidth: 980, minHeight: 640 }));
  });

  it("mantém o runtime limitado a permissões básicas e metadados do projeto", () => {
    expect(cargo).toContain('name = "arca_desktop"');
    expect(cargo).toContain('repository = "https://github.com/Lucas-Belucci-Bellini/Ark-Initiative"');
    const capabilities = JSON.parse(readFileSync(resolve(root, "src-tauri/capabilities/default.json"), "utf8"));
    expect(capabilities.permissions).toEqual(["core:default"]);
  });

  it("permite configurar uma origem HTTPS da API para a build desktop sem embutir credenciais", () => {
    expect(clientEntry).toContain("VITE_ARCA_API_ORIGIN");
    expect(clientEntry).toContain("configuredApiOrigin ? `${configuredApiOrigin}/api/trpc` : \"/api/trpc\"");
    expect(clientEntry).toContain('credentials: isCrossOriginDesktopApi ? "omit" : "include"');
  });
});
