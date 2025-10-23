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

    const { number } = await req.json();

    if (!number) {
      return new Response(
        JSON.stringify({ error: 'Number is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check if number exists and is available
    const { data: existingNumber, error: fetchError } = await supabase
      .from('numbers')
      .select('*')
      .eq('number', number)
      .single();

    if (fetchError || !existingNumber) {
      console.error('Number not found:', number);
      return new Response(
        JSON.stringify({ error: 'Number not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    // Check if number is already used
    if (existingNumber.used && existingNumber.last_used_at) {
      const lastUsed = new Date(existingNumber.last_used_at);
      const now = new Date();
      const hoursPassed = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);

      if (hoursPassed < 24) {
        return new Response(
          JSON.stringify({ error: 'Number is already in use' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          }
        );
      }
    }

    // Mark number as used
    const { error: updateError } = await supabase
      .from('numbers')
      .update({
        used: true,
        last_used_at: new Date().toISOString(),
      })
      .eq('number', number);

    if (updateError) {
      console.error('Error updating number:', updateError);
      throw updateError;
    }

    console.log(`Number marked as used: ${number}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Number marked as used' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in use-number:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
