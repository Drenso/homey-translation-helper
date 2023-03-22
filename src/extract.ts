import {stringify} from 'csv-stringify';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import {translationFiles} from './functions';
import {parseLocales} from './locales';
import {JsonType, Translations} from './types';

function mergeTranslations(a: Translations, b: Translations): Translations {
  return _.merge(a, b);
}

function walkJson(jsonData: JsonType): Translations {
  let result: Translations = {};

  if (Array.isArray(jsonData)) {
    jsonData.forEach(item => {
      result = mergeTranslations(result, walkJson(item));
    });

    return result;
  }

  if (typeof jsonData !== 'object' || jsonData === null) {
    return {};
  }

  const jsonKeys = Object.keys(jsonData);
  if (jsonKeys.includes('en')) {
    // We will assume this is a translations object
    const translation = jsonData['en'];
    result[translation] = {};
    jsonKeys.forEach((jsonKey) => {
      if (jsonKey === 'en') {
        return;
      }

      result[translation][jsonKey] = jsonData[jsonKey];
    });

    return result;
  }

  // Recursively walk the json data
  jsonKeys.forEach(jsonKey => {
    result = mergeTranslations(result, walkJson(jsonData[jsonKey]));
  });

  return result;
}

function retrieveFromJson(jsonPath: string): Translations {
  if (!fs.existsSync(jsonPath)) {
    console.warn('Path does not exist', jsonPath);
    return {};
  }

  console.log('Reading', jsonPath);
  return walkJson(JSON.parse(fs.readFileSync(jsonPath).toString()));
}

export default function execute(
  projectPath: string,
  locales: string[],
  outFile: string,
  includeChangelog: boolean,
  delimiter: string,
): void {
  locales = parseLocales(locales);

  projectPath = path.resolve(projectPath);
  console.log('Parsing translations from Homey project in', projectPath);

  let translations: Translations = {};
  translationFiles(projectPath, includeChangelog)
    .forEach(file => translations = mergeTranslations(translations, retrieveFromJson(file)));

  outFile = path.resolve(path.join(path.dirname(require.main?.filename ?? __dirname), outFile));
  console.log('Writing result to', outFile);

  if (fs.existsSync(outFile)) {
    fs.rmSync(outFile);
  }
  const outStream = fs.createWriteStream(outFile);

  const stringifier = stringify({
    delimiter: delimiter,
    header: true,
    columns: ['Translation key', ...locales],
    bom: true,
    encoding: 'utf8',
  });

  Object.keys(translations).sort().forEach((translation) => {
    stringifier.write([translation, ...locales.map(locale => translations[translation][locale] ?? null)])
  });

  stringifier.pipe(outStream);
  stringifier.end();
  outStream.close();
}
