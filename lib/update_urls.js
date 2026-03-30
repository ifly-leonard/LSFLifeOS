const fs = require('fs');

const path = 'lib/wardrobe-data.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/image_url:\s*"https:\/\/placehold.co[^"]+"/g, (match) => {
  // We can't easily extract title in string replacer, so let's parse using basic regex
  return match;
});

fs.writeFileSync(path, content);
