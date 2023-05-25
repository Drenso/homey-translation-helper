import glob from 'glob';
import path from 'path';

export function translationFiles(projectPath: string, includeReleaseNotes = false): string[] {
  const files: string[] = [];

  if (includeReleaseNotes) {
    files.push(path.join(projectPath, '.homeychangelog.json'));
  }

  // Find json files
  [
    ...glob.sync(path.join(path.join(projectPath, '.homeycompose', '/**/*.json'))),
    ...glob.sync(path.join(path.join(projectPath, 'drivers', '/**/*.json'))),
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
