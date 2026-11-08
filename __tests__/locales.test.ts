/** Locale files stay in sync (same keys, same placeholders) and every message parses as ICU. */
import IntlMessageFormat from 'intl-messageformat';
import en from '../src/i18n/locales/en.json';
import ru from '../src/i18n/locales/ru.json';
import uk from '../src/i18n/locales/uk.json';

function flatten(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  return Object.entries(obj).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') Object.assign(acc, flatten(value as Record<string, unknown>, path));
    else acc[path] = String(value);
    return acc;
  }, {});
}

const locales = { uk: flatten(uk), en: flatten(en), ru: flatten(ru) };

/** Top-level ICU argument names (`{name}`, `{count, plural, …}`), ignoring text inside plural branches. */
function args(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\s*([a-zA-Z_]\w*)\s*[,}]/g)].map(m => m[1]))].sort();
}

test.each(['en', 'ru'] as const)('%s has exactly the same keys as uk', lang => {
  const missing = Object.keys(locales.uk).filter(k => !(k in locales[lang]));
  const extra = Object.keys(locales[lang]).filter(k => !(k in locales.uk));
  expect({ missing, extra }).toEqual({ missing: [], extra: [] });
});

test.each(['en', 'ru'] as const)('%s uses the same placeholders as uk', lang => {
  const mismatched = Object.keys(locales.uk).filter(
    k => JSON.stringify(args(locales.uk[k])) !== JSON.stringify(args(locales[lang][k] ?? '')),
  );
  expect(mismatched).toEqual([]);
});

test.each(['uk', 'en', 'ru'] as const)('every %s message is valid ICU', lang => {
  const broken = Object.entries(locales[lang]).filter(([, msg]) => {
    try {
      return !new IntlMessageFormat(msg, lang).format;
    } catch {
      return true;
    }
  });
  expect(broken.map(([k]) => k)).toEqual([]);
});

test('no empty translations', () => {
  for (const lang of ['uk', 'en', 'ru'] as const) {
    expect(
      Object.entries(locales[lang])
        .filter(([, v]) => !v.trim())
        .map(([k]) => k),
    ).toEqual([]);
  }
});
