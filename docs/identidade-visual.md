# Identidade visual do DuDia

Os temas claro e escuro usam o verde `#3bb58d` como cor principal. A referência é o pitch **New - Gabriel - DuDia**, enviado pelo usuário: verde, sálvia, marfim e verde escuro. A logo original é `assets/branding/DudiaL.png`; sálvia `#a7c7bb`, marfim `#f6f8ed` e verde escuro `#1f3130` também aparecem nesse arquivo.

## Paleta

| Uso | Tema claro | Tema escuro |
|---|---|---|
| Fundo | `#f6f8ed` | `#102521` |
| Cartões | `#ffffff` | `#19332e` |
| Superfícies secundárias | `#eaf2eb` | `#213e36` |
| Texto principal | `#1f3130` | `#f6f8ed` |
| Cabeçalho e controles selecionados | `#3bb58d` | `#3bb58d` |
| Texto sobre o verde principal | `#102d26` | `#102d26` |
| Texto e ícones de destaque | `#226a53` | `#7ddbb7` |
| Fundo suave de destaque | `#e0f2e9` | `#214c3b` |
| Destaque secundário dos gráficos | `#215754` | `#a7c7bb` |

Os valores ficam em `src/theme/tokens.ts`. Use `primary` para preenchimentos, `primaryForeground` sobre esses preenchimentos e `primaryStrong` para textos/ícones em cartões e fundos suaves. O contraste de `primaryForeground` sobre `primary` é aproximadamente **5,74:1** nos dois temas.

Sucesso, aviso e erro têm pares próprios de fundo e texto. O carrinho usa `successForeground`, e cada mensagem temporária usa a cor de texto correspondente ao seu estado. O QR Pix continua preto sobre branco para leitura pelo banco.

## Cabeçalho

`src/components/ui/ScreenHeader.tsx` mostra a logo no canto superior esquerdo, junto ao nome DuDia, em todas as telas que usam esse componente. O tamanho é 36 dp no cabeçalho compacto de Vendas e 44 dp nas demais telas. O texto “Total de hoje” e a ação de voltar no histórico continuam disponíveis. O cabeçalho respeita a área segura do aparelho, e a barra de status usa ícones escuros sobre o verde.

## Como conferir no aparelho

1. Em Perfil, selecione Claro e Escuro e visite Vendas, Produtos, Balanço e Histórico.
2. Confira a logo e os títulos, incluindo o detalhe de um dia no Histórico.
3. Adicione um produto ao carrinho e confira o botão de pedido, os campos do Pix e o QR Code.
4. Confira os avisos de estoque, as mensagens temporárias e a tela com fonte ampliada.

A alteração reutiliza as dependências e a logo existentes. Em um build de desenvolvimento conectado ao Metro, recarregue o app após atualizar o código. Para distribuir um APK/IPA com o novo visual, gere e instale uma nova versão.
