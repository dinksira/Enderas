import i18n from 'i18n';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

i18n.configure({
  locales: ['en', 'am'],
  defaultLocale: 'en',
  directory: path.join(__dirname, '../locales'),
  objectNotation: true,
  updateFiles: true,
  syncFiles: true,
  cookie: 'lang',
  queryParameter: 'lang',
  header: 'accept-language',
  api: {
    __: '__',
    __n: '__n',
  },
});

export const i18nMiddleware = i18n.init;

export default i18n;
