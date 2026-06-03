const fs = require('fs');
const db = JSON.parse(fs.readFileSync('public/db.json', 'utf8'));

const combos = db.historical_stable_combinations;
const seen = new Set();
const duplicates = [];

combos.forEach((c, idx) => {
  if (seen.has(c.name)) {
    duplicates.push(idx);
  } else {
    seen.add(c.name);
  }
});

console.log('Duplicates found at indices:', duplicates);

const newNames = [
  "潮流丹寧工裝寬褲",
  "都會機能防水風衣",
  "極簡美學針織背心",
  "慵懶風垂墜感襯衫",
  "運動休閒縮口長褲",
  "復古水洗老爺褲",
  "高街機車皮夾克",
  "保暖立領羽絨背心",
  "法式氣質碎花長裙",
  "前衛不對稱剪裁T恤"
];

let newIdx = 0;
duplicates.forEach(idx => {
  if (newIdx < newNames.length) {
    combos[idx].name = newNames[newIdx];
    combos[idx].id = `hc-new-${newIdx}`;
    combos[idx].elements = [
      { id: `i-new-${newIdx}`, category: "品項", name: newNames[newIdx].slice(-2) },
      { id: `c-new-${newIdx}`, category: "主色", name: "迷彩" },
      { id: `m-new-${newIdx}`, category: "面料", name: "防潑水科技材質" },
      { id: `p-new-${newIdx}`, category: "圖騰印花", name: "無" }
    ];
    newIdx++;
  }
});

fs.writeFileSync('public/db.json', JSON.stringify(db, null, 2));
console.log('Fixed duplicates in db.json!');
