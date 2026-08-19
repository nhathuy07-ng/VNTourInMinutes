const fs = require('fs');
let code = fs.readFileSync('hooks/use-mobile.ts', 'utf8');
code = code.replace(/setIsMobile\\(window\\.innerWidth < MOBILE_BREAKPOINT\\)/g, 'onChange()');
// wait, the first one is inside onChange.
