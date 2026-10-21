import { useCallback, useEffect, useState } from "react";
import type { Operator } from "../types";

const ANONYMOUS: Operator = { telegram_id: null, nombre: "Sin identificar", username: null };

interface TelegramIdentity {
  operator: Operator;
  /** Credencial firmada que el backend verifica; vacía fuera de Telegram. */
  initData: string;
}

function readIdentity(): TelegramIdentity {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const initData = window.Telegram?.WebApp?.initData || "";
  if (!user) return { operator: ANONYMOUS, initData };
  return {
    initData,
    operator: {
      telegram_id: user.id,
      nombre: [user.first_name, user.last_name].filter(Boolean).join(" "),
      username: user.username || null,
    },
  };
}

/** Identidad de Telegram (el SDK se carga en el layout) y vibración háptica. */
export function useTelegram() {
  const [identity] = useState<TelegramIdentity>(readIdentity);

  useEffect(() => {
    try {
      const tg = window.Telegram?.WebApp;
      tg?.ready();
      tg?.expand();
      if (tg?.isVersionAtLeast?.("6.1")) tg.setHeaderColor?.("#eef0f3"); // versiones anteriores solo avisan en consola
    } catch {
      /* fuera de Telegram no hay nada que preparar */
    }
  }, []);

  const haptic = useCallback((kind: "ok" | "tap" = "tap") => {
    try {
      const tg = window.Telegram?.WebApp;
      const h = tg?.HapticFeedback;
      if (!h || !tg?.isVersionAtLeast?.("6.1")) return;
      if (kind === "ok") h.notificationOccurred("success");
      else h.impactOccurred("light");
    } catch {
      /* ignorado */
    }
  }, []);

  return { operator: identity.operator, initData: identity.initData, haptic };
}
