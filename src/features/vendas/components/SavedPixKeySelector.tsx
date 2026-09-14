import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Button, Text } from "@/src/components/ui";
import { PixKeyCard } from "@/src/components/ui/PixKeyCard";
import type { PixKeysSnapshot } from "@/src/lib/domain/pixKeys";
import { pixKeysStore } from "@/src/lib/storage/pixKeys";
import { useTheme } from "@/src/theme";

interface Props extends PixKeysSnapshot {
  onSelect: (id: string) => void;
}

export function SavedPixKeySelector({ keys, status, onSelect }: Props) {
  const router = useRouter();
  const { tokens } = useTheme();
  if (status === "loading") return <ActivityIndicator color={tokens.palette.primary} accessibilityLabel="Carregando chaves Pix" />;
  if (status === "error") return (
    <>
      <Text tone="danger" variant="caption" accessibilityRole="alert">Não foi possível carregar suas chaves Pix.</Text>
      <Button label="Tentar novamente" variant="secondary" onPress={() => void pixKeysStore.init()} />
    </>
  );
  return (
    <>
      <Text variant="heading">Escolha a chave Pix</Text>
      {keys.length === 0 ? (
        <Text variant="caption" tone="muted">Nenhuma chave Pix cadastrada. Cadastre uma chave para gerar o código deste pedido.</Text>
      ) : (
        <Text variant="caption" tone="muted">O Pix será gerado com o valor total do pedido e os dados da chave escolhida.</Text>
      )}
      {keys.map((key) => <PixKeyCard key={key.id} recipient={key} onSelect={() => onSelect(key.id)} />)}
      <Button label="Cadastrar chave Pix" variant="secondary" fullWidth onPress={() => router.push("/chave-pix")} />
    </>
  );
}
