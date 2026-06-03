import * as ort from 'onnxruntime-node'; // Use node for testing
import fs from 'fs';

async function run() {
  const prep = JSON.parse(fs.readFileSync('./public/preprocessor.json'));
  const session = await ort.InferenceSession.create('./public/price_model.onnx');
  
  const nameTokens = new BigInt64Array(20).fill(0n);
  const nameMask = new Uint8Array(20).fill(1);
  const descTokens = new BigInt64Array(100).fill(0n);
  const descMask = new Uint8Array(100).fill(1);
  
  const brandId = new BigInt64Array([BigInt(prep.brands['Nike'] || 0)]);
  const c1Id = new BigInt64Array([BigInt(prep.cat1s['Women'] || 0)]);
  const c2Id = new BigInt64Array([BigInt(prep.cat2s['Pants'] || 0)]);
  const c3Id = new BigInt64Array([BigInt(prep.cat3s['Other'] || 0)]);
  const condId = new BigInt64Array([1n]);
  const shipId = new BigInt64Array([1n]);
  
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
  
  const results = await session.run(feeds);
  console.log("Empty Output:", Math.expm1(results.output.data[0]));
}
run();
