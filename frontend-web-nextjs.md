# Frontend web INAT — integração com a API

Este documento descreve o estado implementado do portal Next.js. O frontend não possui fixtures acadêmicas nem modo mock: todos os dados do sistema vêm do backend, e uma coleção vazia é apresentada como estado vazio real.

## 1. Configuração

Variáveis do frontend:

```dotenv
BACKEND_URL=http://localhost:8080
REGULATION_URL=https://endereco-do-regulamento
FRONTEND_AUTH_COOKIE_SECURE=false
```

- `BACKEND_URL` é usado somente no servidor Next.js. No Compose, o padrão é `http://backend:8080`.
- `REGULATION_URL` fornece o documento oficial exibido no cadastro. Sem ela, o cadastro fica bloqueado; o frontend não inventa texto jurídico.
- `FRONTEND_AUTH_COOKIE_SECURE=false` é útil apenas em HTTP local. Em produção com HTTPS, usar `true` ou deixar a detecção automática.
- Para o refresh cookie funcionar em HTTP local, o backend também precisa de `API_SECURITY_REFRESH_COOKIE_SECURE=false`.

Não há variável de seleção de mock e não há bootstrap de dados no frontend.

## 2. Papéis válidos

O portal reconhece somente os quatro papéis aceitos pelo backend:

| Papel | Escopo no portal |
| --- | --- |
| `ADMIN` | Operação acadêmica e administrativa completa. |
| `INSTRUCTOR` | Próprias aulas, listas, chamada, atividades e correções. |
| `LEARNER` | Próprias aulas, atividades, entregas, contrato e avisos. |
| `EMPLOYER_MANAGER` | Organizações empregadoras vinculadas, seus contratos e aprendizes. |

Uma conta sem papel não é chamada de “em análise”. Ela vê um estado de vínculo incompleto até um administrador conceder um papel.

Não existem `USER`, `STAFF`, `SCHOOL_MANAGER` ou “equipe pedagógica” como papéis do produto. As atividades administrativas/pedagógicas pertencem a `ADMIN`.

## 3. Autenticação

O navegador conversa com rotas BFF do Next.js:

| Rota do frontend | Uso |
| --- | --- |
| `POST /api/auth/register` | Cadastro público com aceite do regulamento. |
| `POST /api/auth/login` | Credenciais e criação do desafio por e-mail. |
| `POST /api/auth/challenge/verify` | Código de validação/MFA. |
| `POST /api/auth/refresh` | Renovação silenciosa usada pelo cliente. |
| `GET /api/auth/session-refresh` | Renovação e redirecionamento usados pelo middleware. |
| `POST /api/auth/logout` | Revogação/limpeza da sessão. |

O access token e o refresh token ficam em cookies `HttpOnly`; nenhum token é exposto a JavaScript, `localStorage` ou componentes React. O access token é acrescentado ao `Authorization` apenas pelo BFF.

O refresh token só é removido quando o backend rejeita a sessão (`400`, `401` ou `403`). Uma indisponibilidade temporária não destrói uma sessão ainda recuperável.

### Cadastro público

A request enviada ao backend contém:

```json
{
  "name": "Nome da pessoa",
  "email": "pessoa@example.com",
  "password": "senha",
  "regulationAccepted": true,
  "regulationAcceptedAt": "2026-09-07T12:00:00.000Z"
}
```

O checkbox começa desmarcado. O instante é capturado quando a pessoa marca o aceite e é limpo se ela desmarcar.

O backend exige uma `Person` já cadastrada com o mesmo e-mail. Por isso, sem os dados iniciais administrativos, nenhum registro público conseguirá concluir o vínculo — comportamento esperado até a definição do povoamento.

### Restrição de criação de usuário

O frontend nunca consome `POST /api/users`; o próprio BFF responde `405` se essa operação for tentada. Novas contas entram exclusivamente por `POST /api/auth/register`.

A administração pode operar contas existentes por `GET`, `PUT` e `DELETE /api/users/{id}` e conceder/revogar papéis por `/api/users/{userId}/roles`.

## 4. Transporte entre frontend e backend

As páginas Server Components usam os helpers de `src/lib/api/server.ts`. As mutations do navegador usam o proxy autenticado:

```text
navegador
  -> /api/backend/{recurso}
  -> BFF Next.js acrescenta Bearer do cookie HttpOnly
  -> /api/{recurso} no Spring Boot
```

A rota aceita `GET`, `POST`, `PUT`, `PATCH` e `DELETE`, JSON, `multipart/form-data` e respostas binárias. Ela não permite acessar `/auth` pelo proxy genérico e bloqueia a criação direta de usuário.

Respostas `401` em mutations tentam um refresh uma vez e repetem a operação. `403` permanece uma negação de autorização; páginas Server Components redirecionam para `/sistema/sem-acesso`.

O contexto do ator vem de `GET /api/me` e fornece:

- a conta e os papéis atuais;
- `learnerId`, se a pessoa possuir perfil de aprendiz;
- IDs de organizações `EMPLOYER` com vínculo ativo, somente para `EMPLOYER_MANAGER`.

IDs relacionados não são inventados quando o backend não fornece uma projeção nominal. Nesses casos, o portal mostra a matrícula, um identificador técnico ou informa que o dado é protegido.

