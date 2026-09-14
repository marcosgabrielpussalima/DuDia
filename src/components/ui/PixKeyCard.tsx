import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Text } from "@/src/components/ui";
import type { SavedPixKey } from "@/src/lib/domain/pixKeys";
import type { PixKeyType } from "@/src/lib/payments/pix";
import { useTheme, type Tokens } from "@/src/theme";

const LABELS: Record<PixKeyType, string> = {
  cpf: "CPF", cnpj: "CNPJ", phone: "Telefone", email: "E-mail", random: "Aleatória",
};

interface Props {
  recipient: SavedPixKey;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  busy?: boolean;
}

export function PixKeyCard({ recipient, onSelect, onEdit, onDelete, busy }: Props) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  return (
    <Card variant="flat" padding="md" style={styles.card}>
      <Text variant="bodyStrong">{recipient.merchantName}</Text>
      <Text variant="caption" tone="muted">{recipient.merchantCity} · {LABELS[recipient.keyType]}</Text>
      <Text selectable variant="caption">{recipient.key}</Text>
      {onSelect ? (
        <Button
          label="Usar esta chave"
          accessibilityLabel={`Gerar Pix para ${recipient.merchantName}, chave ${recipient.key}`}
          onPress={onSelect}
          fullWidth
        />
      ) : null}
      {onEdit || onDelete ? (
        <View style={styles.actions}>
          {onEdit ? <Button label="Editar" accessibilityLabel={`Editar chave Pix ${recipient.key}`} variant="secondary" disabled={busy} onPress={onEdit} style={styles.action} /> : null}
          {onDelete ? <Button label="Excluir" accessibilityLabel={`Excluir chave Pix ${recipient.key}`} variant="danger" disabled={busy} onPress={onDelete} style={styles.action} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    card: { gap: t.spacing.sm },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
    action: { flexGrow: 1 },
  });
}
