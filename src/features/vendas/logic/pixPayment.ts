import type { SavedPixKey } from "@/src/lib/domain/pixKeys";
import type { StaticPixPayment } from "@/src/lib/payments/pix";

export interface GeneratedPixPayment {
  recipient: SavedPixKey;
  payment: StaticPixPayment;
}

export function currentPixPayment(
  generated: GeneratedPixPayment | null,
  keys: readonly SavedPixKey[],
  total: number,
): StaticPixPayment | null {
  if (!generated || !Number.isFinite(total) || generated.payment.amount.toFixed(2) !== total.toFixed(2)) return null;
  const saved = keys.find((key) => key.id === generated.recipient.id);
  if (!saved || saved.keyType !== generated.recipient.keyType || saved.key !== generated.recipient.key
    || saved.merchantName !== generated.recipient.merchantName || saved.merchantCity !== generated.recipient.merchantCity) return null;
  return generated.payment;
}
