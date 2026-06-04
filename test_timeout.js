const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function test() {
  console.log("Start");
  const result = await Promise.race([
    new Promise(r => setTimeout(() => r("Slow"), 5000)),
    wait(1000).then(() => { throw new Error("Timeout") })
  ]).catch(e => e.message);
  console.log(result);
}
test();
