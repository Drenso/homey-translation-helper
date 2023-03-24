import fs from "fs";
import path from "path";
import ncc from "@vercel/ncc";

const dir = process.cwd();

// noinspection JSValidateTypes
const {code} = await ncc(path.resolve(path.join(dir, 'index.ts')), {
  minify: true,
})

const binFolder = path.join(dir, 'bin');
if (!fs.existsSync(binFolder)) {
  fs.mkdirSync(binFolder);
}
fs.writeFileSync(
  path.resolve(path.join(dir, 'bin', 'index.js')),
  "#!/usr/bin/env node\n\n" + code
);
