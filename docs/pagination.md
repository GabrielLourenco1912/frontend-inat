# Paginação do portal

As listagens usam 20 registros por página (`PAGE_SIZE` em `src/lib/pagination.ts`). A URL começa em `?page=1`; a API começa em `page=0`. Os controles usam os totais retornados pelo backend e só apresentam anterior/próxima quando existe um destino válido. Os links de páginas do servidor desativam prefetch para não consultar outras páginas antecipadamente.

## Consultas paginadas no backend

`serverListPage` (`src/lib/api/pagination.ts`) pede apenas a página atual com `size=20`. Não usa `serverApiAll`. Se uma exclusão ou um link antigo apontar para além da última página, consulta a última página válida; não percorre as páginas intermediárias. Valores inválidos são tratados como primeira página.

| Listagem | Endpoint principal |
| --- | --- |
| Pessoas | `/api/people` |
| Aprendizes, organizações, contratos, aulas e atividades (administração) | `/api/learners`, `/api/organizations`, `/api/contracts`, `/api/lessons`, `/api/activities` |
| Turmas | `/api/cohorts` |
| Comunicações | `/api/notifications` |
| Usuários, papéis e tipos de documento | `/api/users`, `/api/roles`, `/api/document-types` |
| Avisos | `/api/notification-recipients/me?channel=IN_APP` |
| Documentos de pessoa/aprendiz e de contrato | `/api/person-documents?personId=...`, `/api/contract-documents?contractId=...` |

Documentos expirados já utilizavam páginas de 20 e mantêm esse comportamento. Pessoas envia `personType` ao backend, que filtra antes de paginar. As buscas e os demais filtros locais são identificados na interface como restritos à página carregada, pois os respectivos endpoints não aceitam esses filtros.

A navegação preserva os parâmetros da consulta, incluindo `tab` e `personType`. Trocar a aba de um cadastro ou o tipo de pessoa inicia a primeira página. Avisos pode navegar além dos primeiros 100 registros; a ação de leitura em lote é explicitamente limitada à página atual.

## Endpoints que retornam arrays

Os endpoints por perfil/contexto, como `/api/lessons/me`, `/api/contracts/learner/{id}`, `/api/contracts/organization/{id}`, participantes, frequência e atividades de uma aula, retornam arrays sem `PageResponse`. Nesses casos, a interface apresenta páginas de 20, mas a API ainda transfere a coleção completa. As permissões permanecem nos mesmos endpoints; não se usa uma listagem administrativa para contornar essa limitação.

As coleções dos detalhes usam `PaginatedContent`/`useClientPagination`: responsáveis, contratos, matrículas, frequência e atividades do dossiê, membros/aprendizes de organizações, matrículas/aulas de turmas, participantes/chamada/atividades das aulas, entregas para correção e históricos. Os dados de edição da chamada ficam no componente acima da apresentação paginada, portanto trocar de página não descarta as alterações pendentes. A página é ajustada quando uma coleção diminui e reiniciada quando muda o filtro.

Algumas associações dos detalhes ainda precisam carregar coleções completas porque o backend não fornece filtro por proprietário, como matrículas por aprendiz. Paginação integral dessas consultas exige endpoints paginados e filtrados no backend. O dossiê carrega os dados das seções acadêmicas e dos documentos somente quando essas abas estão abertas.

## Cadastros e documentos

Catálogos auxiliares usados em formulários e associações continuam completos quando necessário; o limite de 20 se aplica à listagem principal. Isso evita oferecer apenas os primeiros 20 responsáveis, organizações ou tipos nos seletores. O catálogo de organizações superiores é carregado somente ao abrir o cadastro de organização.

As abas de documentos carregam uma página do proprietário. Links para um documento fora da página fazem uma consulta individual adicional, verificando o proprietário antes de apresentar o documento. A navegação para outra página remove a seleção por link e mantém a aba Documentos.

Validações de tipo já utilizado e cálculo de próxima versão dependem do catálogo completo do proprietário. Esse catálogo é consultado ao abrir o editor de anexos, e o histórico contratual completo é carregado por ação explícita. Os registros adicionais não são adicionados à listagem paginada. Os binários continuam sendo baixados somente pela ação de download.

## Validação

`tests/pagination.test.mjs` executa as páginas com dados controlados e verifica uma única consulta da coleção principal, 20 itens, totais, filtro de pessoa, acesso restrito, links diretos, páginas inválidas/vazias e avisos além do registro 100. `tests/lists.test.mjs` verifica o limite visual em desktop/mobile, coleções de detalhes, controles e navegação quando um filtro deixa a página vazia. `tests/documents.test.mjs` verifica carregamento por aba e isolamento por proprietário.

A implementação é compartilhada entre `develop` e `develop-mock`; somente os quatro adaptadores documentados em `docs/branch-workflow.md` diferem.
