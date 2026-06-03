const fs = require('fs');
const path = 'public/db.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.ai_trend_elements.forEach(el => {
  if (el.category === '版型' || el.category === '風格') {
    el.score = el.trendScore; // Copy trendScore to score
    // Also give them a high score so they stay at the top
    el.score = 15.0 + Math.random() * 3.0; 
  }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Fixed scores in db.json');
