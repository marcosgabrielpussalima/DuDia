import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useStore } from "@/src/lib/domain/store";
import { useSettings } from "@/src/lib/storage/settings";
import {
  getNotifiedProductIds,
  setNotifiedProductIds,
} from "@/src/lib/storage/notificationState";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export function useLowStockNotifications(): void {
  const { products } = useStore();
  const settings = useSettings();

  useEffect(() => {
    if (!settings.notifications || Platform.OS !== "android") return;

    let active = true;
    async function syncAlerts() {
      const permission = await Notifications.getPermissionsAsync();
      const granted = permission.granted
        ? permission
        : await Notifications.requestPermissionsAsync();
      if (!granted.granted || !active) return;

      await Notifications.setNotificationChannelAsync("low-stock", {
        name: "Estoque baixo",
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      const notified = new Set(await getNotifiedProductIds());
      const currentlyLow = new Set<string>();
      for (const product of products) {
        const threshold = product.minStock ?? settings.lowStockThreshold;
        if (product.stock > threshold) continue;
        currentlyLow.add(product.id);
        if (notified.has(product.id)) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Estoque baixo",
            body: `${product.name} chegou a ${product.stock}${product.unit}. Mínimo: ${threshold}${product.unit}.`,
            data: { productId: product.id },
          },
          trigger: null,
        });
      }

      if (active) await setNotifiedProductIds([...currentlyLow]);
    }

    void syncAlerts();
    return () => {
      active = false;
    };
  }, [products, settings.lowStockThreshold, settings.notifications]);
}
