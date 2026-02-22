import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { bucket, path, file_type, clear_existing } = await req.json();

    // Download CSV from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket || "csv-uploads")
      .download(path || "digikala_general.csv");

    if (downloadError) throw downloadError;
    const csvContent = await fileData.text();
    console.log(`Downloaded CSV: ${csvContent.length} chars`);

    // Forward to process-csv-products
    const processUrl = `${supabaseUrl}/functions/v1/process-csv-products`;
    const response = await fetch(processUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        csv_content: csvContent,
        file_type: file_type || "digikala_general",
        clear_existing: clear_existing || false,
      }),
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
