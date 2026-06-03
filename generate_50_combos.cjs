const fs = require('fs');
const path = 'public/db.json';

const items = ['T恤', '襯衫', '外套', '洋裝', '長褲', '短裙', '毛衣', '衛衣', '飛行外套', '大衣', '針織衫', '西裝外套', '背心', '寬褲'];
const colors = ['白', '黑', '灰', '海軍藍', '米色', '卡其', '焦糖棕', '橄欖綠', '櫻花粉', '霧霾藍', '酒紅', '芥末黃'];
const palettes = ['同色系', '對比色', '撞色', '單一色', '漸層', '拼接', '素色', '雙色拼接'];
const fabrics = ['純棉', '亞麻', '牛仔', '雪紡', '絲綢', '羊毛', '聚酯纖維', '燈芯絨', '尼龍', '皮革', '針織', '蕾絲'];
const patterns = ['無印花', '條紋', '格紋', '碎花', '幾何', '豹紋', '字母', '塗鴉', '波點', '千鳥格'];
const details = ['無特殊細節', '抽繩', '大口袋', '金屬拉鍊', '綁帶', '荷葉邊', '精緻刺繡', '鏤空', '抓皺', '排扣', '流蘇', '墊肩'];
const fits = ['正常版型', 'Oversize', '修身', '短版', '寬鬆', '直筒', '緊身', '傘狀', '落地', '高腰'];
const styles = ['休閒', '正裝', '街頭', 'Y2K', '極簡', '復古', '運動', '甜美', '工裝', '波西米亞'];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const combos = [];
for (let i = 1; i <= 50; i++) {
  const item = getRandom(items);
  const color = getRandom(colors);
  const palette = getRandom(palettes);
  const fabric = getRandom(fabrics);
  const pattern = getRandom(patterns);
  const detail = getRandom(details);
  const fit = getRandom(fits);
  const style = getRandom(styles);
  
  const comboName = `${style}風${color}${detail !== '無特殊細節' ? detail : ''}${fit}${item}`;
  
  combos.push({
    id: `hc-${i}`,
    name: comboName,
    elements: [
      { id: `b-item-${i}`, category: '品項', name: item },
      { id: `b-color-${i}`, category: '主色', name: color },
      { id: `b-pal-${i}`, category: '配色', name: palette },
      { id: `b-fab-${i}`, category: '面料', name: fabric },
      { id: `b-pat-${i}`, category: '圖騰印花', name: pattern },
      { id: `b-det-${i}`, category: '細節設計', name: detail },
      { id: `b-fit-${i}`, category: '版型', name: fit },
      { id: `b-sty-${i}`, category: '風格', name: style }
    ],
    trendScore: (5 + Math.random() * 4).toFixed(1),
    roiScore: (6 + Math.random() * 3.5).toFixed(1),
    fitScore: (7 + Math.random() * 2.8).toFixed(1),
    competitorScore: (4 + Math.random() * 5).toFixed(1),
    salesVolume: Math.floor(1000 + Math.random() * 9000),
    estPrice: Math.floor(500 + Math.random() * 2500),
    estFixedCost: Math.floor(10000 + Math.random() * 40000),
    estVariableCost: Math.floor(150 + Math.random() * 400)
  });
}

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
data.historical_stable_combinations = combos;

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Successfully generated 50 distinct historical combinations.');
