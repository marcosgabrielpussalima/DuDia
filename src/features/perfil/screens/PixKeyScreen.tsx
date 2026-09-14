import { useMemo } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, IconButton, ScreenContainer, ScreenHeader, Text } from "@/src/components/ui";
import { PixKeyEditor } from "@/src/features/perfil/components/PixKeyEditor";
import { usePixKeys } from "@/src/hooks/usePixKeys";
import { pixKeysStore } from "@/src/lib/storage/pixKeys";
import { useTheme, type Tokens } from "@/src/theme";

export function PixKeyScreen() {
  const { id: param } = useLocalSearchParams<{ id?: string }>();
  const id = typeof param === "string" ? param : undefined;
  const router = useRouter();
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const insets = useSafeAreaInsets();
  const { keys, status } = usePixKeys();
  const initial = keys.find((key) => key.id === id);
  const back = () => { if (router.canGoBack()) router.back(); else router.replace("/(tabs)/perfil"); };

  return (
    <ScreenContainer>
      <ScreenHeader
        title={id ? "Editar chave Pix" : "Cadastrar chave Pix"}
        compact
        trailing={<IconButton label="Voltar" size={48} filled={false} icon={<ArrowLeft size={22} color={tokens.palette.primaryForeground} />} onPress={back} />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + tokens.spacing.xxl }]}>
          {status === "loading" ? <ActivityIndicator color={tokens.palette.primary} accessibilityLabel="Carregando chaves Pix" /> : status === "error" ? (
            <>
              <Text tone="danger" accessibilityRole="alert">Não foi possível carregar suas chaves Pix.</Text>
              <Button label="Tentar novamente" onPress={() => void pixKeysStore.init()} />
            </>
          ) : id && !initial ? (
            <Text>Esta chave Pix não está mais cadastrada.</Text>
          ) : (
            <PixKeyEditor key={id ?? "new"} initial={initial} onSaved={back} />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: t.spacing.lg, gap: t.spacing.lg },
  });
}
