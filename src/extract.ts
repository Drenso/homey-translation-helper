import {stringify} from 'csv-stringify';
import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import {fileLocaleRegExp, localeFiles, translationFiles} from './functions';
import {parseLocales} from './locales';
import {JsonType, Translations} from './types';

function mergeTranslations(a: Translations, b: Translations): Translations {
  return _.merge(a, b);
}

function mergeFileTranslations(a: Translations[string], b: Translations[string]): Translations[string] {
  return _.merge(a, b);
}

function walkJson(filePath: string, jsonPath: string, jsonData: JsonType): Translations {
  let result: Translations = {};

  if (Array.isArray(jsonData)) {
    for (let i = 0; i < jsonData.length; i++){
      const item = jsonData[i];
      const arrayPath = `${jsonPath}[${i}]`;
      result     = mergeTranslations(result, walkJson(filePath, arrayPath, item));
    }

    return result;
  }

  if (typeof jsonData !== 'object' || jsonData === null) {
    return {};
  }

  const jsonKeys = Object.keys(jsonData);
  if (jsonKeys.includes('en')) {
    // We will assume this is a translations object
    if (!result[filePath]) {
      result[filePath] = {}
    }
    result[filePath][jsonPath] = {};
    jsonKeys.forEach((jsonKey) => {
      result[filePath][jsonPath][jsonKey] = jsonData[jsonKey];
    });

    return result;
  }

  // Recursively walk the json data
  jsonKeys.forEach(jsonKey => {
    const childPath = jsonPath.length === 0 ? jsonKey : `${jsonPath}.${jsonKey}`
    result = mergeTranslations(result, walkJson(filePath, childPath, jsonData[jsonKey]));
  });

  return result;
}

function retrieveFromJson(projectPath: string, jsonFilePath: string): Translations {
  if (!fs.existsSync(jsonFilePath)) {
    console.warn('Path does not exist', jsonFilePath);
    return {};
  }

  console.log('Reading', jsonFilePath);

  const filePath = jsonFilePath.substring(projectPath.length + 1);
  return walkJson(filePath, '', JSON.parse(fs.readFileSync(jsonFilePath).toString()));
}

function retrieveFromLocaleJson(locale: string, jsonFilePath: string): Translations[string] {
  if (!fs.existsSync(jsonFilePath)) {
    console.warn('Path does not exist', jsonFilePath);
    return {};
  }

  console.log('Reading', jsonFilePath);

  return walkLocaleJson(locale, '', JSON.parse(fs.readFileSync(jsonFilePath).toString()))
}

function walkLocaleJson(locale: string, jsonPath: string, jsonData: JsonType | string): Translations[string] {
  if (typeof jsonData === 'string') {
    return {[jsonPath]: {[locale]: jsonData}};
  }

  // recurse
  let result: Translations[string] = {};

  const jsonKeys = Object.keys(jsonData);

  jsonKeys.forEach(jsonKey => {
    const childPath = jsonPath.length === 0 ? jsonKey : `${jsonPath}.${jsonKey}`
    result = mergeFileTranslations(result, walkLocaleJson(locale, childPath, jsonData[jsonKey]))
  })

  return result;
}

export default function execute(
  locales: string[],
  outFile: string,
  includeChangelog: boolean,
  delimiter: string,
): void {
  locales = parseLocales(locales);

  const projectPath = process.cwd();
  console.log('Parsing translations from Homey project in', projectPath);

  let translations: Translations = {};
  translationFiles(projectPath, includeChangelog)
    .forEach(file => translations = mergeTranslations(translations, retrieveFromJson(projectPath, file)));

  let localeTranslations: Translations[string] = {}

  localeFiles(projectPath, locales)
    .forEach(file => {
      const fileLocales = fileLocaleRegExp.exec(file);
      if (fileLocales !== null) {
        const fileLocale = fileLocales[0];
        localeTranslations = mergeFileTranslations(localeTranslations, retrieveFromLocaleJson(fileLocale, file))
      }
    })

  translations['.homeycompose/locales'] = localeTranslations;

  outFile = path.resolve(path.join(projectPath, outFile));
  console.log('Writing result to', outFile);

  if (fs.existsSync(outFile)) {
    fs.rmSync(outFile);
  }

  const stringifier = stringify({
    delimiter: delimiter,
    header: true,
    columns: ['File', 'Translation key', ...locales],
    bom: true,
    encoding: 'utf8',
  });

  Object.keys(translations).sort().forEach((filePath) => {
    const fileTranslations = translations[filePath];
    Object.keys(fileTranslations).sort().forEach((translation) => {
      stringifier.write([filePath, translation, ...locales.map(locale => fileTranslations[translation][locale] ?? null)])
    })
  });

  const stringResult = stringifier.read();
  fs.writeFileSync(outFile, stringResult);
  stringifier.end();
}
