import * as ort from 'onnxruntime-web';

ort.env.wasm.numThreads = 1;

let modelSession = null;
let preprocessor = null;

export async function initPredictor() {
    if (!modelSession) {
        try {
            console.log("Loading ONNX model...");
            modelSession = await ort.InferenceSession.create('/price_model.onnx', { executionProviders: ['wasm'] });
            console.log("ONNX model loaded!");
        } catch (e) {
            console.error("Failed to load ONNX model", e);
            throw e;
        }
    }
    if (!preprocessor) {
        try {
            console.log("Loading preprocessor JSON...");
            const res = await fetch('/preprocessor.json');
            preprocessor = await res.json();
            console.log("Preprocessor loaded!");
        } catch (e) {
            console.error("Failed to load preprocessor.json", e);
            throw e;
        }
    }
}

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
    // Match english words and numbers
    const regex = /[a-z0-9_]+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        words.push(match[0]);
    }
    return words;
}

export async function predictPrice(nameText, descText, brandText, catText, conditionId, shippingId) {
    await initPredictor();
    
    // Process Name (max 20)
    const nameWords = tokenize(nameText);
    const nameTokens = new BigInt64Array(20);
    const nameMask = new Uint8Array(20); 
    nameMask.fill(1); // 1 = True (pad)
    for (let i = 0; i < Math.min(20, nameWords.length); i++) {
        nameTokens[i] = BigInt(preprocessor.vocab[nameWords[i]] || 1);
        nameMask[i] = 0; // 0 = False (valid)
    }
    if (nameWords.length === 0) { nameTokens[0] = 0n; nameMask[0] = 0; }
    
    // Process Desc (max 100)
    const descWords = tokenize(descText);
    const descTokens = new BigInt64Array(100);
    const descMask = new Uint8Array(100);
    descMask.fill(1);
    for (let i = 0; i < Math.min(100, descWords.length); i++) {
        descTokens[i] = BigInt(preprocessor.vocab[descWords[i]] || 1);
        descMask[i] = 0;
    }
    if (descWords.length === 0) { descTokens[0] = 0n; descMask[0] = 0; }
    
    // Process Brand
    const brandId = new BigInt64Array([BigInt(preprocessor.brands[brandText || 'missing'] || 0)]);
    
    // Process Categories (Men/Shoes/Sneakers)
    const cats = (catText || 'missing/missing/missing').split('/');
    const c1Text = cats[0] || 'missing';
    const c2Text = cats[1] || 'missing';
    const c3Text = cats[2] || 'missing';
    const c1Id = new BigInt64Array([BigInt(preprocessor.cat1s[c1Text] || 0)]);
    const c2Id = new BigInt64Array([BigInt(preprocessor.cat2s[c2Text] || 0)]);
    const c3Id = new BigInt64Array([BigInt(preprocessor.cat3s[c3Text] || 0)]);
    
    // Process condition and ship
    const condId = new BigInt64Array([BigInt(conditionId || 1)]);
    const shipId = new BigInt64Array([BigInt(shippingId || 0)]);
    
    // Create tensors
    const feeds = {
        name: new ort.Tensor('int64', nameTokens, [1, 20]),
        name_mask: new ort.Tensor('bool', nameMask, [1, 20]),
        desc: new ort.Tensor('int64', descTokens, [1, 100]),
        desc_mask: new ort.Tensor('bool', descMask, [1, 100]),
        brand: new ort.Tensor('int64', brandId, [1]),
        c1: new ort.Tensor('int64', c1Id, [1]),
        c2: new ort.Tensor('int64', c2Id, [1]),
        c3: new ort.Tensor('int64', c3Id, [1]),
        cond: new ort.Tensor('int64', condId, [1]),
        ship: new ort.Tensor('int64', shipId, [1])
    };
    
    const results = await modelSession.run(feeds);
    const outputLogPrice = results.output.data[0];
    const predictedPrice = Math.expm1(outputLogPrice);
    
    return predictedPrice;
}
