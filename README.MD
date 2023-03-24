# Homey translations helper

This tool can extract and import translations to and from CSV files so customers can help with the translations.

It can be run with `homey-translation-helper` when installed in your project.

## Options

Run `homey-translation-helper [help [command]]` to see all available options.

## Delimiter

By default `;` is used as delimiter, this can be changed by passing the `-d` option.

## Extract

Run `homey-translation-helper extract <project-path> -l <locales>` to extract all messages used in the app.

Add the following to the homey app scripts for easy access:

```json
{
  "locales-export": "homey-translation-helper extract -l en -l nl",
  "locales-import": "homey-translation-helper import -l en -l nl"
}
```
