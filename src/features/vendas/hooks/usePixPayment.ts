import { useEffect, useRef, useState } from "react";
import * as Clipboard from "expo-clipboard";
import type { SavedPixKey } from "@/src/lib/domain/pixKeys";
import { createStaticPix } from "@/src/lib/payments/pix";
import { pixKeysStore } from "@/src/lib/storage/pixKeys";
import { currentPixPayment, type GeneratedPixPayment } from "@/src/features/vendas/logic/pixPayment";
import { feedback } from "@/src/lib/utils/feedback";

export function usePixPayment(total: number, keys: readonly SavedPixKey[]) {
  const [generated, setGenerated] = useState<GeneratedPixPayment | null>(null);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const payment = currentPixPayment(generated, keys, total);
  const current = useRef(payment);
  current.current = payment;
  useEffect(() => () => { current.current = null; }, []);

  const generate = (id: string): boolean => {
    setError("");
    setCopyMessage("");
    try {
      const snapshot = pixKeysStore.getSnapshot();
      const recipient = snapshot.status === "ready" ? snapshot.keys.find((key) => key.id === id) : undefined;
      if (!recipient) throw new Error("Esta chave Pix não está disponível. Escolha outra chave ou cadastre uma nova.");
      const next = createStaticPix({ ...recipient, amount: total });
      current.current = next;
      setGenerated({ recipient, payment: next });
      feedback("ok");
      return true;
    } catch (cause) {
      current.current = null;
      setGenerated(null);
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o Pix.");
      feedback("err");
      return false;
    }
  };

  const clear = () => {
    current.current = null;
    setGenerated(null);
    setError("");
    setCopyMessage("");
  };

  const copy = async () => {
    const selected = current.current;
    if (!selected) return;
    setError("");
    setCopyMessage("");
    try {
      const copied = await Clipboard.setStringAsync(selected.payload);
      if (current.current !== selected) return;
      if (!copied) throw new Error("clipboard_unavailable");
      setCopyMessage("Código Pix copiado.");
      feedback("ok");
    } catch {
      if (current.current !== selected) return;
      setError("Não foi possível copiar. Você pode selecionar o código abaixo e copiá-lo.");
      feedback("err");
    }
  };

  return { payment, error, copyMessage, generate, clear, copy };
}
