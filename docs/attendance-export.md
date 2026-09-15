# Exportação de presenças

O detalhe da organização oferece **Exportar presenças (Excel)** no painel de aprendizes vinculados. No detalhe do aprendiz, a mesma ação está na aba Presenças. O arquivo `.xlsx` é gerado apenas no clique, no servidor Next, usando os endpoints autenticados existentes e [ExcelJS](https://github.com/exceljs/exceljs).

A planilha contém as abas Resumo e Presenças: matrícula (como texto, preservando zeros), nome quando permitido, aula, início/fim, modalidade, situação da presença, entrada/saída, momento do registro e observações. Os horários seguem America/Sao_Paulo. Cabeçalhos ficam fixos e possuem filtros. Aulas sem lançamento não viram faltas; um relatório vazio tem cabeçalhos e total zero.

A exportação independe da paginação visual. Administradores percorrem todas as páginas de presenças, retendo apenas os registros dos aprendizes escolhidos; associações são resolvidas em grupos de até 8 consultas. Para organizações, o conjunto de aprendizes é o mesmo dos vínculos por contratos, incluindo contratos anteriores, e o arquivo inclui seu histórico completo. Contratos repetidos não duplicam aprendizes ou presenças.

As permissões existentes são preservadas: relatório organizacional para administradores; individual para administradores e instrutores. Instrutores recebem apenas registros do aprendiz nas aulas que ministram, sem consultar nomes pessoais protegidos. Gestores e aprendizes não recebem um novo acesso ao catálogo de presenças. A rota verifica sessão e perfil antes de consultar o backend, que continua autorizando cada leitura. Respostas de arquivos usam `private, no-store`. Dados textuais não são fórmulas na planilha.

A rota compartilhada é `/api/exports/attendance/{organizations|learners}/{id}`. A mock usa o mesmo gerador e suas fixtures pelos adaptadores existentes. Não há mudança de backend. Os membros das organizações possuem links para `/sistema/pessoas/{personId}`; ativação e remoção permanecem ações separadas.

`tests/attendance-export.test.mjs` abre o XLSX gerado e valida exportação além de 100 registros, isolamento de aprendiz/organização/instrutor, autenticação, cabeçalhos vazios, texto acentuado, zeros, fuso e texto que começa com `=`.
