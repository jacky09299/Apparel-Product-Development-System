const fs = require('fs');

let fileContent = fs.readFileSync('src/components/BrandFitMatrix.jsx', 'utf-8');

// 1. Add graceful exit to Sparkline
fileContent = fileContent.replace(
  'if (!data || data.length === 0) return <span className="text-[#9ca3af] text-xs">無資料</span>;',
  'if (!data || data.length === 0 || typeof data[0] !== "object" || data[0].median === undefined) return <span className="text-[#9ca3af] text-xs">無資料</span>;'
);

// 2. Fix handleAutoFillDemo
const generatorCode = `          const enhancedData = aiData.map(item => {
             if (item.timeline && item.timeline.length >= 21) {
               return item;
             }
             const itemId = item.id || \`gen-\${Math.random().toString(36).substr(2, 9)}\`;
             const seed = itemId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
             const r = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
             const timeline = [];
             
             let spreadAt6 = Math.max(1, item.score * 0.1);
             if (item.interval) {
               if (Array.isArray(item.interval) && item.interval.length >= 2) {
                 spreadAt6 = (item.interval[1] - item.interval[0]) / 2;
               } else if (item.interval.upper !== undefined && item.interval.lower !== undefined) {
                 spreadAt6 = (item.interval.upper - item.interval.lower) / 2;
               }
             }
             const direction = item.score > 20 ? -0.5 : 0.5;
             
             for (let i = 0; i < 635; i++) {
                 const distToTarget = i - 545; // Target is month +6 (idx 545)
                 let median = item.score + (distToTarget * direction / 30) + (r(seed + i) - 0.5) * (item.score * 0.1);
                 median = Math.max(1, median);
                 
                 // Force target match
                 if (i === 545) median = item.score;
                 
                 let lower = median;
                 let upper = median;
                 
                 // Forecast section (idx 365 to 634)
                 if (i >= 365) {
                    const fDay = i - 365; // 0 to 269
                    const spread = (fDay / 180) * spreadAt6; // at month 6 (fDay=180), spread = spreadAt6
                    lower = median - spread;
                    upper = median + spread;
                 }
                 
                 timeline.push({ 
                    median, lower, upper
                 });
             }
             return {
               ...item,
               interval: item.interval || [Math.max(1, item.score - spreadAt6), Math.min(10, item.score + spreadAt6)],
               timeline
             };
          });
          setPredictionData(enhancedData);`;

fileContent = fileContent.replace(
  'setPredictionData(aiData);',
  generatorCode
);

fs.writeFileSync('src/components/BrandFitMatrix.jsx', fileContent);
