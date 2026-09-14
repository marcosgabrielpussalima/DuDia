import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Text } from "@/src/components/ui";
import { PixKeyCard } from "@/src/components/ui/PixKeyCard";
import { usePixKeys } from "@/src/hooks/usePixKeys";
import type { SavedPixKey } from "@/src/lib/domain/pixKeys";
import { pixKeysStore } from "@/src/lib/storage/pixKeys";
import { feedback } from "@/src/lib/utils/feedback";
import { useTheme, type Tokens } from "@/src/theme";

export function PixKeysSection() {
  const router = useRouter();
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const { keys, status } = usePixKeys();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);

  const remove = async (id: string) => {
    if (busy.current) return;
    busy.current = true;
    setDeleting(true);
    setError("");
    try {
      await pixKeysStore.remove(id);
      feedback("ok");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir a chave Pix.");
      feedback("err");
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  };

  const confirmDelete = (recipient: SavedPixKey) => {
    Alert.alert("Excluir chave Pix?", `Remover o cadastro de ${recipient.merchantName} deste aparelho? A chave no banco continua ativa.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => { void remove(recipient.id); } },
    ]);
  };

  return (
    <View style={styles.section}>
      <Text variant="overline" tone="muted">Chaves Pix</Text>
      {status === "loading" ? <ActivityIndicator color={tokens.palette.primary} accessibilityLabel="Carregando chaves Pix" /> : status === "error" ? (
        <>
          <Text tone="danger" variant="caption" accessibilityRole="alert">Não foi possível carregar suas chaves Pix.</Text>
          <Button label="Tentar novamente" variant="secondary" onPress={() => void pixKeysStore.init()} />
        </>
      ) : (
        <>
          {keys.length === 0 ? <Text variant="caption" tone="muted">Nenhuma chave Pix cadastrada. Salve chave, nome e cidade para reutilizar nas vendas.</Text> : null}
          {keys.map((key) => (
            <PixKeyCard
              key={key.id}
              recipient={key}
              busy={deleting}
              onEdit={() => router.push({ pathname: "/chave-pix", params: { id: key.id } })}
              onDelete={() => confirmDelete(key)}
            />
          ))}
          <Button label="Cadastrar chave Pix" disabled={deleting} onPress={() => router.push("/chave-pix")} fullWidth />
        </>
      )}
      {error ? <Text tone="danger" variant="caption" accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({ section: { gap: t.spacing.sm, marginTop: t.spacing.md } });
}
