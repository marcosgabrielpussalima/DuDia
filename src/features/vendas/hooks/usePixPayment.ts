import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { createStaticPix, type PixKeyType, type StaticPixPayment } from "@/src/lib/payments/pix";
import { useSettings } from "@/src/lib/storage/settings";
import { feedback } from "@/src/lib/utils/feedback";

export function usePixPayment(total: number) {
  const settings = useSettings();
  const [keyType, setKeyType] = useState<PixKeyType>("cpf");
  const [key, setKey] = useState("");
  const [merchantName, setMerchantName] = useState(settings.ownerName || settings.stallName);
  const [merchantCity, setMerchantCity] = useState("");
  const [payment, setPayment] = useState<StaticPixPayment | null>(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const generate = (): boolean => {
    setError("");
    setCopyMessage("");
    try {
      setPayment(createStaticPix({ keyType, key, amount: total, merchantName, merchantCity }));
      feedback("ok");
      return true;
    } catch (cause) {
      setPayment(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o Pix.");
      feedback("err");
      return false;
    }
  };

  const edit = () => {
    setPayment(null);
    setError("");
    setCopyMessage("");
  };

  const copy = async () => {
    if (!payment) return;
    setError("");
    setCopyMessage("");
    try {
      const copied = await Clipboard.setStringAsync(payment.payload);
      if (!copied) throw new Error("clipboard_unavailable");
      setCopyMessage("Código Pix copiado.");
      feedback("ok");
    } catch {
      setError("Não foi possível copiar. Você pode selecionar o código abaixo e copiá-lo.");
      feedback("err");
    }
  };

  return {
    keyType, setKeyType, key, setKey, merchantName, setMerchantName,
    merchantCity, setMerchantCity, payment, error, copyMessage, generate, edit, copy,
  };
}
