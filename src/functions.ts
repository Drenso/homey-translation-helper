import glob from 'glob';
import path from 'path';
import fs from 'fs';

export function translationFiles(projectPath: string, includeReleaseNotes = false, driversDirectory = 'drivers', additionalDirectories?: string[]): string[] {
  const files: string[] = [];

  if (includeReleaseNotes) {
    files.push(path.join(projectPath, '.homeychangelog.json'));
  }

  let additionalFiles: string[] = [];

  if (additionalDirectories) {
    for (const additionalDirectory of additionalDirectories) {
      additionalFiles = additionalFiles.concat(glob.sync(path.join(projectPath, additionalDirectory, '/**/*.json')))
    }
  }

  // Find json files
  [
    ...glob.sync(path.join(projectPath, '.homeycompose', '/**/*.json')),
    ...glob.sync(path.join(projectPath, driversDirectory, '/**/*.json')),
    ...additionalFiles,
  ].forEach(file => {
    if (file.match(/interview(\.[\w-_]+)?\.json$/)) {
      // Ignore interviews
      return;
    }

    if (file.match(/locales[\\/]+[a-z]{2}\.json/)) {
      // Ignore direct translation files
      return;
    }

    files.push(path.resolve(file));
  });

  return files;
}

// Get just the locale name from the filepath
export const fileLocaleRegExp = RegExp('(?<=\\/)\\w*(?=\\.json$)');

export function localeFiles(projectPath: string, locales: string[]): string[] {
  return glob.sync(path.join(projectPath, '.homeycompose', 'locales', '*.json')).filter((file: string) => {
    const fileLocales = fileLocaleRegExp.exec(file);
    return fileLocales !== null && locales.includes(fileLocales[0])
  });
}

export function createMissingLocaleFiles(projectPath: string, locales: string[]): string[] {
  const localeFiles: string[] = [];
  for (const locale of locales) {
    const localeFile = path.join(projectPath, '.homeycompose', 'locales', `${locale}.json`);
    localeFiles.push(localeFile);
    if (!fs.existsSync(localeFile)) {
      console.log('Creating', localeFile)
      fs.writeFileSync(localeFile, '{}') // Create empty json in the file
    }
  }
  return localeFiles;
}
