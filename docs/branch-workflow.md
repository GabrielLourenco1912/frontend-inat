# Interface compartilhada entre branches

`develop` é a implementação real, com sessão autenticada e BFF Next.js → Spring Boot. `develop-mock` é a demonstração das mesmas telas, com ator e dados simulados; mutações de domínio não persistem. Não usar a branch mock em produção.

Páginas, componentes, estilos, contratos TypeScript, políticas de apresentação, fixtures, testes e documentação devem ser idênticos. O conteúdo pode variar conforme dados e permissões do ator, mas não há um design específico por branch.

Somente quatro arquivos podem divergir:

| Arquivo | `develop` | `develop-mock` |
| --- | --- | --- |
| `src/app/api/backend/[...path]/route.ts` | Proxy autenticado para o backend | Respostas de demonstração |
| `src/lib/api/server.ts` | Consultas autenticadas do servidor Next | Consultas às fixtures |
| `src/lib/auth/session.ts` | Ator obtido por sessão e `/api/me` | Ator de demonstração |
| `src/proxy.ts` | Proteção das rotas do sistema | Acesso às telas de demonstração |

As fixtures existem nas duas branches para executar os mesmos testes; código de produção da `develop` não pode importá-las. Rotas públicas de autenticação não são substituídas por esses mocks.

## Desenvolvimento e sincronização

1. Desenvolver funcionalidades na `develop`, separando commits por responsabilidade. Manter regras de negócio específicas em commits próprios.
2. Executar `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.
3. Integrar os commits na `develop-mock` com merge revisado (`git merge --no-ff --no-commit develop`). Preservar os quatro adaptadores de demonstração antes de concluir o merge. Se o trabalho começou no mock, fazer primeiro a integração inversa preservando os quatro adaptadores reais, testar e depois sincronizar de volta.
4. Nunca escolher a versão inteira de uma branch sem revisar os adaptadores: isso pode trocar autenticação real por acesso de demonstração. Não reescrever o histórico compartilhado.
5. Validar também a branch de destino, concluir os commits e executar `npm run check:branches` com ambas as referências locais atualizadas. O comando falha se qualquer arquivo compartilhado divergir ou se o runtime real importar mocks.

`npm run check:branches -- <ref-real> <ref-mock>` permite comparar outras referências. O comando verifica o conteúdo commitado, não alterações pendentes, e não faz fetch, commits ou push.

## Escopo dos testes

Os testes de pessoas verificam classificações e elegibilidade; os de aprendizagem cobrem modelos 20h/30h, payload e participantes; os de documentos verificam isolamento por cadastro, carregamento por aba e paginação; os de listas verificam links e controles disponíveis. Testes de páginas substituem transporte e autenticação por dependências controladas, sem exigir um backend em execução. Não substituem testes integrados de autenticação ou inspeção visual no navegador.
