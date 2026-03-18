"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("LanguageSwitcher");
  const [isPending, startTransition] = useTransition();

  const otherLocale = locale === "en" ? "de" : "en";
  const label = locale === "en" ? "DE" : "EN";

  function handleSwitch() {
    startTransition(() => {
      router.replace(pathname, { locale: otherLocale });
    });
  }

  return (
    <button
      onClick={handleSwitch}
      disabled={isPending}
      className="px-2.5 py-1.5 text-sm font-semibold rounded-lg bg-lvb-dark text-white hover:bg-lvb-dark/80 dark:bg-white dark:text-lvb-dark dark:hover:bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lvb-dark dark:focus:ring-white disabled:opacity-50"
      title={otherLocale === "de" ? t("switchToDe") : t("switchToEn")}
    >
      {isPending ? "..." : label}
    </button>
  );
}
