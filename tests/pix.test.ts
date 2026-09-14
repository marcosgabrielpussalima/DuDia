import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStaticPix, crc16CCITT, normalizePixKey, type PixKeyType, type StaticPixInput } from "@/src/lib/payments/pix";
import { orderTotal } from "@/src/features/vendas/logic/order";
import { fmtBRL } from "@/src/lib/domain/sales";
import type { Product } from "@/src/types";

// Chave fictícia do exemplo da seção 2.6.3 do manual do Banco Central.
const sample: StaticPixInput = {
  keyType: "random",
  key: "123e4567-e12b-12d1-a456-426655440000",
  amount: 100.5,
  merchantName: "Fulano de Tal",
  merchantCity: "BRASILIA",
};

function parseFields(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let offset = 0;
  while (offset < payload.length) {
    const id = payload.slice(offset, offset + 2);
    const size = Number(payload.slice(offset + 2, offset + 4));
    assert.match(id, /^\d{2}$/);
    assert.ok(size > 0 && offset + 4 + size <= payload.length);
    assert.equal(fields[id], undefined, `Campo duplicado: ${id}`);
    fields[id] = payload.slice(offset + 4, offset + 4 + size);
    offset += 4 + size;
  }
  assert.equal(offset, payload.length);
  return fields;
}

