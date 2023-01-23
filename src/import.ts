import {parse} from 'csv-parse';
import fs from 'fs';
import path from 'path';
import {translationFiles} from './functions';
import {JsonType, Translations} from './types';

export default function execute(projectPath: string, locales: string[], inFile: string): void {

  inFile = path.resolve(path.join(path.dirname(require.main?.filename ?? __dirname), inFile));
  console.log('Reading translations from', inFile);
  if (!fs.existsSync(inFile)) {
    console.error('Input file does not exist?!');
    return;
  }

  const translations: Translations = {};

  fs.createReadStream(inFile)
    .pipe(parse({
      delimiter: ';',
      trim: true,
      columns: record => record.map((r: string) => {
        if (r.trim().toLowerCase() === 'translation key') {
          return 'key';
        }

        return r;
      }),
    }))
    .on('data', (data) => {
      translations[data.key] = data;
    })
    .on('end', () => {
      projectPath = path.resolve(projectPath);
      console.log('Importing translations into Homey project in', projectPath);

      translationFiles(projectPath)
        .forEach((file) => importTranslations(file, locales, translations));
    });
}

function importTranslations(jsonPath: string, locales: string[], translations: Translations): void {
  if (!fs.existsSync(jsonPath)) {
    console.warn('Path does not exist', jsonPath);
    return;
  }

  console.log('Reading', jsonPath);
  const json = walkJson(JSON.parse(fs.readFileSync(jsonPath).toString()), locales, translations);

  console.log('Writing', jsonPath);
  fs.writeFileSync(jsonPath, JSON.stringify(json, undefined, 2) + '\n')
}

function walkJson(jsonData: JsonType, locales: string[], translations: Translations): JsonType {
  if (Array.isArray(jsonData)) {
    jsonData.forEach((value, index) => {
      jsonData[index] = walkJson(jsonData[index], locales, translations);
    });
  } else if (typeof jsonData === 'object') {
    const jsonKeys = Object.keys(jsonData);
    if (jsonKeys.includes('en')) {
      // We assume it is a translations object
      const translation = translations[jsonData['en']];
      if (translation) {
        Object.keys(translation).forEach((locale) => {
          if (locale === 'en') {
            return;
          }

          if (!locales.includes(locale)) {
            return;
          }

          if (!translation[locale]) {
            return;
          }

          jsonData[locale] = translation[locale];
        });
      }
    } else {
      jsonKeys.forEach((jsonKey) => {
        jsonData[jsonKey] = walkJson(jsonData[jsonKey], locales, translations);
      })
    }
  }

  return jsonData;
}
