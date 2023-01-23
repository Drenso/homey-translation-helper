export type Translations = Record<string, Record<string, string | null>>;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Circular type
export type JsonType = Record<string, JsonType> | Array<JsonType>;
