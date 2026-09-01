import { storageGet, storageSet } from "@/src/lib/storage/storage";

const KEY = "feira:low-stock-notified";

export async function getNotifiedProductIds(): Promise<string[]> {
  return storageGet<string[]>(KEY, []);
}

export async function setNotifiedProductIds(ids: string[]): Promise<void> {
  await storageSet(KEY, ids);
}
