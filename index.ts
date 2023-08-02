import {program} from 'commander';
import executeExtract from './src/extract';
import executeImport from './src/import';

program.name('translation-helper');

program
  .command('extract')
  .description('Extracts all Homey translations in order for them to be translated')
  .option('--out <out>', 'Output file, defaults to `translations-out.csv`')
  .option('--include-changelog', 'Also extract changelog translations')
  .option('-d, --delimiter <delimiter>', 'CSV delimiter, defaults to `;`')
  .option('--drivers-directory <directory>', 'Driver directory, defaults to `drivers`')
  .option('--project-path <directory>', 'Project path, defaults to current working directory')
  .option('--additional-directories <directories...>', 'Additional directories inside the project to process')
  .requiredOption('-l, --locale <locales...>', 'The locales to extract. Use `all` to include all supported locales at once.')
  .action((options) => executeExtract(
    options.locale,
    options.out ?? 'translations-out.csv',
    options.includeChangelog,
    options.delimiter ?? ';',
    options.driversDirectory ?? 'drivers',
    options.projectPath,
    options.additionalDirectories,
  ));

program
  .command('import')
  .description('Import all new translations')
  .option('--in <in>', 'Input file, defaults to `translations-in.csv`')
  .option('-d, --delimiter <delimiter>', 'CSV delimiter, defaults to `;`')
  .option('--drivers-directory <directory>', 'Driver directory, defaults to `drivers`')
  .option('--project-path <directory>', 'Project path, defaults to current working directory')
  .option('--additional-directories <directories...>', 'Additional directories inside the project to process')
  .requiredOption('-l, --locale <locales...>', 'The locales to import')
  .action((options) => executeImport(
    options.locale,
    options.in ?? 'translations-in.csv',
    options.delimiter ?? ';',
    options.driversDirectory ?? 'drivers',
    options.projectPath,
    options.additionalDirectories,
  ));

program.parse();
