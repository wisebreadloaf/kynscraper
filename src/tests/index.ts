import { automate } from "../scraper/scraper";

async function runTests() {
  console.log("Step 1: Automating web interactions...");
  await automate();
}

runTests().catch(console.error);