## 5. Recursos integrados

| Área | Leituras e operações implementadas |
| --- | --- |
| Central | Aulas, atividades, contratos, aprendizes, organizações e avisos acessíveis. |
| Agenda/aulas | Lista contextual, criação, edição, exclusão, geração de lista, participante manual e chamada. |
| Atividades | Lista contextual, criação, edição, estados, exclusão, materiais, entregas, anexos e avaliação. |
| Aprendizes | Lista contextual, onboarding composto, dossiê e seções autorizadas. |
| Pessoas | Lista, detalhe, criação, edição e exclusão. |
| Organizações | Lista contextual, criação, detalhe, contratos/aprendizes e vínculos de membros. |
| Contratos | Lista contextual, criação, detalhe e documentos versionados. |
| Turmas | Lista, criação, detalhe, aulas e matrículas de contratos. |
| Documentos pessoais | Upload, download, filtros, verificação, rejeição e exclusão. |
| Comunicações | Criação por usuário/turma/todos, canais in-app/e-mail, agendamento, contexto, payload e reenvio de falhas. |
| Administração | Contas existentes, status, senha administrativa, vínculo de pessoa, papéis e tipos de documento. |

Não existe tela nem proxy específico de `StoredFile`. O upload e o download sempre passam pelo recurso dono: atividade, entrega, documento pessoal ou documento contratual.

## 6. Cadastros de pessoa, endereço e aprendiz

Pessoa e organização sempre enviam o endereço aninhado na mesma request. Não há controller ou jornada isolada para endereço.

Exemplo simplificado de pessoa:

```json
{
  "address": {
    "postalCode": "83200000",
    "street": "Rua Exemplo",
    "streetNumber": "10",
    "addressLine2": null,
    "district": "Centro",
    "city": "Paranaguá",
    "stateCode": "PR",
    "countryCode": "BR"
  },
  "fullName": "Nome Completo",
  "taxId": "12345678901",
  "contactEmail": "pessoa@example.com",
  "phoneNumber": "41999999999",
  "birthDate": "2008-01-01",
  "gender": null
}
```

“Novo aprendiz” usa `POST /api/learner-onboardings` e envia pessoa, endereço, perfil do aprendiz e um responsável existente opcional na mesma operação. Ele não cria uma conta de usuário.

As regras de menor de idade, responsável, escola, períodos e unicidades continuam sendo autoridade do backend; o frontend apresenta o erro sem tentar contorná-lo.

## 7. Upload JSON + arquivo

Endpoints que recebem metadados e binário usam uma única request `multipart/form-data`:

```ts
const form = new FormData();
form.append(
  "metadata",
  new Blob([JSON.stringify(metadata)], { type: "application/json" }),
);
form.append("file", file);
```

O nome da parte JSON é `metadata` e a parte binária é `file`. Não se define manualmente o header `Content-Type`; o navegador acrescenta o boundary.

Downloads passam pela rota contextual `.../content`. O BFF preserva `Content-Type` e `Content-Disposition`, e o navegador usa o nome devolvido pelo backend.

## 8. Aulas, presença e atividades

As modalidades aceitas são apenas `ONLINE` e `ONSITE`. A criação/edição não oferece híbrida. O campo opcional `externalLessonUrl` aceita somente `http://` ou `https://` e pode apontar para YouTube, Vimeo, Dailymotion, um arquivo de vídeo ou outro host público incorporável. Quando existe e o navegador consegue renderizá-lo, a página de detalhe mostra o player; URL ausente, inválida ou com erro de carregamento mantém a página sem player.

Conflitos de horário e consistência entre turma, instrutor e participantes são validados pelo backend. A chamada grava cada `AttendanceRecord` usando a participação da aula.

Atividades podem ser `DRAFT`, `PUBLISHED`, `CLOSED` ou `CANCELLED`. `DRAFT` é um rascunho manual, não é publicado pelo agendador e não é exposto aos aprendizes. O frontend permite materiais multipart, resposta textual, rascunho, envio, envio tardio permitido pelo backend, exclusão de rascunho/devolvida e correção.

## 9. Notificações

Toda criação escolhe exatamente um público:

- `USER`: uma conta ativa;
- `COHORT`: os usuários ativos dos aprendizes da turma;
- `ALL`: todas as contas ativas.

Os canais expostos no portal são `IN_APP` e `EMAIL`. A contagem no shell vem de `/api/notification-recipients/me/unread-count`. Falhas de entrega podem voltar a `PENDING`, para nova tentativa do agendador.

## 10. Estado vazio e povoamento

O frontend não cria dados automaticamente, não importa fixtures e não transforma uma lista vazia em cenário demonstrativo. Cada módulo mostra um estado vazio específico.

O povoamento inicial será definido separadamente. Até lá, a integração está preparada para uma base vazia, mas será necessário criar por meio administrativo ao menos:

1. pessoas, incluindo aquela que fará o primeiro registro público;
2. conta/papel administrativo por mecanismo de bootstrap a definir;
3. catálogo e dados de domínio desejados.

## 11. Validação local

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Para subir a solução integrada a partir da raiz:

```bash
docker compose up --build
```

O build não depende de dados cadastrados. Testes de jornada autenticada dependem de uma conta válida e, portanto, ficam para a etapa de povoamento.
