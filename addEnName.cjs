const fs = require('fs');

const zhToEnMap = {
    '外套': 'jacket', '大衣': 'coat', '褲': 'pants', '寬褲': 'wide pants', '長褲': 'long pants', '短褲': 'shorts',
    '裙': 'skirt', '短裙': 'mini skirt', '長裙': 'long skirt', '洋裝': 'dress', '連身': 'jumpsuit', 
    'T恤': 't-shirt', '上衣': 'top', '襯衫': 'shirt', '衛衣': 'hoodie', '毛衣': 'sweater', '背心': 'vest',
    '針織衫': 'cardigan', '飛行外套': 'bomber jacket', '西裝外套': 'blazer', '西裝': 'suit',
    '工裝': 'cargo', '復古': 'vintage', '極簡': 'minimalist', '未來': 'futuristic',
    '運動': 'athletic', '街頭': 'streetwear', '初秋': 'fall', '春日': 'spring',
    '都會': 'urban', '度假': 'vacation', '派對': 'party', '休閒': 'casual', '甜美': 'sweet', 
    '正裝': 'formal', '波西米亞': 'bohemian', 'Y2K': 'Y2K',
    '棉': 'cotton', '純棉': 'pure cotton', '環保再生棉': 'recycled cotton',
    '亞麻': 'linen', '高透氣亞麻': 'breathable linen',
    '牛仔': 'denim', '重磅丹寧': 'heavy denim',
    '皮革': 'leather', '人造皮革': 'faux leather', 
    '針織': 'knit', '尼龍': 'nylon', '羊毛': 'wool', '聚酯纖維': 'polyester', 
    '絲綢': 'silk', '絲絨': 'velvet', '雪紡': 'chiffon', '亮片布': 'sequin', '燈芯絨': 'corduroy',
    '黑色': 'black', '黑': 'black', '白色': 'white', '白': 'white', '紅色': 'red', '酒紅': 'burgundy', 
    '藍色': 'blue', '海軍藍': 'navy blue', '霧霾藍': 'dusty blue', '綠色': 'green', '橄欖綠': 'olive green',
    '黃色': 'yellow', '芥末黃': 'mustard yellow', '棕色': 'brown', '焦糖棕': 'caramel', 
    '橘色': 'orange', '粉色': 'pink', '櫻花粉': 'cherry pink', '紫色': 'purple', '灰色': 'gray', '灰': 'gray',
    '大地色': 'earth tone', '青色': 'cyan',
    '單一色': 'solid color', '同色系': 'tonal', '撞色': 'color block', '對比色': 'contrast color', 
    '雙色拼接': 'two-tone', '漸層': 'gradient', '拼接': 'patchwork',
    '無印花': 'no print', '素色簡約': 'solid simple', '素色': 'solid',
    '條紋': 'striped', '直條紋': 'vertical stripes',
    '格紋': 'plaid', '復古格紋': 'vintage plaid', '千鳥格': 'houndstooth',
    '波點': 'polka dot', '碎花': 'floral', '幾何': 'geometric', '豹紋': 'leopard print',
    '字母': 'letter', '塗鴉': 'graffiti', '大面積文字Logo': 'large logo',
    '變形蟲': 'paisley', '渲染/紮染': 'tie-dye',
    '修身': 'slim fit', '緊身': 'tight', '正常版型': 'regular fit', '寬鬆': 'loose fit', 'Oversize': 'oversize',
    '直筒': 'straight', '傘狀': 'flare', '短版': 'cropped', '高腰': 'high waisted', '落地': 'floor length',
    '不對稱剪裁': 'asymmetrical',
    '大口袋': 'large pockets', '工裝大口袋': 'cargo pockets',
    '排扣': 'button-up', '金屬拉鍊': 'metal zipper', '金屬拉鍊外露': 'exposed zipper',
    '綁帶': 'tie', '綁帶/繞頸': 'halter', '抽繩': 'drawstring', '抽繩抓皺': 'drawstring ruched',
    '抓皺': 'ruched', '流蘇': 'fringe', '蕾絲': 'lace', '透明薄紗': 'sheer mesh', '荷葉邊': 'ruffle',
    '鏤空': 'cutout', '鏤空剪裁': 'cutout design', '大面積破洞': 'distressed',
    '精緻刺繡': 'embroidery', '珍珠鑲嵌': 'pearl embellished', '墊肩': 'shoulder pads', '誇張墊肩': 'exaggerated shoulder pads',
    '機能防潑水': 'water resistant', '無特殊細節': 'no detail'
};

function translate(text) {
    if (zhToEnMap[text]) return zhToEnMap[text];
    
    // try replacing parts
    let result = text;
    // Sort keys by length descending to match longest phrases first
    const keys = Object.keys(zhToEnMap).sort((a,b) => b.length - a.length);
    for (const k of keys) {
        if (result.includes(k)) {
            result = result.split(k).join(` ${zhToEnMap[k]} `);
        }
    }
    return result.replace(/\s+/g, ' ').trim() || text;
}

const data = JSON.parse(fs.readFileSync('public/db.json', 'utf8'));

if (data.ai_trend_elements) {
    data.ai_trend_elements.forEach(el => {
        el.enName = translate(el.name);
    });
}

fs.writeFileSync('public/db.json', JSON.stringify(data, null, 2));
console.log("Updated db.json");
