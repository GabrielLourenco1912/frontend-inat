# Frontend INAT

Portal público e sistema interno em Next.js 16, integrado ao backend Spring Boot por um BFF do próprio Next.js.

## Desenvolvimento

Copie as variáveis descritas em [frontend-web-nextjs.md](./frontend-web-nextjs.md) e execute:

```bash
npm install
npm run dev
```

O portal abre em `http://localhost:3000`. A branch `develop` usa o backend em `BACKEND_URL`; `develop-mock` usa dados de demonstração para as telas do sistema. Ambas compartilham páginas, componentes, estilos e regras de apresentação idênticos.

## Verificações

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
npm run check:branches
```

Na `develop`, as fixtures não participam da execução: uma base sem registros produz estados vazios reais. Os arquivos de demonstração também estão disponíveis nessa branch para testes compartilhados. A criação de contas ocorre somente pelo cadastro público (`/criar-conta`); o frontend não consome `POST /api/users`.

Consulte [branch-workflow.md](./docs/branch-workflow.md) para sincronizar as branches sem substituir a integração real pelos mocks. A verificação compara os commits das duas referências locais; execute-a após concluir os commits e a sincronização.

Consulte [frontend-web-nextjs.md](./frontend-web-nextjs.md) para autenticação, papéis, recursos integrados, uploads multipart e configuração do ambiente.

## Tipos de pessoa

O cadastro e a edição de pessoas permitem selecionar vários tipos em `personTypes`: administrador, instrutor, aprendiz, gestor de empresa e responsável. A listagem possui filtro por tipo e o detalhe exibe todas as classificações da pessoa.

Os seletores de instrutor, responsável e funções organizacionais correspondentes aos tipos mostram pessoas compatíveis. Instrutores também precisam de conta ativa com role `INSTRUCTOR`; responsáveis precisam ter ao menos 18 anos. O onboarding de aprendiz inclui o tipo `LEARNER`. Na administração de usuários, as novas roles disponíveis correspondem aos tipos da pessoa vinculada; classificar uma pessoa não concede acesso automaticamente.

## Documentos por cadastro

A aba **Documentos** de pessoas e aprendizes compartilha a gestão dos arquivos da mesma pessoa: lista, detalhes do arquivo, download, metadados, histórico de status, envio, edição, renovação e remoção. O vínculo com a pessoa é fixo no formulário. Os arquivos só são consultados ao abrir essa aba, usando `GET /api/person-documents?personId=...`.

O detalhe de contrato tem sua própria aba **Documentos**, com arquivos e versões exclusivamente daquele contrato (`GET /api/contract-documents?contractId=...`). Documentos pessoais não são incluídos. A indicação de versão atual é controlada por tipo de documento.

O menu **Documentos expirados** mantém a rota `/sistema/documentos`, agora somente para consulta: busca uma página de 20 registros com `verificationStatus=EXPIRED`, em ordem de validade, e resolve apenas as pessoas, aprendizes e tipos dessa página. Os links abrem `?tab=documentos&document=...` no aprendiz vinculado ou, quando não há perfil de aprendiz, na pessoa. Não há carregamento global de documentos nem ações de upload, edição ou exclusão nessa lista.

O adaptador de demonstração aplica os mesmos filtros antes da paginação. Na `develop-mock`, as requisições e mutações de domínio usam esse adaptador; uploads e alterações não são persistidos por ele. Na `develop`, o BFF encaminha essas operações ao backend autenticado.
