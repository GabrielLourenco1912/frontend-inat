# Regra de aprendizagem do INAT

O formulário de contrato oferece somente **20h semanais** e **30h semanais**. O campo visual `weeklyWorkloadHours` é convertido para `weeklyWorkloadMinutes` (1200 ou 1800) antes do envio. A API e as visualizações do contrato continuam usando minutos.

Turmas continuam mistas. A restrição pertence à participação online, não à matrícula da turma:

- O formulário de aula informa que a criação de uma aula online gera a lista regular apenas com contratos ativos de 30h.
- Na inclusão manual em aulas online, administradores veem somente aprendizes/pessoas ativos com contrato ativo de exatamente 30h vigente na data da aula e ainda não incluídos na lista. Aulas presenciais oferecem ambos os modelos.
- Uma lista vazia de elegíveis não libera digitação arbitrária de IDs para administradores. Instrutores mantêm o fluxo já existente de indicação por ID, sem receber acesso à lista de contratos/pessoas; o backend valida qualquer tentativa de inclusão.
- Reposições, extras, remanejamentos, mudanças de modalidade e de carga são protegidos no backend. O filtro visual não substitui essa validação.

A política de apresentação está em `src/lib/apprenticeship/policy.ts`. A data da aula usa `America/Sao_Paulo`, como o backend.

Esta branch `develop-mock` mantém seu comportamento anterior: leituras vêm dos dados de demonstração e mutações simuladas não persistem registros. As garantias transacionais e a geração de participantes são implementadas no backend real, não no adaptador mock.

## Verificação

`node tests/apprenticeship-policy.test.mjs` testa o campo renderizado, o payload real do formulário, os critérios de elegibilidade e os dados enviados pela página da aula ao componente de participantes. Também executar `npm run lint` e `npm run build`.
