import { useMemo } from "react";
import { Keyboard, StyleSheet, useWindowDimensions, View } from "react-native";
import { Check, Copy, QrCode } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Button, Card, Text } from "@/src/components/ui";
import { fmtBRL } from "@/src/lib/domain/sales";
import { usePixPayment } from "@/src/features/vendas/hooks/usePixPayment";
import { PixKeyForm } from "@/src/features/vendas/components/PixKeyForm";
import { useTheme, type Tokens } from "@/src/theme";

interface Props {
  total: number;
  onBack: () => void;
  onConfirm: () => void;
}

export function PixPaymentStep({ total, onBack, onConfirm }: Props) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { width } = useWindowDimensions();
  const pix = usePixPayment(total);
  const qrSize = Math.max(120, Math.min(208, width - tokens.spacing.xl * 2 - 40));

  return (
    <View style={styles.content}>
      {pix.payment ? (
        <>
          <View
            style={styles.qr}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`QR Code Pix de ${fmtBRL(pix.payment.amount)}. O código também pode ser copiado abaixo.`}
          >
            <QRCode
              value={pix.payment.payload}
              size={qrSize}
              quietZone={20}
              color={tokens.palette.qrForeground}
              backgroundColor={tokens.palette.qrBackground}
              ecl="M"
            />
          </View>
          <Text variant="caption" tone="muted" style={styles.center}>
            {pix.payment.merchantName} · {pix.payment.merchantCity}
          </Text>
          <Text selectable variant="bodyStrong" style={styles.center}>
            {pix.payment.key}
          </Text>
          <Card variant="flat" padding="md">
            <Text variant="caption">
              Confira no seu banco se recebeu {fmtBRL(pix.payment.amount)} antes de registrar a venda.
              O DuDia não confirma o pagamento automaticamente.
            </Text>
          </Card>
          <Button
            label="Copiar código Pix"
            variant="secondary"
            fullWidth
            icon={<Copy size={20} color={tokens.palette.foreground} />}
            onPress={() => void pix.copy()}
          />
          {pix.copyMessage ? (
            <Text variant="caption" tone="success" accessibilityLiveRegion="polite">
              {pix.copyMessage}
            </Text>
          ) : null}
          <Text selectable variant="caption" tone="muted" accessibilityLabel="Pix copia e cola">
            {pix.payment.payload}
          </Text>
          <Button
            label="Recebi o Pix"
            accessibilityLabel="Confirmei o recebimento do Pix no banco. Registrar venda."
            variant="success"
            fullWidth
            icon={<Check size={20} color={tokens.palette.successForeground} />}
            onPress={onConfirm}
          />
          <Button label="Editar dados do Pix" variant="ghost" onPress={pix.edit} />
        </>
      ) : (
        <>
          <PixKeyForm
            keyType={pix.keyType}
            onKeyTypeChange={pix.setKeyType}
            pixKey={pix.key}
            onKeyChange={pix.setKey}
            merchantName={pix.merchantName}
            onNameChange={pix.setMerchantName}
            merchantCity={pix.merchantCity}
            onCityChange={pix.setMerchantCity}
          />
          <Button
            label="Gerar Pix"
            variant="success"
            size="lg"
            fullWidth
            icon={<QrCode size={20} color={tokens.palette.successForeground} />}
            onPress={() => { if (pix.generate()) Keyboard.dismiss(); }}
          />
        </>
      )}
      {pix.error ? (
        <Text tone="danger" variant="caption" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {pix.error}
        </Text>
      ) : null}
      <Button label="Voltar às formas de pagamento" variant="ghost" onPress={onBack} />
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    content: { gap: t.spacing.sm },
    qr: { alignItems: "center", alignSelf: "center", backgroundColor: t.palette.qrBackground },
    center: { textAlign: "center" },
  });
}
