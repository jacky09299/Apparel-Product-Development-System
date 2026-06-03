const db = require('./public/db.json');

const normalizeName = name => name.replace(/色$/, '');

const basicElementsMap = new Map();
db.historical_stable_combinations.forEach(combo => {
  combo.elements.forEach(el => {
    if (!basicElementsMap.has(el.name)) {
      basicElementsMap.set(el.name, el);
    }
  });
});

const mergedMap = new Map();
Array.from(basicElementsMap.values()).forEach(el => {
  const baseScore = 4.0 + Math.random() * 2.0; 
  const defaultEl = {
    ...el,
    trendScore: baseScore,
    interval: [baseScore - 0.5, baseScore + 0.5]
  };
  mergedMap.set(normalizeName(el.name), defaultEl);
});

const aiData = db.ai_trend_elements || [];
const sorted = aiData.sort((a, b) => b.score - a.score);
const top50 = sorted.slice(0, 50).map(item => ({
  id: item.id,
  category: item.category,
  name: item.name,
  trendScore: item.score,
  interval: item.interval,
  timeline: item.timeline
}));

top50.forEach(el => {
  const normName = normalizeName(el.name);
  const score = el.score || el.trendScore;
  if (mergedMap.has(normName)) {
    const existing = mergedMap.get(normName);
    existing.name = el.name;
    existing.isTrend = true;
    existing.trendScore = score;
    existing.interval = el.interval;
    existing.timeline = el.timeline;
  } else {
    mergedMap.set(normName, {
      ...el,
      trendScore: score
    });
  }
});

let nans = 0;
Array.from(mergedMap.values()).forEach(el => {
  let spreadUp = null;
  let spreadDown = null;
  const safeTrendScore = typeof el.trendScore === 'number' ? el.trendScore : parseFloat(el.trendScore || 0);

  if (el.interval && !isNaN(safeTrendScore)) {
    if (Array.isArray(el.interval) && el.interval.length === 2 && !isNaN(el.interval[0]) && !isNaN(el.interval[1])) {
      spreadUp = (el.interval[1] - safeTrendScore).toFixed(1);
      spreadDown = (safeTrendScore - el.interval[0]).toFixed(1);
    } else if (el.interval.upper !== undefined && el.interval.lower !== undefined && !isNaN(el.interval.upper) && !isNaN(el.interval.lower)) {
      spreadUp = (el.interval.upper - safeTrendScore).toFixed(1);
      spreadDown = (safeTrendScore - el.interval.lower).toFixed(1);
    } else {
      console.log('INVALID INTERVAL', el.name, el.interval);
    }
  }

  if (isNaN(safeTrendScore) || spreadUp === "NaN" || spreadDown === "NaN") {
    console.log('NAN FOUND:', el.name, 'score:', el.trendScore, 'interval:', el.interval);
    nans++;
  }
});
console.log('Total NaNs found:', nans);
