# Sistema de notificações do CONECTA

## Configuração (uma única vez)

1. Supabase > **SQL Editor > New query**.
2. Cole **todo** o conteúdo de `database/notificacoes.sql` e clique em **Run**. Pode rodar de novo: nada é duplicado.
3. Se o SQL avisar que a tabela não entrou no Realtime, habilite `public.notificacoes` em **Database > Replication**.

Sem isso o sino fica vazio e o campo de antecedência do lembrete avisa que o banco ainda não foi configurado.

## Eventos que geram notificação (todos reais; não há avisos de demonstração)

| Evento | Título | Cor / ícone | Abre |
|---|---|---|---|
| Professor cria tarefa | Nova tarefa | verde-petróleo / prancheta | a atividade |
| Professor cria prova | Nova prova | âmbar / calendário | a prova |
| Prova se aproximando (7 dias, 1 dia, 1 h antes, pela data cadastrada) | Prova se aproximando | âmbar / calendário | a prova |
| Professor cadastra paciente | Novo paciente | azul / pessoas | o paciente |
| Professor cria caso clínico | Novo caso clínico | ciano / prontuário | o caso |
| Professor muda prazo ou data | Prazo alterado / Data da prova alterada | conforme o tipo | a atividade |
| Professor anexa material | Novo material | conforme o tipo | a atividade |
| Lembrete perto da hora (antecedência escolhida ao criar) | Lembrete | roxo / livro | calendário |

- Paciente criado já com o primeiro caso gera os dois avisos ("Novo paciente" e "Novo caso clínico").
- **Sem duplicatas:** cada aviso tem uma "chave" do evento, com índice único por aluno. Mudar a data de uma prova recomeça os avisos dela; editar um lembrete apaga o aviso antigo e gera outro na hora certa. Excluir uma atividade tira os avisos dela da central.
- **Só o destinatário vê:** as regras de segurança (RLS) liberam a leitura e a marcação como lida apenas das próprias notificações. O aluno só consegue alterar `lida_em`.

## Comportamento na tela

- **Pop-up** no canto inferior direito (acima da barra inferior no celular): entra de baixo para cima, novos avisos entram por cima sem empurrar os que já estão lá. No máximo 3 ao mesmo tempo; os demais esperam numa fila e continuam na central.
- **Tempo:** tarefas ~7 s, lembretes ~8 s, provas ~15 s. Passar o mouse ou focar com o teclado pausa o tempo. Ao fim, o pop-up sobe até o sino e o sino dá uma batidinha. Com "reduzir movimento" ligado no sistema, só some suavemente.
- **Fechar no X não marca como lida.** Clicar no cartão (ou Enter) abre o conteúdo e marca como lida. Esc dispensa.
- **Sino:** contador de não lidas; painel com filtros (Todas, Provas, Atividades, Lembretes), data e hora de cada aviso, "Marcar como lida" individual e "Marcar todas como lidas".
- **Abrir conteúdo:** os links levam à atividade ou prova específica (`#/atividades/<id>`), com rolagem e destaque rápido.

## Limites

- Os avisos que dependem do relógio (lembretes e provas próximas) são gerados enquanto algum aluno estiver com o painel aberto (conferência a cada 30 s e ao voltar para a aba). Para gerar também com todos fora do site, ative o `pg_cron` e rode o comando no fim do SQL.
- Notificação push do navegador com o site fechado não faz parte desta implementação.
