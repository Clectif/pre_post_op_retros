/** Lo mínimo del SDK de Telegram Mini Apps que usa la app. */
interface TelegramWebApp {
  ready(): void;
  expand(): void;
  setHeaderColor?(color: string): void;
  isVersionAtLeast?(version: string): boolean;
  initData?: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string; last_name?: string; username?: string } };
  HapticFeedback?: {
    notificationOccurred(type: "error" | "success" | "warning"): void;
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
  };
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
