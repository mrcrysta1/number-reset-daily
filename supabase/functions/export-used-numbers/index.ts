import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all used numbers
    const { data: usedNumbers, error } = await supabase
      .from('numbers')
      .select('number, last_used_at')
      .eq('used', true)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Error fetching used numbers:', error);
      throw error;
    }

    // Create CSV content
    let csvContent = 'number,last_used_at\n';
    (usedNumbers || []).forEach((num: any) => {
      csvContent += `${num.number},${num.last_used_at}\n`;
    });

    console.log(`Exporting ${usedNumbers?.length || 0} used numbers`);

    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="used_numbers.csv"',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error in export-used-numbers:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
