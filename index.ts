import {program} from 'commander';
import extract from './src/extract';

program.name('translation-helper');

program
  .command('extract')
  .description('Extracts all Homey translations in order for them to be translated')
  .argument('<project-path>', 'Project path to parse')
  .option('--out <out>', 'Output file, defaults to translations.csv')
  .requiredOption('-l, --locale <locales...>', 'The locales to extract. English will always be used as key')
  .action((path, options) => extract(path, options.locale, options.out ?? 'translations.csv'));

program.parse();