describe("BR Code Pix estático", () => {
  it("confere CRC com vetor padrão e exemplo publicado pelo BCB", () => {
    assert.equal(crc16CCITT("123456789"), "29B1");
    const official = "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D";
    assert.equal(crc16CCITT(official.slice(0, -4)), official.slice(-4));
  });

  it("gera payload completo com valor e CRC conferido por binascii.crc_hqx", () => {
    assert.equal(createStaticPix(sample).payload,
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865406100.505802BR5913Fulano de Tal6008BRASILIA62070503***6304659E");
  });

  it("inclui a chave informada, BRL, país e ausência explícita de txid", () => {
    const pix = createStaticPix({ ...sample, keyType: "email", key: "vendas@example.com", amount: 42.75 });
    const fields = parseFields(pix.payload);
    assert.deepEqual(parseFields(fields["26"]), { "00": "br.gov.bcb.pix", "01": "vendas@example.com" });
    assert.equal(fields["53"], "986");
    assert.equal(fields["54"], "42.75");
    assert.equal(fields["58"], "BR");
    assert.equal(parseFields(fields["62"])["05"], "***");
    assert.equal(fields["01"], undefined);
  });

  it("mantém o total do carrinho para vários produtos, unidades e kg", () => {
    const products: Product[] = [
      { id: "un", name: "Pastel", unit: "un", price: 8.5, stock: 10 },
      { id: "kg", name: "Tomate", unit: "kg", price: 7.99, stock: 10 },
    ];
    const total = orderTotal({ un: 3, kg: 0.375 }, products);
    const pix = createStaticPix({ ...sample, amount: total });
    assert.equal(pix.amount, 28.50);
    assert.equal(parseFields(pix.payload)["54"], "28.50");
    assert.equal(fmtBRL(pix.amount), fmtBRL(total));
  });

  it("usa o mesmo arredondamento do checkout em valores fracionários", () => {
    for (const amount of [0.1 + 0.2, 0.005, 1.005, 7.99 * 0.375, 9999999999.99]) {
      const pix = createStaticPix({ ...sample, amount });
      assert.equal(parseFields(pix.payload)["54"], amount.toFixed(2));
      assert.equal(pix.amount, +amount.toFixed(2));
    }
  });

  it("rejeita total zero, negativo, não finito, subcentavo e acima do limite", () => {
    for (const amount of [0, -1, NaN, Infinity, -Infinity, 0.001, 1e10, 1e21]) {
      assert.throws(() => createStaticPix({ ...sample, amount }), /total/i);
    }
  });

  it("normaliza acentos e limita nome/cidade sem corromper tamanhos TLV", () => {
    const pix = createStaticPix({ ...sample, merchantName: "  João da Conceição de Oliveira ", merchantCity: "São José dos Pinhais" });
    const fields = parseFields(pix.payload);
    assert.equal(fields["59"], "Joao da Conceicao de Oliv");
    assert.equal(fields["60"], "Sao Jose dos Pi");
    assert.doesNotMatch(pix.payload, /[^\x20-\x7E]/);
  });

  it("exige nome e cidade, sem inventar dados do recebedor", () => {
    assert.throws(() => createStaticPix({ ...sample, merchantName: " " }), /nome/);
    assert.throws(() => createStaticPix({ ...sample, merchantCity: "" }), /cidade/);
    assert.throws(() => createStaticPix({ ...sample, merchantName: "🎉" }), /nome/);
  });

  it("aceita a chave de 77 caracteres sem exceder o template 26", () => {
    const key = "a".repeat(64) + "@example.test";
    assert.equal(key.length, 77);
    const fields = parseFields(createStaticPix({ ...sample, keyType: "email", key }).payload);
    assert.equal(fields["26"].length, 99);
    assert.equal(parseFields(fields["26"])["01"], key);
    assert.throws(() => createStaticPix({ ...sample, keyType: "email", key: "a" + key }), /77/);
  });

  it("regenera o valor e o CRC ao alterar o total ou a chave", () => {
    const original = createStaticPix(sample).payload;
    const changed = createStaticPix({ ...sample, amount: 101.5 }).payload;
    assert.notEqual(original, changed);
    assert.notEqual(original.slice(-4), changed.slice(-4));
    assert.equal(parseFields(changed)["54"], "101.50");
    assert.notEqual(original, createStaticPix({ ...sample, keyType: "email", key: "teste@example.com" }).payload);
  });
});

describe("Chaves Pix", () => {
  const valid: [PixKeyType, string, string][] = [
    ["cpf", "529.982.247-25", "52998224725"],
    ["cnpj", "00.038.166/0001-05", "00038166000105"],
    ["cnpj", "12.abc.345/01de-35", "12ABC34501DE35"],
    ["phone", "(61) 91234-5678", "+5561912345678"],
    ["phone", "+55 (61) 91234-5678", "+5561912345678"],
    ["phone", "5561912345678", "+5561912345678"],
    ["phone", "+1 (202) 555-0123", "+12025550123"],
    ["email", "  Vendas@Example.COM  ", "vendas@example.com"],
    ["random", sample.key.toUpperCase(), sample.key],
  ];
  for (const [type, input, expected] of valid) {
    it(`normaliza ${type}: ${input}`, () => assert.equal(normalizePixKey(input, type), expected));
  }

  it("o tipo explícito distingue um CPF de um telefone com 11 dígitos", () => {
    assert.equal(normalizePixKey("52998224725", "cpf"), "52998224725");
    assert.equal(normalizePixKey("52998224725", "phone"), "+5552998224725");
  });

  const invalid: [PixKeyType, string][] = [
    ["cpf", "11111111111"], ["cpf", "52998224724"], ["cpf", "abc52998224725"],
    ["cnpj", "00000000000000"], ["cnpj", "00038166000104"], ["cnpj", "12ABC34501DE34"],
    ["phone", "912345678"], ["phone", "+0061912345678"], ["phone", "+55abc61912345678"],
    ["email", "sem-arroba"], ["email", "x@y"], ["email", "nome com espaco@example.com"],
    ["email", ".nome@example.com"], ["email", "nome..teste@example.com"], ["email", "joão@example.com"],
    ["random", "123e4567e12b12d1a456426655440000"], ["random", "123e4567-e12b-12d1-a456-42665544000z"],
  ];
  for (const [type, input] of invalid) {
    it(`rejeita ${type} inválido: ${input}`, () => assert.throws(() => normalizePixKey(input, type)));
  }
  it("rejeita chave vazia em todos os tipos", () => {
    for (const type of ["cpf", "cnpj", "phone", "email", "random"] as const) {
      assert.throws(() => normalizePixKey(" ", type), /Informe a chave/);
    }
  });
});
