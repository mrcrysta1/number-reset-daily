import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NumberRecord {
  id: string;
  number: string;
  used: boolean;
  last_used_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get pagination params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 100;
    const offset = (page - 1) * limit;

    // Fetch numbers from database
    const { data: allNumbers, error: fetchError } = await supabase
      .from('numbers')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching numbers:', fetchError);
      throw fetchError;
    }

    // Filter available numbers (reset logic)
    const availableNumbers = (allNumbers || []).filter((num: NumberRecord) => {
      if (!num.used || !num.last_used_at) {
        return !num.used;
      }

      // Check if 24 hours have passed
      const lastUsed = new Date(num.last_used_at);
      const now = new Date();
      const hoursPassed = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60);

      if (hoursPassed < 24) {
        return false;
      }

      // Check if current time in Pakistan is past 5 AM
      const pktTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
      const pktHour = pktTime.getHours();

      return pktHour >= 5;
    });

    // Update database to reset available numbers
    const numbersToReset = availableNumbers.filter((num: NumberRecord) => num.used);
    if (numbersToReset.length > 0) {
      const idsToReset = numbersToReset.map((num: NumberRecord) => num.id);
      await supabase
        .from('numbers')
        .update({ used: false, last_used_at: null })
        .in('id', idsToReset);
    }

    // Paginate results
    const paginatedNumbers = availableNumbers.slice(offset, offset + limit);
    const totalPages = Math.ceil(availableNumbers.length / limit);

    console.log(`Returning ${paginatedNumbers.length} numbers (page ${page}/${totalPages})`);

    return new Response(
      JSON.stringify({
        numbers: paginatedNumbers,
        page,
        totalPages,
        total: availableNumbers.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-numbers:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
