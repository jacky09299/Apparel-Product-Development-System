import fs from 'fs';
import * as ort from 'onnxruntime-node';

const zhToEnMap = {
    '外套': 'jacket', '大衣': 'coat', '褲': 'pants', '裙': 'skirt', '洋裝': 'dress',
    '連身': 'jumpsuit', 't恤': 't-shirt', '上衣': 'top', '襯衫': 'shirt',
    '工裝': 'cargo', '復古': 'vintage', '極簡': 'minimalist', '未來': 'futuristic',
    '運動': 'athletic', '街頭': 'streetwear', '初秋': 'fall', '春日': 'spring',
    '都會': 'urban', '度假': 'vacation', '派對': 'party', '棉': 'cotton',
    '亞麻': 'linen', '牛仔': 'denim', '皮革': 'leather', '針織': 'knit',
    '黑色': 'black', '白色': 'white', '紅色': 'red', '藍色': 'blue', '綠色': 'green',
    '大地色': 'earth tone'
};

function translateToEnglish(text) {
    if (!text) return '';
    let translated = text;
    for (const [zh, en] of Object.entries(zhToEnMap)) {
        translated = translated.split(zh).join(` ${en} `);
    }
    return translated;
}

function tokenize(text) {
    if (!text) return [];
    text = translateToEnglish(text).toLowerCase();
    const words = [];
    const regex = /[a-z0-9_]+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        words.push(match[0]);
    }
    return words;
}

async function patchDb() {
  const dbStr = fs.readFileSync('public/db.json', 'utf8');
  const db = JSON.parse(dbStr);
  const prep = JSON.parse(fs.readFileSync('public/preprocessor.json', 'utf8'));
  const session = await ort.InferenceSession.create('public/price_model.onnx');

  const getMercariCategory = (itemName) => {
    if (!itemName) return 'Women/Other/Other';
    if (itemName.includes('外套') || itemName.includes('大衣')) return 'Women/Coats & Jackets/Other';
    if (itemName.includes('褲')) return 'Women/Pants/Other';
    if (itemName.includes('裙')) return 'Women/Skirts/Other';
    if (itemName.includes('洋裝') || itemName.includes('連身')) return 'Women/Dresses/Other';
    if (itemName.includes('T恤') || itemName.includes('上衣') || itemName.includes('襯衫')) return 'Women/Tops/T-shirts';
    return 'Women/Other/Other';
  };

  const targetArr = db.historical_stable_combinations;
  if (targetArr) {
    for (let combo of targetArr) {
      const nameText = combo.name;
      const descText = combo.elements.map(e => e.name || e.label).join(' ');
      const itemEl = combo.elements.find(e => e.category === '品項');
      const catText = getMercariCategory(itemEl ? (itemEl.name || itemEl.label) : '');
      const brandText = 'Nike';

      const nameWords = tokenize(nameText);
      const nameTokens = new BigInt64Array(20).fill(1n);
      const nameMask = new Uint8Array(20).fill(1);
      for (let i = 0; i < Math.min(20, nameWords.length); i++) {
          nameTokens[i] = BigInt(prep.vocab[nameWords[i]] || 1);
          nameMask[i] = 0;
      }
      if (nameWords.length === 0) { nameTokens[0] = 0n; nameMask[0] = 0; }

      const descWords = tokenize(descText);
      const descTokens = new BigInt64Array(100).fill(1n);
      const descMask = new Uint8Array(100).fill(1);
      for (let i = 0; i < Math.min(100, descWords.length); i++) {
          descTokens[i] = BigInt(prep.vocab[descWords[i]] || 1);
          descMask[i] = 0;
      }
      if (descWords.length === 0) { descTokens[0] = 0n; descMask[0] = 0; }

      const brandId = new BigInt64Array([BigInt(prep.brands[brandText] || 0)]);
      const cats = catText.split('/');
      const c1Id = new BigInt64Array([BigInt(prep.cat1s[cats[0]] || 0)]);
      const c2Id = new BigInt64Array([BigInt(prep.cat2s[cats[1]] || 0)]);
      const c3Id = new BigInt64Array([BigInt(prep.cat3s[cats[2]] || 0)]);
      
      const feeds = {
            name: new ort.Tensor('int64', nameTokens, [1, 20]),
            name_mask: new ort.Tensor('bool', nameMask, [1, 20]),
            desc: new ort.Tensor('int64', descTokens, [1, 100]),
            desc_mask: new ort.Tensor('bool', descMask, [1, 100]),
            brand: new ort.Tensor('int64', brandId, [1]),
            c1: new ort.Tensor('int64', c1Id, [1]),
            c2: new ort.Tensor('int64', c2Id, [1]),
            c3: new ort.Tensor('int64', c3Id, [1]),
            cond: new ort.Tensor('int64', new BigInt64Array([1n]), [1]),
            ship: new ort.Tensor('int64', new BigInt64Array([1n]), [1])
      };
      
      const results = await session.run(feeds);
      const priceUSD = Math.expm1(results.output.data[0]);

      combo.estPrice = priceUSD * 32;
    }
  }

  fs.writeFileSync('public/db.json', JSON.stringify(db, null, 2));
  console.log('Patched db.json with TWD and restored costs!');
}
patchDb();
