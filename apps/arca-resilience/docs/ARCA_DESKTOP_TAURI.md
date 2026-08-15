# ARCA Desktop — preparação Tauri v2

## Propósito

O diretório `src-tauri/` empacota a interface React/Vite do ARCA em um cliente desktop. Nesta etapa, o desktop prioriza o **painel operacional público**, a leitura de pacotes em cache e a validação local Rust/WebAssembly. Ele não cria um novo banco local, não armazena conversas privadas e não habilita despacho externo.

> O aplicativo empacotado precisa apontar para uma origem HTTPS confiável do backend ARCA para atualizar dados públicos. Não inclua segredos, chaves privadas ou cookies de sessão no bundle.

## Comandos

| Objetivo | Comando |
|---|---|
| Desenvolvimento desktop | `pnpm desktop:dev` |
| Build desktop padrão | `pnpm desktop:build` |
| Pacotes Linux | `pnpm desktop:build:linux` |
| Verificar tipos da interface | `pnpm check` |

O modo de desenvolvimento abre `http://localhost:3000` e inicia o comando `pnpm dev`. O build incorpora `dist/public` dentro do aplicativo desktop, conforme a configuração Tauri v2.[1]

## Origem de API para distribuição

Antes de gerar um instalador distribuível, defina a origem pública do ARCA no ambiente de build, por exemplo `VITE_ARCA_API_ORIGIN=https://seu-dominio-exemplo`. O servidor só retorna cabeçalhos CORS para `tauri://localhost`, `http://tauri.localhost`, origens HTTPS explicitamente declaradas em `ARCA_DESKTOP_CORS_ORIGINS` ou localhost durante desenvolvimento. O tráfego desktop entre origens nunca encaminha o cookie OAuth do site.

> A release desktop atual fica restrita à experiência operacional pública quando consulta uma API remota. O OAuth Manus existente continua protegido na origem web com nonce de uso único. Não habilite procedimentos desktop autenticados até aprovar e testar um callback nativo por deep link e registrar o respectivo redirecionamento OAuth; o cliente falha fechado, sem reutilizar silenciosamente uma sessão do navegador.

## Segurança e releases

O identificador de pacote é `im.arkinitiative.arca`, as permissões nativas permanecem somente em `core:default`, e o desktop não solicita acesso ao sistema de arquivos, shell ou rede nativa adicional. Cada release desktop deve registrar plataforma, arquitetura, checksum do instalador, URL de origem da API e resultado de `pnpm test`, `pnpm check` e `pnpm desktop:build`.

## Próximo marco

Na release 0.2.0, registrar os redirecionamentos OAuth para desktop, testar os instaladores por sistema operacional e publicar artefatos assinados somente depois de validar a origem de API e a política de atualização.

## Referências

[1] [Tauri v2 — integração com Vite](https://v2.tauri.app/start/frontend/vite/)
