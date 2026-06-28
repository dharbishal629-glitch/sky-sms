---
name: Language System
description: How the i18n/translation system is structured in sim-rentals — what's exported and how to extend it.
---

The language system lives entirely in `artifacts/sim-rentals/src/hooks/useLanguage.tsx`.

**What's exported:**
- `LangCode` — string union type: `"en" | "hi" | "de" | "ru" | "fr"`
- `Language` — interface with `{ code, flag, label, nativeName }`
- `LANGUAGES` — array of `Language` objects (one per supported language)
- `LanguageProvider` — React context provider; must wrap the app in `main.tsx`
- `useLanguage()` — returns `{ lang, setLang, t, current }`

**Translation data:** Inline `T` object (Record<LangCode, Record<string, string>>) — all keys for all 5 languages in one file. No separate translations file needed.

**How to use in a page:** `const { t } = useLanguage();` then `t("keyName")`.

**Why:** Do NOT create a separate `translations.ts` file — it will export a conflicting `Language` type that shadows the `Language` interface from `useLanguage.tsx` and causes cascading TypeScript errors in Layout.tsx and elsewhere.
