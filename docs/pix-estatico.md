# Pix estático no checkout

Ao selecionar **Pix**, o checkout pede uma chave cadastrada no banco, o nome do recebedor e a cidade onde a venda é feita. O nome começa preenchido com os dados do Perfil, quando disponíveis. O valor vem do total final do carrinho e não é editável nessa etapa.

**Gerar Pix** apresenta um QR Code e o mesmo código em texto para copiar. Depois de conferir a entrada do dinheiro no banco, o vendedor toca em **Recebi o Pix**. Só essa confirmação chama o registro de venda existente, com `paymentMethod: "pix"`, e desconta o estoque uma vez.

Voltar, fechar a janela ou editar os dados do Pix não registra a venda nem esvazia o carrinho. A chave digitada fica apenas na memória dessa etapa: não é salva no Perfil nem no Histórico. Quando o total muda, o QR anterior é descartado e os dados precisam ser informados novamente.

## Implementação

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/payments/pix.ts` | Valida e normaliza a chave, monta os campos BR Code e calcula CRC16-CCITT. |
| `src/features/vendas/hooks/usePixPayment.ts` | Mantém os dados da ação, gera o payload e copia o código com `expo-clipboard`. |
| `src/features/vendas/components/PixKeyForm.tsx` | Entrada do tipo/chave, nome e cidade. |
| `src/features/vendas/components/PixPaymentStep.tsx` | Mostra QR Code, copia e cola e confirmação manual. |
| `src/features/vendas/components/CheckoutSheet.tsx` | Integra a etapa Pix, preserva o checkout quando o registro falha e bloqueia confirmação repetida. |
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

Foi acrescentado o módulo nativo `expo-clipboard`; reinstale o build Android após o prebuild. Recarregar apenas o JavaScript de um build anterior não adiciona esse módulo. O QR usa `react-native-qrcode-svg` e o `react-native-svg` já presente no projeto. O aplicativo continua exigindo build próprio por causa dos módulos nativos existentes.

`npm run test:pix` confere os tipos dos testes e executa casos de CRC, payload completo, limites, formatos de chave e consistência do total de produtos por unidade e kg. O CRC é comparado ao exemplo oficial do Banco Central e a um payload de R$ 100,50 cujo checksum foi calculado independentemente com `binascii.crc_hqx`.

### Conferência no celular

1. Monte um pedido com vários produtos e uma quantidade fracionária em kg. Confira o total no carrinho.
2. Siga **Vender → Continuar → Pix**. Selecione o tipo da chave cadastrada que será usada no teste, informe chave/nome/cidade e gere o Pix.
3. Leia o QR em um aplicativo bancário e confira destinatário e valor, sem precisar efetuar uma transferência. Confira também o código pelo Pix copia e cola.
4. Volte ou feche o checkout antes de confirmar: pedido, estoque e Histórico devem permanecer como estavam. Reabra e confira que a chave anterior não está preenchida.
5. Gere novamente e, em dados de teste, toque em **Recebi o Pix**. A venda deve aparecer uma única vez no Histórico, com método Pix e valor idêntico; o estoque deve diminuir uma única vez e o carrinho deve esvaziar.
6. Teste chave inválida, campo obrigatório vazio, troca de tipo/chave, edição do pedido, botão Voltar do Android, abertura do teclado em tela pequena e temas claro/escuro. Confira que crédito, débito e dinheiro continuam funcionando.

Esses passos no dispositivo continuam necessários: exportar os bundles JavaScript ou gerar o projeto Android não equivale a executar o aplicativo em um aparelho nem a validar um pagamento bancário.

## Referências

- [Banco Central: Manual de Padrões para Iniciação do Pix, seções 2.5.1 e 2.6](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf).
- [Banco Central: Manual BR Code](https://www.bcb.gov.br/content/estabilidadefinanceira/spb_docs/ManualBRCode.pdf).
- [Expo SDK 56: Clipboard](https://docs.expo.dev/versions/v56.0.0/sdk/clipboard/).
