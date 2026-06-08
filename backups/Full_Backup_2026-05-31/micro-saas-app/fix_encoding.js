const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
// Remove any weird markers if they exist
const cleaned = content.replace(/<<<<<<< HEAD[\s\S]*?=======/g, '').replace(/>>>>>>> dev/g, '');
fs.writeFileSync('src/app/page.tsx', cleaned, 'utf8');
