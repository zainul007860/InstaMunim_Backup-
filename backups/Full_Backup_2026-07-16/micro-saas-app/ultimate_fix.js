const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');
content = content.replace(/7 DAYS FREE TRIAL .*? NO CREDIT CARD/g, '7 DAYS FREE TRIAL • NO CREDIT CARD');
content = content.replace(/MAKE IN INDIA .*?<\/div>/g, 'MAKE IN INDIA 🇮🇳</div>');
content = content.replace(/© 2026 INSTAMUNIM SMART POS .*? ALL RIGHTS RESERVED/g, '© 2026 INSTAMUNIM SMART POS • BEYOND BILLING • ALL RIGHTS RESERVED');
fs.writeFileSync('src/app/page.tsx', content, 'utf8');
