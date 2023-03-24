/* eslint-disable */
const fs = require('fs');
const path = require('path');
const dir = process.cwd();

// noinspection JSValidateTypes
require('@vercel/ncc')(path.resolve(path.join(dir, 'index.ts')), {
  minify: true,
}).then(({ code }) => {
  const binFolder = path.join(dir, 'bin');
  if (!fs.existsSync(binFolder)) {
    fs.mkdirSync(binFolder);
  }
  fs.writeFileSync(
    path.resolve(path.join(dir, 'bin', 'index.js')),
    "#!/usr/bin/env node\n\n" + code
  );
});
