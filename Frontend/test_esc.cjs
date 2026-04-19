const fs = require('fs');

// Read the actual esc function from the source file
const src = fs.readFileSync('src/context/SiteConfigContext.jsx', 'utf8');

// Extract and eval the esc function
const match = src.match(/function esc\(cls\) \{[\s\S]*?\n\}/);
if (!match) { console.log('Could not find esc function'); process.exit(1); }

eval(match[0]); // defines esc() in our scope

// Test it
const tests = [
  'text-[#F5820D]',
  'hover:bg-[#e67e00]',
  'focus-within:border-[#F5820D]',
  'from-[#904d00]',
  'bg-[#E67E00]',
];

console.log('=== esc() function output tests ===');
for (const t of tests) {
  const result = esc(t);
  console.log(`  esc("${t}") => "${result}"`);
}

// Clean up
fs.unlinkSync('fix_esc.cjs');
console.log('\nCleaned up fix_esc.cjs');
