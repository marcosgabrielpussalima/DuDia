# Pix estático e chaves salvas

Ao selecionar **Pix**, o checkout oferece duas opções, inclusive quando nenhuma chave está salva:

- **Registrar venda por Pix**: para um pagamento que o vendedor já conferiu no banco. Registra a venda pelo fluxo existente, com `paymentMethod: "pix"`, e desconta o estoque uma vez. Dispensa gerar código ou cadastrar chave.
- **Gerar Pix**: abre a lista de chaves salvas. **Usar esta chave** gera o QR Code e o copia e cola com o total final do carrinho, que não é editável nessa etapa. Depois de conferir o recebimento no banco, **Recebi o Pix** registra a venda e baixa o estoque uma vez.

**Cadastrar chave Pix** abre uma página para informar tipo/chave, nome e cidade. O nome começa preenchido com os dados do Perfil, quando disponíveis. Ao salvar, volta para a lista do checkout com o pedido preservado e a nova chave disponível. Voltar da página sem salvar também preserva o pedido. A etapa de seleção fica no componente do checkout, fora do modal nativo, para sobreviver ao fechamento temporário do modal durante a navegação.

Em **Perfil → Chaves Pix**, é possível cadastrar, editar e excluir as mesmas chaves. A exclusão pede confirmação e afeta apenas o cadastro local. Os dados ficam salvos neste aparelho em `feira:pixKeys`, usando os wrappers de AsyncStorage. Não entram no Histórico. Cada chave mantém seu tipo, identificador, chave normalizada, nome e cidade; nome/cidade conservam acentos para exibição. Na geração, são aplicadas as regras do BR Code descritas abaixo.

Duplicatas são detectadas pela chave normalizada: variações de maiúsculas, pontuação ou formatação do telefone não criam outra entrada. A lista só muda após o salvamento terminar. Gravações são serializadas; uma falha mantém os dados anteriores e permite tentar novamente. Falha de leitura ou dados inválidos mostram erro e impedem substituir silenciosamente a lista por outra vazia.

Gerar, copiar, trocar chave, cadastrar, editar, voltar ou fechar o checkout não registra venda nem esvazia o carrinho. Alterar o total ou os dados da chave selecionada descarta o QR exibido; a próxima geração usa a chave salva e o total atual. **Escolher outra chave** volta à lista.

