const fs = require('fs');

let code = fs.readFileSync('src/pages/CaptainAccount.jsx', 'utf8');

// The block we want to extract starts at:
// {/* Per-trip ledger wrapper for Desktop Right Pane */}
let startIndex = code.indexOf('{/* Per-trip ledger wrapper for Desktop Right Pane */}');
let prefixCode = code.slice(0, startIndex);

// We need to trace where the right pane ends. Currently it ends with two </div>
// Let's find the `Vehicle Details` section comment which comes right after the right pane.
let vehicleIndex = code.indexOf('{/* ── Vehicle Details ── */}');
let rightPaneCode = code.slice(startIndex, vehicleIndex);

// Let's remove the two trailing </div></div> from rightPaneCode
let trimmedRightPane = rightPaneCode.trim();
if (trimmedRightPane.endsWith('</div>')) {
    trimmedRightPane = trimmedRightPane.slice(0, trimmedRightPane.lastIndexOf('</div>')).trim();
}
if (trimmedRightPane.endsWith('</div>')) {
    trimmedRightPane = trimmedRightPane.slice(0, trimmedRightPane.lastIndexOf('</div>')).trim();
}
// Add 1 </div> to close md:w-2/3
trimmedRightPane += '\n        </div>\n';

// Now extract the end of the file from `Vehicle Details` onwards.
let endCode = code.slice(vehicleIndex);

// Let's insert the right pane AFTER endCode's Actions section but BEFORE </main>
let mainCloseIndex = endCode.lastIndexOf('</main>');

let endPrefix = endCode.slice(0, mainCloseIndex);
let endSuffix = endCode.slice(mainCloseIndex);

// Remember we also need to close the left pane </div> right before the right pane begins.
// So endPrefix contains Vehicle Details and Actions. Those belong into left pane!
// Therefore, we add </div> to close left pane.
let newEndPrefix = endPrefix + '\n        </div>\n';

// Then insert right pane
let finalCode = prefixCode + newEndPrefix + '\n        ' + trimmedRightPane + '\n        </div>\n      ' + endSuffix;

fs.writeFileSync('src/pages/CaptainAccount.jsx', finalCode);
console.log('Fixed CaptainAccount.jsx');
