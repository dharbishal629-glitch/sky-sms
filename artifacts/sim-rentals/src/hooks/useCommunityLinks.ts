import { useState, useCallback } from "react";

const DISCORD_KEY = "skysms_discord_link";
const TELEGRAM_KEY = "skysms_telegram_link";

export function useCommunityLinks() {
  const [discord, setDiscordState] = useState<string>(() => localStorage.getItem(DISCORD_KEY) ?? "");
  const [telegram, setTelegramState] = useState<string>(() => localStorage.getItem(TELEGRAM_KEY) ?? "");

  const setDiscord = useCallback((url: string) => {
    localStorage.setItem(DISCORD_KEY, url);
    setDiscordState(url);
  }, []);

  const setTelegram = useCallback((url: string) => {
    localStorage.setItem(TELEGRAM_KEY, url);
    setTelegramState(url);
  }, []);

  return { discord, telegram, setDiscord, setTelegram };
}
