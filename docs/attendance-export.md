# Exportação de presenças

O detalhe da organização oferece **Exportar presenças (Excel)** no painel de aprendizes vinculados. No detalhe do aprendiz, a mesma ação está na aba Presenças. O botão abre um modal no qual data inicial e data final são opcionais, inclusivas e interpretadas em `America/Sao_Paulo` pela data de início da aula.

A rota Next `/api/exports/attendance/{organizations|learners}/{id}` valida sessão, perfil e período. Ela consulta o endpoint paginado `/api/attendance-records` com filtros aplicados no banco antes da paginação:

- organização: `organizationId={id}&activeContractsOnly=true`;
- aprendiz: `learnerId={id}&activeContractsOnly=false`;
- período, quando informado: `startDate=AAAA-MM-DD&endDate=AAAA-MM-DD`.

Assim, a exportação percorre somente as páginas do resultado filtrado. Depois resolve em lotes de até oito consultas apenas os aprendizes, aulas, turmas, instrutores e pessoas referenciados pelos registros retornados. Instrutores continuam limitados no backend às próprias aulas e podem exportar somente por aprendiz. O relatório organizacional continua exclusivo do administrador.

A planilha contém as abas **Resumo** e **Presenças**. O resumo registra escopo, período, regra de contrato, quantidades de aprendizes, aulas e registros, além da distribuição por situação. A aba detalhada contém matrícula, aprendiz, CPF mascarado, turma, aula, data e horários previstos, carga horária, modalidade, local, instrutor, situações da aula e da presença, entrada, saída, permanência, cobertura percentual, datas de registro/atualização e observações. Horários seguem `America/Sao_Paulo`, zeros iniciais são preservados e textos não são interpretados como fórmulas.

A mock usa o mesmo modal, gerador e filtros por meio dos adaptadores existentes. Os membros das organizações permanecem links para `/sistema/pessoas/{personId}`; ativação e remoção continuam ações separadas.
