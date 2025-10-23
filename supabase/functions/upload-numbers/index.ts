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

    const { numbers } = await req.json();

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid numbers array' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Prepare numbers for insertion
    const numbersToInsert = numbers.map((num: string) => ({
      number: num.trim(),
      last_used: null,
    }));

    // Insert numbers (on conflict do nothing to avoid duplicates)
    const { data, error } = await supabase
      .from('phone_numbers')
      .upsert(numbersToInsert, { onConflict: 'number', ignoreDuplicates: true });

    if (error) {
      console.error('Error inserting numbers:', error);
      throw error;
    }

    console.log(`Successfully uploaded ${numbers.length} numbers`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${numbers.length} numbers uploaded successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in upload-numbers:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
