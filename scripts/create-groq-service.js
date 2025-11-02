const fs = require('fs');

// Moved from project root to scripts/
// Original purpose: helper to regenerate services/groqService.js from template

const groqServiceContent = `// see original file in git history`;

fs.writeFileSync('services/groqService.js', groqServiceContent, 'utf8');
console.log('create-groq-service moved to scripts/ (placeholder)');
