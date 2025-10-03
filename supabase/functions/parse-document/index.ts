import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decompress } from "https://deno.land/x/zip@v1.2.5/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function parseDocx(base64Data: string): Promise<string> {
  try {
    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Write to temp file
    const tempPath = await Deno.makeTempFile({ suffix: '.docx' });
    await Deno.writeFile(tempPath, binaryData);
    
    // Create temp directory for extraction
    const extractPath = await Deno.makeTempDir();
    
    // Decompress the docx file
    await decompress(tempPath, extractPath);
    
    // Read document.xml from word directory
    const documentPath = `${extractPath}/word/document.xml`;
    const xmlContent = await Deno.readTextFile(documentPath);
    
    // Extract text from XML (simple regex approach)
    // This extracts content between <w:t> tags which contain the actual text
    const textMatches = xmlContent.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
    const extractedText = textMatches
      .map(match => {
        const textMatch = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
        return textMatch ? textMatch[1] : '';
      })
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Clean up temp files
    await Deno.remove(tempPath);
    await Deno.remove(extractPath, { recursive: true });
    
    return extractedText;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

async function parsePdf(base64Data: string): Promise<string> {
  // For PDF, we'll use a simple text extraction
  // Note: This is a basic implementation and may not work for all PDFs
  try {
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const text = new TextDecoder().decode(binaryData);
    
    // Try to extract readable text from PDF
    // PDFs contain text between BT and ET operators
    const textMatches = text.match(/\(([^)]+)\)/g) || [];
    const extractedText = textMatches
      .map(match => match.slice(1, -1))
      .join(' ')
      .replace(/\\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    return extractedText || 'Unable to extract text from PDF. Please try converting to a text file or DOCX.';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return 'Unable to extract text from PDF. Please try converting to a text file or DOCX.';
  }
}

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

    let parsedText = '';

    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      parsedText = await parseDocx(fileData);
    } else if (mimeType === 'application/pdf') {
      parsedText = await parsePdf(fileData);
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    console.log(`Successfully parsed document. Text length: ${parsedText.length}`);

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
