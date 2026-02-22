

# Kodstädning inför publicering av repo

## Vad som ska göras

Ta bort oanvänd kod och filer för att göra repot renare och mer professionellt -- utan att ändra någon funktionalitet.

## Ändringar

### 1. Ta bort oanvända filer
- **`src/data/articles-old.ts`** -- en 1243 rader lång fil med hårdkodade artiklar som inte importeras någonstans. Troligen en rest från innan artiklarna flyttades till databasen.
- **`src/App.css`** -- Vites standardmall-CSS (`.logo`, `.read-the-docs` etc.) som aldrig importeras.
- **`src/hooks/useDocumentTitle.ts`** -- En hook som definieras men aldrig används av någon komponent.

### 2. Rensa bort extra tomrader i Admin.tsx
Några ställen med dubbla/trippla tomrader som ser slarviga ut.

## Vad som INTE ändras (och varför)
- **`font-heading`** i Tailwind-klasser -- Används på många ställen. Att ändra riskerar att påverka utseendet. Fungerar i praktiken via CSS-fallback.
- **Dubbla toast-system** (sonner + radix) -- Båda används aktivt på olika ställen. Att konsolidera kräver genomgång av alla toast-anrop och kan ändra beteende/utseende.
- **shadcn/ui-komponenter** som eventuellt inte används -- De är standard och skadar inte.

## Teknisk information
- Tre filer tas bort helt
- En fil (Admin.tsx) får kosmetiska whitespace-ändringar
- Ingen funktionalitet påverkas

