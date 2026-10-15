import { LOGO } from "./paths";
import { useState } from "react";

const supported = typeof window !== "undefined" && "Notification" in window;

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : "denied",
  );

  const request = async () => {
    if (!supported) return;
    setPermission(await Notification.requestPermission());
  };

  const send = (title: string, body: string) => {
    if (supported && Notification.permission === "granted") {
      new Notification(title, { body, icon: LOGO });
    }
  };

  return { permission, supported, request, send };
}
