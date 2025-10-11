import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { BlobReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function parseDocx(base64Data: string): Promise<string> {
  try {
    // Convert base64 to Uint8Array
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Create a Blob from the data and read DOCX (ZIP) entries
    const blob = new Blob([binaryData], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const zipReader = new ZipReader(new BlobReader(blob));
    const entries = await zipReader.getEntries();

    // Find the main document XML
    const docEntry = entries.find((e: any) => e.filename === 'word/document.xml' || e.filename?.endsWith('/word/document.xml'));
    if (!docEntry) {
      await zipReader.close();
      throw new Error('word/document.xml not found in DOCX');
    }

    const xmlContent = await (docEntry as any).getData(new TextWriter());
    await zipReader.close();

    // Preserve paragraph boundaries and list items for better section detection
    const paragraphs = xmlContent.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    const lines = paragraphs.map((p: string) => {
      const isList = /<w:numPr>/.test(p);
      const runs = p.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g) || [];
      const text = runs
        .map((r: string) => (r.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/)?.[1] ?? ''))
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) return '';
      return isList ? `- ${text}` : text;
    }).filter(Boolean);

    const extractedText = lines.join('\n');
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
