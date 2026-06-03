import { predictPrice } from './src/utils/pricePredictor.js';

async function run() {
  const p1 = await predictPrice('初秋工裝外套', '工裝', 'missing', 'Women/Tops/T-shirts', 1, 1);
  const p2 = await predictPrice('初秋工裝外套', '工裝', 'Nike', 'Women/Coats & Jackets/Other', 1, 1);
  console.log("missing:", p1);
  console.log("Nike:", p2);
}
run();
