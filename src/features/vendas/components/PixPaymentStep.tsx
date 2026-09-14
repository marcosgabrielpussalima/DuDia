import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Check, QrCode } from "lucide-react-native";
import { Button, Card, Text } from "@/src/components/ui";
import { usePixKeys } from "@/src/hooks/usePixKeys";
import { usePixPayment } from "@/src/features/vendas/hooks/usePixPayment";
import { PixQrPayment } from "@/src/features/vendas/components/PixQrPayment";
import { SavedPixKeySelector } from "@/src/features/vendas/components/SavedPixKeySelector";
import { useTheme, type Tokens } from "@/src/theme";

interface Props {
  total: number;
  selecting: boolean;
  onSelectingChange: (selecting: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function PixPaymentStep({ total, selecting, onSelectingChange, onBack, onConfirm }: Props) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const saved = usePixKeys();
  const pix = usePixPayment(total, saved.keys);

  return (
    <View style={styles.content}>
      {pix.payment ? (
        <PixQrPayment
          payment={pix.payment}
          copyMessage={pix.copyMessage}
          onCopy={() => void pix.copy()}
          onConfirm={onConfirm}
          onChangeKey={pix.clear}
        />
      ) : selecting ? (
        <SavedPixKeySelector {...saved} onSelect={pix.generate} />
      ) : (
        <>
          <Card variant="flat" padding="md">
            <Text variant="caption">
              Já recebeu o pagamento? Registre a venda por Pix.
              Para o cliente pagar agora, gere um Pix com uma chave cadastrada.
            </Text>
          </Card>
          <Button
            label="Registrar venda por Pix"
            accessibilityLabel="Já recebi o Pix. Registrar venda e atualizar estoque."
            variant="success"
            size="lg"
            fullWidth
            icon={<Check size={20} color={tokens.palette.successForeground} />}
            onPress={onConfirm}
          />
          <Button label="Gerar Pix" size="lg" fullWidth icon={<QrCode size={20} color={tokens.palette.primaryForeground} />} onPress={() => onSelectingChange(true)} />
        </>
      )}
      {pix.error ? <Text tone="danger" variant="caption" accessibilityRole="alert" accessibilityLiveRegion="polite">{pix.error}</Text> : null}
      {selecting ? <Button label="Voltar às opções Pix" variant="ghost" onPress={() => { pix.clear(); onSelectingChange(false); }} /> : null}
      <Button label="Voltar às formas de pagamento" variant="ghost" onPress={onBack} />
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({ content: { gap: t.spacing.sm } });
}
