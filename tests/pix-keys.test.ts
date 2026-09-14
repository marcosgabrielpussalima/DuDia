import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPixKeyStore, type SavedPixKey } from "@/src/lib/domain/pixKeys";
import { createStaticPix, type PixRecipientInput } from "@/src/lib/payments/pix";
import { currentPixPayment } from "@/src/features/vendas/logic/pixPayment";

const recipient: PixRecipientInput = {
  keyType: "email", key: "vendas@example.com", merchantName: "João da Feira", merchantCity: "São Paulo",
};

function fixture(initial: unknown = []) {
  let persisted = JSON.stringify(initial);
  let id = 0;
  let readFailure = false;
  let writeFailure = false;
  let writes = 0;
  const persistence = {
    read: async (): Promise<unknown> => {
      if (readFailure) throw new Error("read_failed");
      return JSON.parse(persisted) as unknown;
    },
    write: async (keys: readonly SavedPixKey[]) => {
      writes += 1;
      if (writeFailure) throw new Error("write_failed");
      persisted = JSON.stringify(keys);
    },
  };
  return {
    store: createPixKeyStore(persistence, () => `key-${++id}`),
    reopen: () => createPixKeyStore(persistence),
    failRead: (fail: boolean) => { readFailure = fail; },
    failWrite: (fail: boolean) => { writeFailure = fail; },
    writeCount: () => writes,
  };
}

describe("Chaves Pix salvas", () => {
  it("inicia sem chaves e restaura os dados após reabrir o aplicativo", async () => {
    const { store, reopen } = fixture();
    await store.init();
    assert.deepEqual(store.getSnapshot(), { status: "ready", keys: [] });
    const saved = await store.save({ ...recipient, key: " VENDAS@EXAMPLE.COM ", merchantName: " João  da Feira " });
    assert.equal(saved.key, "vendas@example.com");
    assert.equal(saved.merchantName, "João da Feira");
    const next = reopen();
    await next.init();
    assert.deepEqual(next.getSnapshot().keys, [saved]);
    const pix = createStaticPix({ ...next.getSnapshot().keys[0], amount: 18.75 });
    assert.equal(pix.amount, 18.75);
    assert.equal(pix.key, saved.key);
    assert.equal(pix.merchantCity, "Sao Paulo");
  });

  for (const [keyType, first, duplicate] of [
    ["email", "vendas@example.com", " VENDAS@EXAMPLE.COM "],
    ["phone", "(61) 91234-5678", "+5561912345678"],
    ["cpf", "529.982.247-25", "52998224725"],
    ["random", "123e4567-e12b-12d1-a456-426655440000", "123E4567-E12B-12D1-A456-426655440000"],
  ] as const) {
    it(`impede duplicação por formatação de ${keyType}`, async () => {
      const { store, writeCount } = fixture();
      await store.save({ ...recipient, keyType, key: first });
      await assert.rejects(store.save({ ...recipient, keyType, key: duplicate, merchantName: "Outro nome" }), /já está cadastrada/);
      assert.equal(store.getSnapshot().keys.length, 1);
      assert.equal(writeCount(), 1);
    });
  }

  it("valida a chave, o nome e a cidade antes de gravar", async () => {
    const { store, writeCount } = fixture();
    for (const input of [{ ...recipient, key: "inválida" }, { ...recipient, merchantName: " " }, { ...recipient, merchantCity: "" }]) {
      await assert.rejects(store.save(input));
    }
    assert.equal(writeCount(), 0);
    assert.deepEqual(store.getSnapshot().keys, []);
  });

  it("edita mantendo o identificador e persiste os novos dados", async () => {
    const { store, reopen } = fixture();
    const saved = await store.save(recipient);
    const edited = await store.save({ ...recipient, key: "caixa@example.com", merchantCity: "Recife" }, saved.id);
    assert.equal(saved.id, edited.id);
    assert.equal(store.getSnapshot().keys.length, 1);
    const next = reopen();
    await next.init();
    assert.deepEqual(next.getSnapshot().keys, [edited]);
  });

  it("recusa uma edição que duplique outra chave e uma chave removida", async () => {
    const { store } = fixture();
    const first = await store.save(recipient);
    const second = await store.save({ ...recipient, key: "outra@example.com" });
    await assert.rejects(store.save(recipient, second.id), /já está cadastrada/);
    await store.remove(first.id);
    await assert.rejects(store.save(recipient, first.id), /não está mais cadastrada/);
    assert.deepEqual(store.getSnapshot().keys, [second]);
  });

  it("exclui apenas a chave escolhida e mantém a exclusão após reabrir", async () => {
    const { store, reopen } = fixture();
    const first = await store.save(recipient);
    const second = await store.save({ ...recipient, key: "outra@example.com" });
    await store.remove(first.id);
    const next = reopen();
    await next.init();
    assert.deepEqual(next.getSnapshot().keys, [second]);
  });

  it("serializa cadastros concorrentes sem perder entradas", async () => {
    const { store, reopen } = fixture();
    const saved = await Promise.all(["um", "dois", "tres"].map((name) => store.save({ ...recipient, key: `${name}@example.com` })));
    const next = reopen();
    await next.init();
    assert.deepEqual(next.getSnapshot().keys, saved);
    assert.equal(new Set(saved.map((key) => key.id)).size, 3);
  });

  it("só disponibiliza o cadastro após a persistência e bloqueia duplo salvamento", async () => {
    let finish: () => void = () => {};
    const gate = new Promise<void>((resolve) => { finish = resolve; });
    let started: () => void = () => {};
    const writing = new Promise<void>((resolve) => { started = resolve; });
    const store = createPixKeyStore({ read: async () => [], write: async () => { started(); await gate; } });
    const first = store.save(recipient);
    const duplicate = store.save(recipient);
    const rejected = assert.rejects(duplicate, /já está cadastrada/);
    await writing;
    assert.equal(store.getSnapshot().keys.length, 0);
    finish();
    await first;
    await rejected;
    assert.equal(store.getSnapshot().keys.length, 1);
  });

  it("falha de gravação não cria chave fantasma e permite tentar novamente", async () => {
    const { store, failWrite, reopen } = fixture();
    failWrite(true);
    await assert.rejects(store.save(recipient), /salvar/);
    assert.equal(store.getSnapshot().keys.length, 0);
    failWrite(false);
    const saved = await store.save(recipient);
    const next = reopen();
    await next.init();
    assert.deepEqual(next.getSnapshot().keys, [saved]);
  });

  it("falha ao editar ou excluir preserva a chave já salva", async () => {
    const { store, failWrite, reopen } = fixture();
    const saved = await store.save(recipient);
    failWrite(true);
    await assert.rejects(store.save({ ...recipient, key: "novo@example.com" }, saved.id), /salvar/);
    await assert.rejects(store.remove(saved.id), /salvar/);
    assert.deepEqual(store.getSnapshot().keys, [saved]);
    const next = reopen();
    await next.init();
    assert.deepEqual(next.getSnapshot().keys, [saved]);
  });

  it("falha de leitura impede sobrescrever dados existentes e permite recuperação", async () => {
    const initial = { ...recipient, id: "existing" };
    const { store, failRead, writeCount } = fixture([initial]);
    failRead(true);
    await store.init();
    assert.equal(store.getSnapshot().status, "error");
    await assert.rejects(store.save({ ...recipient, key: "outra@example.com" }), /carregar/);
    assert.equal(writeCount(), 0);
    failRead(false);
    await store.init();
    assert.deepEqual(store.getSnapshot(), { status: "ready", keys: [initial] });
  });

  it("não substitui silenciosamente uma lista inválida ou duplicada", async () => {
    const valid = { ...recipient, id: "existing" };
    for (const raw of [{}, [null], [{ ...valid, keyType: "invalid" }], [valid, { ...valid, id: "duplicate" }]]) {
      const { store, writeCount } = fixture(raw);
      await store.init();
      assert.equal(store.getSnapshot().status, "error");
      await assert.rejects(store.save(recipient), /carregar/);
      assert.equal(writeCount(), 0);
    }
  });

  it("avisa os assinantes sobre cadastros, edições e exclusões concluídas", async () => {
    const { store } = fixture();
    await store.init();
    let events = 0;
    const unsubscribe = store.subscribe(() => { events += 1; });
    const saved = await store.save(recipient);
    await store.save({ ...recipient, merchantCity: "Recife" }, saved.id);
    await store.remove(saved.id);
    assert.equal(events, 3);
    unsubscribe();
    await store.save(recipient);
    assert.equal(events, 3);
  });
});

