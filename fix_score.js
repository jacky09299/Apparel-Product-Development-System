const fs = require('fs');
let content = fs.readFileSync('src/components/TrendyStyleDecision.jsx', 'utf-8');

// Replace string concatenation with numeric parsing
content = content.replace(
  'potentialScore += (el.trendScore || 0);',
  'potentialScore += (typeof el.trendScore === "number" ? el.trendScore : 0);'
);

fs.writeFileSync('src/components/TrendyStyleDecision.jsx', content);
