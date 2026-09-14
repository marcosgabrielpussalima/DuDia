export type PixKeyType = "cpf" | "cnpj" | "phone" | "email" | "random";

export interface StaticPixInput {
  keyType: PixKeyType;
  key: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
}

export interface StaticPixPayment {
  payload: string;
  key: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
}

const MAX_KEY_LENGTH = 77;

function mod11Digit(value: string, weights: number[]): string {
  // O CNPJ alfanumérico usa o valor ASCII de cada caractere menos 48.
  const sum = weights.reduce((acc, weight, i) => acc + (value.charCodeAt(i) - 48) * weight, 0);
  const remainder = sum % 11;
  return String(remainder < 2 ? 0 : 11 - remainder);
}

export function normalizePixKey(raw: string, type: PixKeyType): string {
  const value = raw.trim();
  if (!value) throw new Error("Informe a chave Pix de quem vai receber.");

  switch (type) {
    case "cpf": {
      if (!/^(?:\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/.test(value)) {
        throw new Error("Informe um CPF com 11 dígitos.");
      }
      const key = value.replace(/[.-]/g, "");
      const first = mod11Digit(key, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
      const second = mod11Digit(key, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
      if (/^(\d)\1+$/.test(key) || key.slice(-2) !== first + second) {
        throw new Error("CPF inválido. Confira os dígitos da chave Pix.");
      }
      return key;
    }
    case "cnpj": {
      const upper = value.toUpperCase();
      if (!/^(?:[A-Z0-9]{12}\d{2}|[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2})$/.test(upper)) {
        throw new Error("Informe um CNPJ com 14 caracteres.");
      }
      const key = upper.replace(/[./-]/g, "");
      const first = mod11Digit(key, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
      const second = mod11Digit(key, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
      if (/^(\d)\1+$/.test(key) || key.slice(-2) !== first + second) {
        throw new Error("CNPJ inválido. Confira os dígitos da chave Pix.");
      }
      return key;
    }
    case "phone": {
      if (!/^\+?[\d ()-]+$/.test(value)) {
        throw new Error("Informe o telefone com DDD, ou + e o código do país.");
      }
      let key = value.replace(/[ ()-]/g, "");
      if (/^\d{10,11}$/.test(key)) key = `+55${key}`;
      else if (/^55\d{10,11}$/.test(key)) key = `+${key}`;
      if (!/^\+[1-9]\d{7,14}$/.test(key)) {
        throw new Error("Telefone inválido. Use DDD + número ou o formato +5561912345678.");
      }
      return key;
    }
    case "email": {
      const key = value.toLowerCase();
      if (key.length > MAX_KEY_LENGTH) {
        throw new Error("Para gerar este QR Code, use uma chave de até 77 caracteres.");
      }
      if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(key)) {
        throw new Error("Informe um e-mail válido como chave Pix.");
      }
      const local = key.split("@")[0];
      if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
        throw new Error("Informe um e-mail válido como chave Pix.");
      }
      return key;
    }
    case "random": {
      const key = value.toLowerCase();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)) {
        throw new Error("Cole a chave aleatória completa, incluindo os hífens.");
      }
      return key;
    }
    default:
      throw new Error("Selecione o tipo da chave Pix.");
  }
}

function normalizeMerchantField(raw: string, label: string, maxLength: number): string {
  const value = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "").replace(/\s+/g, " ").trim();
  if (!/[A-Za-z0-9]/.test(value)) throw new Error(`Informe ${label}.`);
  return value.slice(0, maxLength).trim();
}

function field(id: string, value: string): string {
  if (!value.length || value.length > 99 || /[^\x20-\x7E]/.test(value)) {
    throw new Error("Não foi possível montar os dados do Pix.");
  }
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

export function crc16CCITT(value: string): string {
  let crc = 0xffff;
  for (let i = 0; i < value.length; i += 1) {
    crc ^= value.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createStaticPix(input: StaticPixInput): StaticPixPayment {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("O total da venda precisa ser maior que zero para gerar Pix.");
  }
  // Usa o mesmo arredondamento do checkout e do registro da venda, inclusive para kg.
  const amountText = input.amount.toFixed(2);
  const amount = Number(amountText);
  if (amount <= 0 || amountText.length > 13 || !/^\d+\.\d{2}$/.test(amountText)) {
    throw new Error("O total da venda está fora do valor permitido para este Pix.");
  }
  const key = normalizePixKey(input.key, input.keyType);
  const merchantName = normalizeMerchantField(input.merchantName, "o nome do recebedor", 25);
  const merchantCity = normalizeMerchantField(input.merchantCity, "a cidade da venda", 15);

  // BR Code: template 26 sem descrição (permite chave de até 77 caracteres).
  // *** indica ausência de txid; não há conciliação bancária automática neste fluxo.
  const payload = field("00", "01")
    + field("26", field("00", "br.gov.bcb.pix") + field("01", key))
    + field("52", "0000") + field("53", "986") + field("54", amountText)
    + field("58", "BR") + field("59", merchantName) + field("60", merchantCity)
    + field("62", field("05", "***")) + "6304";

  return { payload: payload + crc16CCITT(payload), key, amount, merchantName, merchantCity };
}
