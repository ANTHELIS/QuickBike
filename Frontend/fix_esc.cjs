const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/context/SiteConfigContext.jsx');
let content = fs.readFileSync(file, 'utf8');

// Find the esc function line and fix it
// Currently has: return '\\' + m (two backslashes in source = two at runtime)
// Need: return '\' + m (one backslash in source = one at runtime)
// In the file bytes, we need exactly: '\\' which is ONE backslash escape in JS

const oldLine = "  return cls.replace(/([[\\]#/:.])/g, function(m) { return '\\\\' + m; });";
const newLine = "  return cls.replace(/([[\\]#/:.])/g, function(m) { return '\\' + m; });";

content = content.replace(oldLine, newLine);
fs.writeFileSync(file, content, 'utf8');

// Verify
const verify = fs.readFileSync(file, 'utf8');
const eLine = verify.split('\n').find(l => l.includes('return cls.replace'));
console.log('Result line:', eLine);
console.log('JSON:', JSON.stringify(eLine));
