# Frontend INAT

Portal público e sistema interno em Next.js 16, integrado ao backend Spring Boot por um BFF do próprio Next.js.

## Desenvolvimento

Copie as variáveis descritas em [frontend-web-nextjs.md](./frontend-web-nextjs.md) e execute:

```bash
npm install
npm run dev
```

O portal abre em `http://localhost:3000` e espera o backend em `BACKEND_URL`.

## Verificações

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Não há fixtures nem bootstrap no frontend. Uma base sem registros produz estados vazios reais. A criação de contas ocorre somente pelo cadastro público (`/criar-conta`); o frontend não consome `POST /api/users`.

Consulte [frontend-web-nextjs.md](./frontend-web-nextjs.md) para autenticação, papéis, recursos integrados, uploads multipart e configuração do ambiente.
