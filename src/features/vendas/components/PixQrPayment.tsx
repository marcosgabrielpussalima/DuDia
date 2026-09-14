import { useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Check, Copy } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Button, Card, Text } from "@/src/components/ui";
import { fmtBRL } from "@/src/lib/domain/sales";
import type { StaticPixPayment } from "@/src/lib/payments/pix";
import { useTheme, type Tokens } from "@/src/theme";

interface Props {
  payment: StaticPixPayment;
  copyMessage: string;
  onCopy: () => void;
  onConfirm: () => void;
  onChangeKey: () => void;
}

export function PixQrPayment({ payment, copyMessage, onCopy, onConfirm, onChangeKey }: Props) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { width } = useWindowDimensions();
  const qrSize = Math.max(120, Math.min(208, width - tokens.spacing.xl * 2 - 40));
  return (
    <>
      <View
        style={styles.qr}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`QR Code Pix de ${fmtBRL(payment.amount)}. O código também pode ser copiado abaixo.`}
      >
        <QRCode value={payment.payload} size={qrSize} quietZone={20} color={tokens.palette.qrForeground} backgroundColor={tokens.palette.qrBackground} ecl="M" />
      </View>
      <Text variant="caption" tone="muted" style={styles.center}>{payment.merchantName} · {payment.merchantCity}</Text>
      <Text selectable variant="bodyStrong" style={styles.center}>{payment.key}</Text>
      <Card variant="flat" padding="md">
        <Text variant="caption">
          Confira no seu banco se recebeu {fmtBRL(payment.amount)} antes de registrar a venda.
          O DuDia não confirma o pagamento automaticamente.
        </Text>
      </Card>
      <Button label="Copiar código Pix" variant="secondary" fullWidth icon={<Copy size={20} color={tokens.palette.foreground} />} onPress={onCopy} />
      {copyMessage ? <Text variant="caption" tone="success" accessibilityLiveRegion="polite">{copyMessage}</Text> : null}
      <Text selectable variant="caption" tone="muted" accessibilityLabel="Pix copia e cola">{payment.payload}</Text>
      <Button
        label="Recebi o Pix"
        accessibilityLabel="Confirmei o recebimento do Pix no banco. Registrar venda."
        variant="success"
        fullWidth
        icon={<Check size={20} color={tokens.palette.successForeground} />}
        onPress={onConfirm}
      />
      <Button label="Escolher outra chave" variant="ghost" onPress={onChangeKey} />
    </>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    qr: { alignItems: "center", alignSelf: "center", backgroundColor: t.palette.qrBackground },
    center: { textAlign: "center" },
  });
}
