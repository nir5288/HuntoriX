import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileData, fileName, mimeType } = await req.json();
    
    if (!fileData || !fileName) {
      return new Response(
        JSON.stringify({ error: 'File data and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing document: ${fileName} (${mimeType})`);

    // Use Llamaparse API to parse the document
    const LLAMAPARSE_API_KEY = Deno.env.get('LLAMAPARSE_API_KEY') || 'llx-vIRtjpIwE6QmAWVt5tO3bVhCJxFy64hVgIOhSEZ05R9uGwX7';
    
    // Convert base64 to blob
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0));
    const blob = new Blob([binaryData], { type: mimeType });

    // Create form data
    const formData = new FormData();
    formData.append('file', blob, fileName);

    const response = await fetch('https://api.cloud.llamaindex.ai/api/parsing/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLAMAPARSE_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Llamaparse API error:', response.status, errorText);
      throw new Error(`Failed to parse document: ${response.status}`);
    }

    const result = await response.json();
    console.log('Document parsed successfully');

    // Get the job ID and poll for results
    const jobId = result.id;
    let parsedText = '';
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
        headers: {
          'Authorization': `Bearer ${LLAMAPARSE_API_KEY}`,
        },
      });

      if (statusResponse.ok) {
        parsedText = await statusResponse.text();
        break;
      }

      if (statusResponse.status === 404 || statusResponse.status === 400) {
        // Still processing, wait and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } else {
        throw new Error(`Failed to get parse results: ${statusResponse.status}`);
      }
    }

    if (!parsedText) {
      throw new Error('Failed to parse document after multiple attempts');
    }

    return new Response(
      JSON.stringify({ success: true, text: parsedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-document function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
