import "https://deno.land/std@0.224.0/dotenv/load.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FILES = [
  { path: "tmp/headphones.csv", type: "headphones", clear: true },
  { path: "tmp/cameras.csv", type: "cameras", clear: false },
  { path: "tmp/wearables.csv", type: "wearables", clear: false },
  { path: "tmp/hdd.csv", type: "hdd", clear: false },
  { path: "tmp/mobile_acc.csv", type: "mobile_acc", clear: false },
];

for (const file of FILES) {
  Deno.test({
    name: `Process ${file.type} CSV`,
    sanitizeResources: false,
    sanitizeOps: false,
  }, async () => {
    const csvContent = await Deno.readTextFile(file.path);
    console.log(`Read ${file.type}: ${csvContent.length} chars`);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-csv-products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        csv_content: csvContent,
        file_type: file.type,
        clear_existing: file.clear,
      }),
    });

    const text = await response.text();
    console.log(`${file.type} response (${response.status}):`, text);

    if (!response.ok) {
      throw new Error(`Failed to process ${file.type}: ${response.status} - ${text}`);
    }

    const result = JSON.parse(text);
    console.log(`${file.type}: ${result.products_inserted}/${result.products_found} products inserted`);
  });
}
