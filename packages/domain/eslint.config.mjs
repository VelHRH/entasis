// The domain package lints with the exact same rules (including dprint
// formatting) as the server. The plugins resolve from the server package's
// node_modules because ESM resolution is relative to the importing file.
export { default } from "../server/eslint.config.mjs";
