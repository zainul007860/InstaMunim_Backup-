const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const tMap = {
  "Dashboard": "डैशबोर्ड",
  "Cart": "कार्ट",
  "Customers": "ग्राहक",
  "Store Settings": "सेटिंग्स",
  "Gross Sales": "कुल बिक्री",
  "Aggregator Com.": "कमीशन",
  "Daily Expenses": "दैनिक खर्चे",
  "Net Profit (Bachhat)": "शुद्ध मुनाफा (बचत)",
  "Add Expense": "खर्चा जोड़ें",
  "Select Items": "आइटम चुनें",
  "Order Summary": "ऑर्डर समरी",
  "Grand Total": "कुल बिल",
  "Cash Received": "नकद मिला",
  "Change Due": "वापस देना है",
  "Complete Order": "ऑर्डर पूरा करें",
  "Cash": "नकद",
  "Online": "ऑनलाइन",
  "Udhaar": "उधार",
  "Customer Name (Optional)": "ग्राहक का नाम (वैकल्पिक)",
  "Mobile Number (Optional)": "मोबाइल नंबर (वैकल्पिक)",
  "Mark as Paid": "पैसे मिल गए",
  "Send WhatsApp Receipt": "WhatsApp बिल भेजें",
  "Total Pending": "कुल उधार",
  "Smart CRM": "स्मार्ट मार्केटिंग",
  "Campaign Message": "मार्केटिंग मैसेज",
  "Cart is empty": "कार्ट खाली है"
};

// 1. Add state and translation function
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState\("Dashboard"\);/, 
  `const [activeTab, setActiveTab] = useState("Dashboard");
  const [lang, setLang] = useState('hi');
  const t = (key) => {
    const map = ${JSON.stringify(tMap)};
    return lang === 'hi' && map[key] ? map[key] : key;
  };`
);

// 2. Add language switch button to the header
code = code.replace(
  /<div className="flex items-center gap-3">/, 
  `<div className="flex items-center gap-3">
                  <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="px-3 py-1 bg-zinc-800 text-white rounded-full text-xs font-bold border border-zinc-700 shadow-lg active:scale-95 transition-all">
                    {lang === 'en' ? 'अ/A' : 'A/अ'}
                  </button>`
);

// 3. Replace text safely
for (const [en, hi] of Object.entries(tMap)) {
  // Replace text between > and <
  const regexNode = new RegExp(`>(\\s*)${en}(\\s*)<`, 'g');
  code = code.replace(regexNode, `>$1{t("${en}")}$2<`);
  
  // Replace placeholders
  const regexPlaceholder = new RegExp(`placeholder="${en}"`, 'g');
  code = code.replace(regexPlaceholder, `placeholder={t("${en}")}`);
}

fs.writeFileSync('src/app/page.tsx', code);
console.log("Translation applied!");
