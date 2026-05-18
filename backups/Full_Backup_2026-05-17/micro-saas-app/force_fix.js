const fs = require('fs');
let text = fs.readFileSync('src/app/page.tsx', 'utf8');

// Fix all corrupted symbols with Unicode escapes
text = text.replace(/â€¢/g, '{"\\u2022"}');
text = text.replace(/â‚¹/g, '{"\\u20B9"}');
text = text.replace(/Â©/g, '{"\\u00A9"}');
text = text.replace(/🇮🇳/g, '{"\\uD83C\\uDDEE\\uD83C\\uDDF3"}');
text = text.replace(/ðŸš€/g, '\\uD83D\\uDE80');
text = text.replace(/ðŸ“ˆ/g, '\\uD83D\\uDCC8');

// Also cleanup any merge markers if they leaked in
text = text.replace(/<<<<<<< HEAD[\s\S]*?=======/g, '').replace(/>>>>>>> dev/g, '');

fs.writeFileSync('src/app/page.tsx', text, 'utf8');
