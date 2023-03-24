#!/usr/bin/env node

import {program} from 'commander';
import executeExtract from './src/extract';
import executeImport from './src/import';

program.name('translation-helper');

program
  .command('extract')
  .description('Extracts all Homey translations in order for them to be translated')
  .argument('<project-path>', 'Project path to parse')
  .option('--out <out>', 'Output file, defaults to translations-out.csv')
  .option('--include-changelog', 'Also extract changelog translations')
  .option('-d, --delimiter <delimiter>', 'CSV delimiter, defaults to ;')
  .requiredOption('-l, --locale <locales...>', 'The locales to extract. English will always be used as key. Use \'all\' to include all supported locales at once.')
  .action((path, options) => executeExtract(path, options.locale, options.out ?? 'translations-out.csv', options.includeChangelog, options.delimiter ?? ';'));

program
  .command('import')
  .description('Import all new translations')
  .argument('<project-path>', 'Project path the translations should be updated for')
  .option('--in <in>', 'Input file, defaults to translations-in.csv')
  .option('-d, --delimiter <delimiter>', 'CSV delimiter, defaults to ;')
  .requiredOption('-l, --locale <locales...>', 'The locales to import. English will be used as key')
  .action((path, options) => executeImport(path, options.locale, options.in ?? 'translations-in.csv', options.delimiter ?? ';'));

program.parse();
