import { normalizePixRecipient, type PixRecipientInput } from "@/src/lib/payments/pix";

export interface SavedPixKey extends PixRecipientInput {
  id: string;
}

export interface PixKeysSnapshot {
  keys: readonly SavedPixKey[];
  status: "loading" | "ready" | "error";
}

interface Persistence {
  read: () => Promise<unknown>;
  write: (keys: readonly SavedPixKey[]) => Promise<void>;
}

function prepare(input: PixRecipientInput): PixRecipientInput {
  const normalized = normalizePixRecipient(input);
  return {
    ...normalized,
    merchantName: input.merchantName.trim().replace(/\s+/g, " "),
    merchantCity: input.merchantCity.trim().replace(/\s+/g, " "),
  };
}

function hydrate(raw: unknown): SavedPixKey[] {
  if (!Array.isArray(raw)) throw new Error("Formato de chaves Pix inválido.");
  const ids = new Set<string>();
  const keys = new Set<string>();
  return raw.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Chave Pix inválida.");
    const row = entry as Record<string, unknown>;
    if (typeof row.id !== "string" || !row.id || typeof row.keyType !== "string"
      || typeof row.key !== "string" || typeof row.merchantName !== "string"
      || typeof row.merchantCity !== "string"
      || !["cpf", "cnpj", "phone", "email", "random"].includes(row.keyType)) {
      throw new Error("Chave Pix inválida.");
    }
    const key = prepare(row as unknown as SavedPixKey);
    if (ids.has(row.id) || keys.has(key.key)) throw new Error("Chave Pix duplicada.");
    ids.add(row.id);
    keys.add(key.key);
    return { ...key, id: row.id };
  });
}

export function createPixKeyStore(
  persistence: Persistence,
  makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
) {
  let snapshot: PixKeysSnapshot = { keys: [], status: "loading" };
  let initialization: Promise<void> | null = null;
  let writes: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();
  const publish = (next: PixKeysSnapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };

  const init = (): Promise<void> => {
    if (snapshot.status === "ready") return Promise.resolve();
    if (initialization) return initialization;
    publish({ ...snapshot, status: "loading" });
    initialization = Promise.resolve().then(() => persistence.read()).then((raw) => {
      publish({ keys: hydrate(raw), status: "ready" });
    }).catch(() => {
      publish({ ...snapshot, status: "error" });
    }).finally(() => { initialization = null; });
    return initialization;
  };

  // Persist before publishing, and serialize writes so rapid actions cannot lose a key.
  const mutate = <T,>(change: (keys: readonly SavedPixKey[]) => { keys: SavedPixKey[]; result: T }): Promise<T> => {
    const operation = writes.then(async () => {
      await init();
      if (snapshot.status !== "ready") throw new Error("Não foi possível carregar suas chaves Pix. Tente novamente.");
      const next = change(snapshot.keys);
      try {
        await persistence.write(next.keys);
      } catch {
        throw new Error("Não foi possível salvar a alteração. Tente novamente.");
      }
      publish({ keys: next.keys, status: "ready" });
      return next.result;
    });
    writes = operation.then(() => undefined, () => undefined);
    return operation;
  };

  return {
    init,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    save(input: PixRecipientInput, id?: string): Promise<SavedPixKey> {
      return mutate((keys) => {
        const prepared = prepare(input);
        if (id && !keys.some((key) => key.id === id)) throw new Error("Esta chave Pix não está mais cadastrada.");
        if (keys.some((key) => key.key === prepared.key && key.id !== id)) {
          throw new Error("Esta chave Pix já está cadastrada. Escolha a chave existente ou edite seus dados no Perfil.");
        }
        const saved = { ...prepared, id: id ?? makeId() };
        if (!id && keys.some((key) => key.id === saved.id)) throw new Error("Não foi possível cadastrar a chave. Tente novamente.");
        return {
          keys: id ? keys.map((key) => key.id === id ? saved : key) : [...keys, saved],
          result: saved,
        };
      });
    },
    remove(id: string): Promise<void> {
      return mutate((keys) => ({ keys: keys.filter((key) => key.id !== id), result: undefined }));
    },
  };
}
