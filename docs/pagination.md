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

Documentos expirados já utilizavam páginas de 20 e mantêm esse comportamento. Pessoas envia `personType` ao backend, que filtra antes de paginar. A pesquisa textual das 11 listagens com campo de busca usa `/api/search/{recurso}?q=...&page=0&size=20`. O backend aplica texto, tipo de pessoa e escopo de acesso antes de contar e paginar. Buscar/Enter inicia a página 1; anterior/próxima e o filtro de tipo preservam `q`. Limpar remove o termo. Os filtros locais de situação continuam identificados como restritos à página carregada. Avisos e documentos não possuem campo de pesquisa textual.

A navegação preserva os parâmetros da consulta, incluindo `tab` e `personType`. Trocar a aba de um cadastro ou o tipo de pessoa inicia a primeira página. Avisos pode navegar além dos primeiros 100 registros; a ação de leitura em lote é explicitamente limitada à página atual.

## Endpoints que retornam arrays

Os endpoints por perfil/contexto, como `/api/lessons/me`, `/api/contracts/learner/{id}`, `/api/contracts/organization/{id}`, participantes, frequência e atividades de uma aula, retornam arrays sem `PageResponse`. Nesses casos, a interface apresenta páginas de 20, mas a API ainda transfere a coleção completa. As permissões permanecem nos mesmos endpoints; não se usa uma listagem administrativa para contornar essa limitação.

As coleções dos detalhes usam `PaginatedContent`/`useClientPagination`: responsáveis, contratos, matrículas, frequência e atividades do dossiê, membros/aprendizes de organizações, matrículas/aulas de turmas, participantes/chamada/atividades das aulas, entregas para correção e históricos. Os dados de edição da chamada ficam no componente acima da apresentação paginada, portanto trocar de página não descarta as alterações pendentes. A página é ajustada quando uma coleção diminui e reiniciada quando muda o filtro.

Algumas associações dos detalhes ainda precisam carregar coleções completas porque o backend não fornece filtro por proprietário, como matrículas por aprendiz. Paginação integral dessas consultas exige endpoints paginados e filtrados no backend. O dossiê carrega os dados das seções acadêmicas e dos documentos somente quando essas abas estão abertas.

## Cadastros e documentos

Seletores de coleções grandes usam `SearchSelect`: responsável, aprendiz, empresa, escola, organização superior, turma, instrutor, aula de atividade, contrato de matrícula, pessoa de vínculo e destinatário de comunicação. Ao focar ou digitar, consultam `/api/lookups/{recurso}` com `q`, `page` (base 0), `size=5` e `purpose`. Há espera de 300 ms, cancelamento de requisições anteriores, navegação por teclado e botões de anterior/próximos. A seleção envia apenas o ID; texto livre não é aceito como uma seleção válida. Trocar a pesquisa volta à primeira página.

O backend limita cada resposta a 5 opções `{id,label}` e aplica elegibilidade antes do limite: tipo de pessoa, maioridade, pessoa/conta ativa para instrutores, tipo e situação da organização e contrato ativo de 30h na data de aulas online. Participantes já vinculados são excluídos. O seletor de participantes recebe `contextId` da aula e exige permissão para gerenciá-la. Instrutores pesquisam somente aprendizes já acessíveis e mantêm a alternativa existente de informar um identificador para inclusão validada pelo backend. Tipos, papéis e situações permanecem seletores simples.

Os nomes associados aos registros visíveis são carregados por ID onde possível. Algumas associações e catálogos pequenos continuam completos. A busca da chamada filtra todos os participantes carregados antes da paginação local, preservando alterações ainda não salvas.

Os endpoints de pesquisa e opções foram adicionados ao backend no pacote `search`; essa versão do backend precisa acompanhar o frontend de integração. A mock implementa o mesmo contrato de texto, elegibilidade e paginação, sobre os dados de demonstração.

As abas de documentos carregam uma página do proprietário. Links para um documento fora da página fazem uma consulta individual adicional, verificando o proprietário antes de apresentar o documento. A navegação para outra página remove a seleção por link e mantém a aba Documentos.

Validações de tipo já utilizado e cálculo de próxima versão dependem do catálogo completo do proprietário. Esse catálogo é consultado ao abrir o editor de anexos, e o histórico contratual completo é carregado por ação explícita. Os registros adicionais não são adicionados à listagem paginada. Os binários continuam sendo baixados somente pela ação de download.

## Validação

`tests/pagination.test.mjs` executa as páginas com dados controlados e verifica uma única consulta da coleção principal, 20 itens, totais, filtro de pessoa, acesso restrito, links diretos, páginas inválidas/vazias e avisos além do registro 100. `tests/lists.test.mjs` verifica o limite visual em desktop/mobile, coleções de detalhes, controles e navegação quando um filtro deixa a página vazia. `tests/documents.test.mjs` verifica carregamento por aba e isolamento por proprietário.

Os testes também verificam pesquisa além dos primeiros 20 registros nas 11 coleções, preservação de `q`, totais filtrados, páginas de 5 opções sem duplicações e elegibilidade online. O backend testa as consultas em banco H2, escopos de autorização, limites e contrato de 30h.

A implementação é compartilhada entre `develop` e `develop-mock`; somente os quatro adaptadores documentados em `docs/branch-workflow.md` diferem.
