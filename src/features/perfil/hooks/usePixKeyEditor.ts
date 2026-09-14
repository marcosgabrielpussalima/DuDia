import { useEffect, useRef, useState } from "react";
import type { SavedPixKey } from "@/src/lib/domain/pixKeys";
import type { PixKeyType } from "@/src/lib/payments/pix";
import { pixKeysStore } from "@/src/lib/storage/pixKeys";
import { useSettings } from "@/src/lib/storage/settings";
import { feedback } from "@/src/lib/utils/feedback";

export function usePixKeyEditor(initial?: SavedPixKey) {
  const settings = useSettings();
  const [keyType, setKeyType] = useState<PixKeyType>(initial?.keyType ?? "cpf");
  const [key, setKey] = useState(initial?.key ?? "");
  const [merchantName, setMerchantName] = useState(initial?.merchantName ?? (settings.ownerName || settings.stallName));
  const [merchantCity, setMerchantCity] = useState(initial?.merchantCity ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const save = async (): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await pixKeysStore.save({ keyType, key, merchantName, merchantCity }, initial?.id);
      if (!mounted.current) return false;
      feedback("ok");
      return true;
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "Não foi possível salvar a chave Pix.");
        feedback("err");
      }
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return { keyType, setKeyType, key, setKey, merchantName, setMerchantName, merchantCity, setMerchantCity, saving, error, save };
}
