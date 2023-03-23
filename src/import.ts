import {parse} from 'csv-parse/sync';
import fs from 'fs';
import {set as pathSet} from 'lodash';
import path from 'path';
import {translationFiles} from './functions';
import {parseLocales} from './locales';
import {CSVType, JsonType, Translations} from './types';

export default function execute(
  projectPath: string,
  locales: string[],
  inFile: string,
  delimiter: string
): void {
  locales = parseLocales(locales);

  inFile = path.resolve(path.join(path.dirname(require.main?.filename ?? __dirname), inFile));
  console.log('Reading translations from', inFile);
  if (!fs.existsSync(inFile)) {
    console.error('Input file does not exist?!');
    return;
  }

  const translations: Translations = {};

  const fileContent = fs.readFileSync(inFile);

  const inRows: CSVType = parse(fileContent, {
    delimiter,
    trim: true,
  })

  const headers = inRows[0];
  const englishLocaleIndex = headers.indexOf('en')
  const hasEnglish = englishLocaleIndex !== -1

  // Get the indices for the locales that need to be written
  const localeIndices = []

  for (const locale of locales) {
    const localeIndex = headers.indexOf(locale);
    if (localeIndex === -1) {
      console.warn('No translations for locale', locale)
    } else {
      localeIndices.push(localeIndex)
    }
  }

  if (localeIndices.length === 0) {
    console.warn('No translated locales selected')
    return;
  }

  for (let i = 1; i < inRows.length; i++) {
    const row = inRows[i];
    const jsonFile = row[0];
    const jsonKey  = row[1];

    if (!(jsonFile in translations)) {
      translations[jsonFile] = {}
    }

    const fileTranslations = translations[jsonFile];

    fileTranslations[jsonKey] = {}

    for (const localeIndex of localeIndices) {
      const locale = headers[localeIndex];
      const value = row[localeIndex];
      // Skip empty translations
      if (value === '') {
        continue
      }
      // Skip translations equal to the english one
      if (hasEnglish && localeIndex !== englishLocaleIndex && row[englishLocaleIndex] === value) {
        continue
      }
      fileTranslations[jsonKey][locale] = value;
    }
  }

  projectPath = path.resolve(projectPath);
  console.log('Importing translations into Homey project in', projectPath);

  // TODO add writing to locale files
  translationFiles(projectPath, true)
    .forEach((file) => importTranslations(projectPath, file, translations));
}

function importTranslations(projectPath: string, filePath: string, translations: Translations): void {
  if (!fs.existsSync(filePath)) {
    console.warn('Path does not exist', filePath);
    return;
  }

  const jsonPath = filePath.slice(projectPath.length + 1)

  if (jsonPath in translations) {
    const fileTranslations = translations[jsonPath];

    console.log('Reading', filePath);
    const fileContent = JSON.parse(fs.readFileSync(filePath).toString());
    const json = translateJson(fileContent, fileTranslations);

    console.log('Writing', filePath);
    fs.writeFileSync(filePath, JSON.stringify(json, undefined, 2) + '\n')
  }
}

// override in the existing file based on the paths in the file translation
function translateJson(jsonData: JsonType, fileTranslations: Translations[string]): JsonType {
  const jsonPaths = Object.keys(fileTranslations);

  for (const jsonPath of jsonPaths) {
    const translations = fileTranslations[jsonPath];
    pathSet(jsonData, jsonPath,translations)
  }

  return jsonData;
}
