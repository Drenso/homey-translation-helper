import glob from 'glob';
import path from 'path';

export function translationFiles(projectPath: string): string[] {
  const files = [
    path.join(projectPath, '.homeychangelog.json'),
  ];

  // Find json files
  [
    ...glob.sync(path.join(path.join(projectPath, '.homeycompose', '/**/*.json'))),
    ...glob.sync(path.join(path.join(projectPath, 'drivers', '/**/*.json'))),
  ].forEach(file => {
    if (file.match(/interview(\.\w+)?\.json$/)) {
      return;
    }

    files.push(path.resolve(file));
  });

  return files;
}