describe("QR com chave salva", () => {
  const saved: SavedPixKey = { ...recipient, id: "selected" };
  const payment = createStaticPix({ ...saved, amount: 28.5 });
  const generated = { recipient: saved, payment };

  it("reutiliza a chave com o total atual e aceita arredondamento de centavos", () => {
    assert.equal(currentPixPayment(generated, [saved], 28.5), payment);
    assert.equal(currentPixPayment(generated, [saved], 28.5001), payment);
    assert.equal(currentPixPayment(null, [saved], 28.5), null);
  });

  it("descarta um QR quando o total muda ou fica inválido", () => {
    for (const total of [28.51, 0, -1, NaN, Infinity]) assert.equal(currentPixPayment(generated, [saved], total), null);
  });

  it("descarta o QR se a chave for excluída ou seus dados forem editados", () => {
    assert.equal(currentPixPayment(generated, [], 28.5), null);
    for (const patch of [{ key: "outro@example.com" }, { merchantName: "Outra Banca" }, { merchantCity: "Recife" }, { id: "replaced" }]) {
      assert.equal(currentPixPayment(generated, [{ ...saved, ...patch }], 28.5), null);
    }
  });

  it("mantém o QR ao cadastrar ou excluir outra chave", () => {
    assert.equal(currentPixPayment(generated, [saved, { ...saved, id: "other", key: "outro@example.com" }], 28.5), payment);
    assert.equal(currentPixPayment(generated, [saved], 28.5), payment);
  });
});
