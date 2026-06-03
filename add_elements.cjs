const fs = require('fs');

const path = 'public/db.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Add 20 more historical combinations
const existingCombos = data.historical_stable_combinations;
const startIdx = existingCombos.length + 1;
for (let i = startIdx; i <= 50; i++) {
  const baseCombo = existingCombos[i % existingCombos.length];
  const newCombo = JSON.parse(JSON.stringify(baseCombo));
  newCombo.id = `hc-${i}`;
  newCombo.name = newCombo.name.split(' (')[0] + ` (Variation ${i})`;
  
  // Add some slight random variations to stats
  newCombo.trendScore = (parseFloat(newCombo.trendScore) * (0.9 + Math.random() * 0.2)).toFixed(1);
  newCombo.roiScore = (parseFloat(newCombo.roiScore) * (0.9 + Math.random() * 0.2)).toFixed(1);
  newCombo.fitScore = (parseFloat(newCombo.fitScore) * (0.9 + Math.random() * 0.2)).toFixed(1);
  newCombo.competitorScore = (parseFloat(newCombo.competitorScore || 8) * (0.9 + Math.random() * 0.2)).toFixed(1);
  
  // Re-id elements
  newCombo.elements.forEach((el, elIdx) => {
    el.id = `b-${el.category}-${i}-${elIdx}`;
  });
  
  existingCombos.push(newCombo);
}

// 2. Add some AI elements for new categories: '版型', '風格'
const newAiElements = [
  { name: "Oversize", category: "版型", trendScore: 9.5, interval: { median: 15, lower: 12, upper: 20 }, timeline: [] },
  { name: "修身", category: "版型", trendScore: 7.2, interval: { median: 10, lower: 8, upper: 15 }, timeline: [] },
  { name: "短版", category: "版型", trendScore: 8.8, interval: { median: 13, lower: 10, upper: 18 }, timeline: [] },
  { name: "Y2K", category: "風格", trendScore: 9.8, interval: { median: 16, lower: 13, upper: 22 }, timeline: [] },
  { name: "極簡", category: "風格", trendScore: 8.5, interval: { median: 12, lower: 10, upper: 16 }, timeline: [] },
  { name: "復古", category: "風格", trendScore: 9.0, interval: { median: 14, lower: 11, upper: 19 }, timeline: [] }
];

data.ai_trend_elements.push(...newAiElements);

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('db.json updated successfully.');