## Implementação

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/payments/pix.ts` | Valida e normaliza a chave, monta os campos BR Code e calcula CRC16-CCITT. |
| `src/lib/domain/pixKeys.ts` | Valida o cadastro, impede duplicatas e serializa as alterações persistentes. |
| `src/lib/storage/pixKeys.ts` | Conecta o cadastro aos wrappers de AsyncStorage. |
| `src/hooks/usePixKeys.ts` | Mantém Perfil e checkout atualizados com a mesma lista. |
| `app/chave-pix.tsx` | Rota para a página compartilhada de cadastro/edição. |
| `src/features/perfil/screens/PixKeyScreen.tsx` | Página com formulário e retorno à tela de origem. |
| `src/features/perfil/components/PixKeysSection.tsx` | Lista, edição e exclusão no Perfil. |
| `src/components/ui/PixKeyForm.tsx` e `PixKeyCard.tsx` | Formulário e apresentação reutilizáveis dos dados. |
| `src/features/vendas/hooks/usePixPayment.ts` | Gera o payload a partir de uma chave salva e copia com `expo-clipboard`. |
| `src/features/vendas/logic/pixPayment.ts` | Descarta QR com total ou dados de destinatário desatualizados. |
| `src/features/vendas/components/PixPaymentStep.tsx` | Opções de registrar Pix recebido ou selecionar chave para gerar código. |
| `src/features/vendas/components/PixQrPayment.tsx` | QR Code, copia e cola e confirmação manual de recebimento. |
| `src/features/vendas/components/CheckoutSheet.tsx` | Preserva o pedido/seleção durante o cadastro, oculta o modal na página e bloqueia confirmação repetida. |
| `src/features/vendas/screens/VendasScreen.tsx` | Retorna sucesso/falha do registro e fecha o checkout após sucesso. |
| `src/theme/tokens.ts` | Mantém o QR preto sobre fundo branco nos dois temas. |
| `src/components/ui/BottomSheet.tsx` | Permite que o conteúdo encolha dentro da altura máxima para manter a rolagem do formulário/QR acessível com o teclado aberto. |

O payload contém a chave no template 26, moeda BRL (`986`), valor com duas casas no campo 54, país `BR`, nome (até 25 caracteres), cidade (até 15), `***` como ausência de txid e CRC incluindo `6304`. Nome e cidade têm acentos removidos para compatibilidade; a chave nunca é truncada. O template 26 suporta chaves de até 77 caracteres sem descrição adicional.

São aceitos CPF, CNPJ numérico ou alfanumérico, telefone, e-mail e chave aleatória. A seleção explícita do tipo evita confundir um CPF de 11 dígitos com um telefone. CPF e CNPJ têm os dígitos verificadores conferidos; telefone brasileiro pode ser informado com DDD e é convertido para `+55...`; números de outros países exigem `+` e código do país. E-mail e chave aleatória são normalizados para minúsculas.

O arredondamento usa `toFixed(2)`, assim como a exibição do checkout e o registro da venda. Isso mantém o valor do Pix igual ao valor registrado inclusive para produtos vendidos por kg. Valores não finitos, negativos, que arredondam para zero ou excedem o tamanho do campo 54 são rejeitados.

A geração é local e não consulta a API de um banco. A validação verifica o formato; não comprova que a chave está cadastrada, a identidade de seu titular ou o recebimento. O banco do pagador apresenta o nome real obtido a partir da chave. Não há expiração, consulta de status, confirmação automática ou impedimento de reutilizar o QR. Editar ou fechar a janela também não invalida uma cópia já entregue ao cliente.

## Instalar e testar

Use npm no branch desta alteração:

```bash
npm ci
npm run test:pix
npx tsc --noEmit
npx expo prebuild --platform android
npm run android
```

O cadastro de chaves reutiliza as dependências existentes. O recurso anterior de Pix acrescentou `expo-clipboard`: um build anterior à implementação original do Pix precisa ser recompilado/reinstalado. O QR usa `react-native-qrcode-svg` com `react-native-svg`. Em um build de desenvolvimento com essas dependências, basta recarregar após atualizar o código. O aplicativo continua exigindo build próprio por causa dos módulos nativos existentes.

`npm run test:pix` confere os tipos dos testes e executa casos de CRC, payload completo, limites, formatos de chave, total por unidade/kg, persistência, duplicatas, edição/exclusão, ações concorrentes, falhas de leitura/gravação e descarte de QR desatualizado. O CRC é comparado ao exemplo oficial do Banco Central e a um payload de R$ 100,50 cujo checksum foi calculado independentemente com `binascii.crc_hqx`.

### Conferência no celular

1. Monte um pedido com vários produtos e uma quantidade fracionária em kg. Confira o total no carrinho.
2. Siga **Ver pedido → Continuar → Pix → Gerar Pix** sem nenhuma chave salva. Abra **Cadastrar chave Pix**, informe tipo/chave/nome/cidade e salve. Confira o retorno à lista com o mesmo pedido. Use a chave para gerar o código.
3. Leia o QR em um aplicativo bancário e confira destinatário e valor, sem precisar efetuar uma transferência. Confira também o código pelo Pix copia e cola.
4. Volte ou feche o checkout antes de confirmar: pedido, estoque e Histórico devem permanecer como estavam. Reabra: a chave salva deve continuar disponível. Confira também o botão Voltar do Android na página de cadastro, sem salvar.
5. Gere novamente e, em dados de teste, toque em **Recebi o Pix**. A venda deve aparecer uma única vez no Histórico, com método Pix e valor idêntico; o estoque deve diminuir uma única vez e o carrinho deve esvaziar. Teste também **Registrar venda por Pix** em outro pedido, com e sem chaves cadastradas.
6. No Perfil, cadastre uma segunda chave, edite nome/cidade, tente duplicar a primeira chave, cancele uma exclusão e confirme outra. Feche e reabra o app: a lista deve manter as alterações, e o checkout deve usar os dados atualizados.
7. Teste chave inválida, campo obrigatório vazio, troca de tipo/chave, edição do pedido, abertura do teclado em tela pequena e temas claro/escuro. Confira que crédito, débito e dinheiro continuam funcionando.

Esses passos no dispositivo continuam necessários: exportar os bundles JavaScript ou gerar o projeto Android não equivale a executar o aplicativo em um aparelho nem a validar um pagamento bancário.

## Referências

- [Banco Central: Manual de Padrões para Iniciação do Pix, seções 2.5.1 e 2.6](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf).
- [Banco Central: Manual BR Code](https://www.bcb.gov.br/content/estabilidadefinanceira/spb_docs/ManualBRCode.pdf).
- [Expo SDK 56: Clipboard](https://docs.expo.dev/versions/v56.0.0/sdk/clipboard/).
