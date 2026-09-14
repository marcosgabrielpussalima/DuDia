import { useMemo } from "react";
import { StyleSheet, View, type KeyboardTypeOptions } from "react-native";
import { Chip, Input, Text } from "@/src/components/ui";
import type { PixKeyType } from "@/src/lib/payments/pix";
import { useTheme, type Tokens } from "@/src/theme";

interface Props {
  keyType: PixKeyType;
  onKeyTypeChange: (type: PixKeyType) => void;
  pixKey: string;
  onKeyChange: (key: string) => void;
  merchantName: string;
  onNameChange: (name: string) => void;
  merchantCity: string;
  onCityChange: (city: string) => void;
}

const KEY_OPTIONS: { value: PixKeyType; label: string; placeholder: string; keyboard: KeyboardTypeOptions }[] = [
  { value: "cpf", label: "CPF", placeholder: "CPF do recebedor", keyboard: "number-pad" },
  { value: "cnpj", label: "CNPJ", placeholder: "CNPJ do recebedor", keyboard: "default" },
  { value: "phone", label: "Telefone", placeholder: "(61) 91234-5678", keyboard: "phone-pad" },
  { value: "email", label: "E-mail", placeholder: "nome@exemplo.com", keyboard: "email-address" },
  { value: "random", label: "Aleatória", placeholder: "Cole a chave aleatória", keyboard: "default" },
];

export function PixKeyForm(props: Props) {
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const selected = KEY_OPTIONS.find((option) => option.value === props.keyType)!;

  return (
    <View style={styles.form}>
      <Text variant="overline" tone="muted">Tipo da chave Pix</Text>
      <View style={styles.types}>
        {KEY_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={props.keyType === option.value}
            onPress={() => props.onKeyTypeChange(option.value)}
            style={styles.type}
          />
        ))}
      </View>
      <Input
        label="Chave Pix do recebedor"
        placeholder={selected.placeholder}
        keyboardType={selected.keyboard}
        autoCapitalize="none"
        autoCorrect={false}
        value={props.pixKey}
        onChangeText={props.onKeyChange}
        hint={props.keyType === "phone"
          ? "Número brasileiro: inclua o DDD. Outros países: use + e o código do país."
          : "Use uma chave já cadastrada no banco de quem vai receber."}
      />
      <Input
        label="Nome do recebedor"
        placeholder="Nome de quem vai receber"
        autoCapitalize="words"
        value={props.merchantName}
        onChangeText={props.onNameChange}
      />
      <Input
        label="Cidade da venda"
        placeholder="Ex.: Recife"
        autoCapitalize="words"
        value={props.merchantCity}
        onChangeText={props.onCityChange}
      />
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    form: { gap: t.spacing.sm },
    types: { flexDirection: "row", flexWrap: "wrap", gap: t.spacing.sm },
    type: { minHeight: 48, minWidth: 48 },
  });
}
