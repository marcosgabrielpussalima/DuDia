# DuDia 1.1

## Objetivo

A versão 1.1 atualiza a identidade visual do DuDia e introduz alertas locais de estoque baixo sem remover o funcionamento offline-first.

## Alterações

- Cor principal alterada para `#3bb58d`, incluindo tema claro, tema escuro, splash e ícone adaptativo.
- Versão do aplicativo atualizada para `1.1.0`.
- Campo opcional `minStock` adicionado ao produto, compatível com produtos salvos por versões anteriores.
- Cadastro e edição permitem definir um estoque mínimo individual.
- A lista usa o limite individual; quando ausente, mantém o limite global das preferências.
- Notificações locais Android são emitidas quando o estoque chega ao mínimo ou fica abaixo dele.
- A permissão é solicitada somente quando os alertas estão ativados.
- Alertas repetidos são evitados até o produto ser reabastecido acima do mínimo.

## Privacidade

Os alertas são calculados no próprio aparelho. Nenhum dado de vendas ou estoque é enviado para um servidor.

## Validação recomendada

1. Instalar o novo APK e permitir notificações.
2. Cadastrar um produto com estoque 10 e mínimo 5.
3. Reduzir o estoque até 5 e confirmar o alerta.
4. Continuar reduzindo e confirmar que o alerta não se repete.
5. Reabastecer acima de 5 e reduzir novamente para confirmar um novo alerta.
6. Desativar notificações no Perfil e confirmar que nenhum alerta é criado.
