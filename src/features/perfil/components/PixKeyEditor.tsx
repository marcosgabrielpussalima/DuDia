import { useMemo } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { Button, Text } from "@/src/components/ui";
import { PixKeyForm } from "@/src/components/ui/PixKeyForm";
import type { SavedPixKey } from "@/src/lib/domain/pixKeys";
import { usePixKeyEditor } from "@/src/features/perfil/hooks/usePixKeyEditor";
import { useTheme, type Tokens } from "@/src/theme";

export function PixKeyEditor({ initial, onSaved }: { initial?: SavedPixKey; onSaved: () => void }) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const editor = usePixKeyEditor(initial);
  return (
    <View style={styles.form}>
      <Text variant="caption" tone="muted">Os dados ficam salvos no Perfil para usar nas próximas vendas.</Text>
      <View pointerEvents={editor.saving ? "none" : "auto"}>
        <PixKeyForm
          keyType={editor.keyType}
          onKeyTypeChange={(type) => {
            if (type !== editor.keyType) { editor.setKeyType(type); editor.setKey(""); }
          }}
          pixKey={editor.key}
          onKeyChange={editor.setKey}
          merchantName={editor.merchantName}
          onNameChange={editor.setMerchantName}
          merchantCity={editor.merchantCity}
          onCityChange={editor.setMerchantCity}
        />
      </View>
      {editor.error ? <Text tone="danger" variant="caption" accessibilityRole="alert" accessibilityLiveRegion="polite">{editor.error}</Text> : null}
      <Button
        label="Salvar chave Pix"
        variant="success"
        size="lg"
        fullWidth
        loading={editor.saving}
        onPress={() => { void editor.save().then((saved) => { if (saved) { Keyboard.dismiss(); onSaved(); } }); }}
      />
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({ form: { gap: t.spacing.lg } });
}
