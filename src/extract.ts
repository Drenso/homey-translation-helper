import {stringify} from 'csv';
import fs from 'fs';
import {type} from 'os';
import path from 'path';
import glob from 'glob';
import _ from 'lodash';

type Translations = Record<string, Record<string, string | null>>;

function mergeTranslations(a: Translations, b: Translations): Translations {
  return _.merge(a, b);
}

function walkJson(jsonData: Record<string, any>): Translations {
  let result: Translations = {};

  if (Array.isArray(jsonData)) {
    jsonData.forEach(item => {
      result = mergeTranslations(result, walkJson(item));
    });

    return result;
  }

  if (typeof jsonData !== 'object') {
    return {};
  }

  const jsonKeys = Object.keys(jsonData);
  if (jsonKeys.includes('en')) {
    // We will assume this is a translations object
    let translation = jsonData['en'];
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

export default function execute(projectPath: string, locales: string[], outFile: string): void {
  projectPath = path.resolve(projectPath);
  console.log('Parsing translations from Homey project in', projectPath);

  const transCalls: Array<() => Translations> = [
    () => retrieveFromJson(path.join(projectPath, '.homeychangelog.json')),
    () => retrieveFromJson(path.join(projectPath, '.homeycompose', 'app.json')),
  ];

  // Find json files
  [
    ...glob.sync(path.join(path.join(projectPath, '.homeycompose', '/**/*.json'))),
    ...glob.sync(path.join(path.join(projectPath, 'drivers', '/**/*.json'))),
  ].forEach(file => {
    if (file.match(/interview(\.\w+)?\.json$/)) {
      return;
    }
    transCalls.push(() => retrieveFromJson(path.resolve(file)));
  });

  let translations: Translations = {};
  transCalls.forEach(transCall => translations = mergeTranslations(translations, transCall()));

  outFile = path.resolve(path.join(path.dirname(require.main?.filename ?? __dirname), outFile));
  console.log('Writing result to', outFile);

  if (fs.existsSync(outFile)) {
    fs.rmSync(outFile);
  }
  const outStream = fs.createWriteStream(outFile);

  const stringifier = stringify({
    delimiter: ';',
    header: true,
    columns: ['Translation key', ...locales],
  });

  Object.keys(translations).sort().forEach((translation) => {
    stringifier.write([translation, ...locales.map(locale => translations[translation][locale] ?? null)])
  });

  stringifier.pipe(outStream);
  stringifier.end();
  outStream.close();
}
