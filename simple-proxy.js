import express from 'express';
import https from 'https';
import cors from 'cors';
import JSON5 from 'json5';

const app = express();
const globalChunks = [];
const knowledgeArray = [];

// Global function to process chunks immediately
function processChunks(globalChunks) {
  console.log("PROCESSING CHUNKS CALLED", globalChunks)
    try {
      // Convert all chunks to strings and decode (same logic as before)
      const allDecodedChunks = [];
      let requestId = Math.random().toString(36).substr(2, 9);
      console.log("-----------------BEFORE LOOP-----------------")
      for (let i = 0; i < globalChunks.length; i++) {
        const chunk = globalChunks[i];
        console.log("-----------------CHUNK LENGTH-----------------", chunk.length)
        if (chunk.length > 100) {
          const chunkText = chunk.toString('utf8');
          const decodedText = decodeUnicodeString(chunkText);
          allDecodedChunks.push(chunkText);
          console.log(`🔧 GLOBAL: IMMEDIATE - Processed chunk ${i + 1} (${chunk.length} → ${decodedText.length} chars)`);
        }
      }
      
      if (allDecodedChunks.length > 0) {
        const completeData = allDecodedChunks.join('');
        console.log(`📝 GLOBAL: IMMEDIATE - Complete data length: ${completeData.length} characters`);
        
        // Write files (abbreviated for immediate processing)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseFilename = `kbai-immediate-${requestId}-${timestamp}`;
        
        // fs.writeFileSync(`${baseFilename}-complete.txt`, completeData);
        console.log(`📁 GLOBAL: IMMEDIATE - Wrote complete data to ${baseFilename}-complete.txt`);
        
        // Parse SSE format quickly
        const lines = completeData.split('\n');
        const allJsonData = [];
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr && dataStr !== '[DONE]' && dataStr !== '') {
              try {
                const jsonData = JSON5.parse(dataStr);
                if (jsonData) {
                  console.log("JSON DATA WAS FOUND")
                  allJsonData.push(jsonData);
                }
              } catch (lineParseError) {
                console.log(`⚠️ GLOBAL: IMMEDIATE - Failed to parse line: ${dataStr.substring(0, 50)}...`);
              }
            }
          }
        }
        
        if (allJsonData.length > 0) {
          // fs.writeFileSync(`${baseFilename}-sse-parsed.json`, JSON.stringify(allJsonData, null, 2));
          console.log(`📁 GLOBAL: IMMEDIATE - Wrote ${allJsonData.length} SSE JSON objects`);
          
          // Extract knowledge arrays
          for (let i = 0; i < allJsonData.length; i++) {
            const jsonData = allJsonData[i];

            if (jsonData.result?.content?.[0]?.text) {
              const contentText = jsonData.result.content[0].text;
              console.log("CONTEXT TEXT REACHED ==========================", contentText)
              if (typeof contentText === 'string') {
                try {
                  const cleanedDataString = cleanProcessedText(contentText);
                  console.log("CLEANED DATA STRING ==========================", typeof cleanedDataString)
                  knowledgeArray.push(cleanedDataString)
                  console.log(`📦 GLOBAL: IMMEDIATE - Extracted content text from SSE object ${i + 1}`);
                  // res.write(contentText)
                } catch (knowledgeParseError) {
                  console.log(`⚠️ GLOBAL: IMMEDIATE - Failed to parse knowledge array from SSE object ${i + 1}`);
                  console.log(`⚠️ GLOBAL: IMMEDIATE - Knowledge parse error:`, knowledgeParseError);
                }
              }
            }
          }
        }
      }
      
    } catch (processingError) {
      console.error(`❌ GLOBAL: Error in immediate processing:`, processingError);
    }
  
}

// Enable CORS
app.use(cors());

// Global response debugging middleware
app.use((req, res, next) => {
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);


  res.middlewareState = {
    chunks: [],
    totalBytes: 0,
    hasLargeChunks: false,
    requestId: Math.random().toString(36).substr(2, 9),
    processingTimer: null,
    hasProcessed: false
  };
  
  res.write = function(chunk, encoding) {
    console.log(`\n🌐 GLOBAL: res.write called for ${req.method} ${req.url}`);
    console.log(`🌐 GLOBAL: Writing ${chunk ? chunk.length : 0} bytes`);
    console.log("============CHUNK INSIDE OF WRITE============", chunk)
    
    return originalWrite(chunk, encoding);
  };
  

  
  res.end = function(chunk) {
    console.log(`\n🌐 GLOBAL: res.end called for ${req.method} ${req.url}`);
    console.log(`🌐 GLOBAL: Final state - ${res.middlewareState.chunks.length} chunks, ${res.middlewareState.totalBytes} bytes`);
    console.log(`🌐 GLOBAL: Has large chunks: ${res.middlewareState.hasLargeChunks}`);
    console.log(`🌐 GLOBAL: Already processed: ${res.middlewareState.hasProcessed}`);
    
    // Clear any pending timer
    if (res.middlewareState.processingTimer) {
      clearTimeout(res.middlewareState.processingTimer);
      res.middlewareState.processingTimer = null;
      console.log(`🌐 GLOBAL: Cleared pending processing timer`);
    }
    
    // Handle any end chunk
    if (chunk) {
      console.log(`🌐 GLOBAL: Ending with ${chunk.length} bytes`);
      const preview = chunk.toString().substring(0, 50);
      console.log(`🌐 GLOBAL: End content: "${preview}${chunk.length > 50 ? '...' : ''}"`);
    }
    
    return originalEnd(chunk);
  };
  
  next();
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type,x-auth-token,x-kb-token,Accept,Cache-Control');
  next();
});

// Handle OPTIONS for CORS preflight - use middleware approach
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('\n=== CORS Preflight ===');
    console.log(`OPTIONS ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('Access-Control-Request-Method:', req.headers['access-control-request-method']);
    console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
    
    // Set comprehensive CORS headers
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type,x-auth-token,x-kb-token,Accept,Cache-Control');
    res.header('Access-Control-Allow-Credentials', 'false');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    console.log('CORS preflight response sent');
    res.sendStatus(200);
  } else {
    next();
  }
});



function decodeUnicodeString(str) {
  // First pass
  let decoded = str.replace(/\\u([\dA-F]{4})/gi, 
    (match, grp) => String.fromCharCode(parseInt(grp, 16)));
  // Second pass for any nested escapes
  return decoded.replace(/\\u([\dA-F]{4})/gi, 
    (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}

function cleanProcessedText(textData) {
  if (!textData || typeof textData !== 'string') {
    console.log(`⚠️ cleanProcessedText: Invalid input data:`, typeof textData);
    return textData;
  }

  try {
    let cleaned = textData;
    
    // Remove outer double quotes if present
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Remove all HTML tags (including <p>, </p>, <a>, etc.)
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Remove any remaining escaped quotes
    cleaned = cleaned.replace(/\\"/g, '"');
    
    console.log(`🧹 cleanProcessedText: Cleaned text from ${textData.length} to ${cleaned.length} chars`);
    return cleaned;
    
  } catch (error) {
    console.error(`❌ cleanProcessedText: Error cleaning text:`, error.message);
    return textData; // Return original data if cleaning fails
  }
}



// Manual proxy handler for both initial and session endpoints
app.all(['/kbai-proxy', '/MCP/message'], (req, res) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`\n=== FIXED KBAI PROXY REQUEST [${requestId}] ===`);
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Query params:', req.query);
  console.log('Request received at:', new Date().toISOString());
  
  // Check for auth tokens in both headers and query parameters
  const authToken = req.headers['x-auth-token'] || req.query['x-auth-token'];
  const kbToken = req.headers['x-kb-token'] || req.query['x-kb-token'];
  
  console.log('🔑 Auth token:', authToken ? `${authToken.substring(0, 10)}...` : '[MISSING]');
  console.log('🔑 KB token:', kbToken ? `${kbToken.substring(0, 10)}...` : '[MISSING]');
  
  if (!authToken || !kbToken) {
    console.error(`❌ [${requestId}] Missing required headers/params`);
    console.error('x-auth-token:', authToken ? '[PRESENT]' : '[MISSING]');
    console.error('x-kb-token:', kbToken ? '[PRESENT]' : '[MISSING]');
    
    res.status(400).json({ error: 'Missing required authentication headers/parameters' });
    return;
  }
   
  // Build target URL based on the request path
  let targetUrl;
  if (req.url.startsWith('/kbai-proxy')) {
    // Initial endpoint request (GET)
    // Remove auth params from query string since we'll send them as headers
    const url = new URL(req.url, 'http://localhost');
    url.searchParams.delete('x-auth-token');
    url.searchParams.delete('x-kb-token');
    
    // Add parameters to request structured JSON response
    url.searchParams.set('format', 'json');
    url.searchParams.set('output', 'structured');
    url.searchParams.set('responseType', 'json');
    url.searchParams.set('dataFormat', 'structured');
    
    const cleanPath = url.pathname + url.search;
    targetUrl = `https://api.kbai.org/MCP/sse${cleanPath.replace('/kbai-proxy', '')}`;
  } else if (req.url.startsWith('/MCP/message')) {
    // Session endpoint request (POST/GET)
    // Remove auth params from query string since we'll send them as headers
    const url = new URL(req.url, 'http://localhost');
    url.searchParams.delete('x-auth-token');
    url.searchParams.delete('x-kb-token');
    
    // Add parameters to request structured JSON response
    url.searchParams.set('format', 'json');
    url.searchParams.set('output', 'structured');
    url.searchParams.set('responseType', 'json');
    url.searchParams.set('dataFormat', 'structured');
    
    const cleanPath = url.pathname + url.search;
    targetUrl = `https://api.kbai.org${cleanPath}`;
  } else {
    res.status(404).json({ error: 'Unknown endpoint' });
    return;
  }
  
  console.log(`🎯 [${requestId}] Target URL:`, targetUrl);
  console.log(`🎯 [${requestId}] Method:`, req.method);
  
  // Set clean SSE headers immediately (like debug endpoint)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no'
  });
  
  console.log(`📡 [${requestId}] Headers sent, making request to KBAI...`);
  
  // Prepare headers for KBAI API
  const proxyHeaders = {
    'Accept': 'text/event-stream, application/json',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'x-auth-token': authToken,
    'x-kb-token': kbToken,
    'X-Requested-With': 'XMLHttpRequest',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'Mozilla/5.0 (compatible; KBAI-Client/1.0)',
    'X-Data-Format': 'json',
    'X-Response-Type': 'structured'
  };
  
  // Add Content-Type for POST requests
  if (req.method === 'POST') {
    console.log("🚀 MAKING POST REQUEST")
    // Already set Content-Type above
  }
  
  console.log(`🚀 [${requestId}] Making request to KBAI...`);
  
  // Make request to KBAI API
  const proxyReq = https.request(targetUrl, {
    method: req.method,
    headers: proxyHeaders
  }, (proxyRes) => {
    console.log(`\n=== ✅ KBAI Response Received [${requestId}] ===`);
    console.log(`📊 Request: ${req.method} ${req.url}`);
    console.log('📊 Status:', proxyRes.statusCode);
    console.log('📊 Status Message:', proxyRes.statusMessage);
    console.log('📊 Headers:', Object.keys(proxyRes.headers));
    console.log('📊 Content-Type:', proxyRes.headers['content-type']);
    console.log('📊 Content-Length:', proxyRes.headers['content-length']);
    console.log('📊 Transfer-Encoding:', proxyRes.headers['transfer-encoding']);
    
    // CRITICAL: Track which request type is getting data
    if (req.method === 'GET' && req.url.startsWith('/kbai-proxy')) {
      console.log(`🔍 [${requestId}] This is the GET /kbai-proxy request - should get session endpoint only`);
    } else if (req.method === 'POST' && req.url.startsWith('/MCP/message')) {
      console.log(`🔍 [${requestId}] This is the POST /MCP/message request - should get streaming data`);
    }
    
    // Initialize minimal state on the response object for tracking
    proxyRes.chunkCount = 0;
    
    console.log(`🔧 FIXED [${requestId}]: Proxy handler ready - global middleware will handle chunk processing`);
    
    proxyRes.on('data', async (chunk) => {
      proxyRes.chunkCount++;
      console.log(`📦 FIXED [${requestId}]: Got chunk ${proxyRes.chunkCount} from KBAI (${chunk.length} bytes)`);
      console.log(`📦 FIXED [${requestId}]: Writing directly to frontend...`);
      
      if (!res.writable) {
        console.error(`❌ FIXED [${requestId}]: Response is not writable! Cannot send chunk.`);
        return; // Skip this chunk
      }
      
      if (res.finished) {
        console.error(`❌ FIXED [${requestId}]: Response already finished! Cannot send chunk.`);
        return; // Skip this chunk
      }

      if(!chunk.toString().startsWith("Accepted") && !chunk.toString().startsWith("event: endpoint") && globalChunks.length < 1) {
        globalChunks.push(chunk.toString());
      }

      if(!chunk.toString().startsWith("Accepted")) {
        res.write(chunk);
        processChunks(globalChunks)
      }
      const preview = chunk.toString().substring(0, 100);
      console.log(`📦 FIXED [${requestId}]: Sent to frontend: "${preview}..."`);
    });

    proxyRes.on('end', () => {
      console.log(`\n🏁 FIXED [${requestId}]: KBAI stream ended`);
      console.log(`📊 FIXED [${requestId}]: Total chunks from KBAI: ${proxyRes.chunkCount}`);
      console.log(`🔧 FIXED [${requestId}]: Global middleware will process collected data in res.end()`);

      // Check if response is already finished (from immediate processing)

      // 🔒 CONDITIONAL STREAM CONTROL - Keep stream open until condition is met
      if (req.method === 'POST' && req.url.includes('/MCP/message')) {
        console.log(`🔄 FIXED [${requestId}]: POST /MCP/message - keeping SSE connection open with condition checking...`);
        
        // Only end if this was clearly an error response
        if (proxyRes.statusCode >= 400) {
          console.log(`❌ FIXED [${requestId}]: Error status ${proxyRes.statusCode}, ending response`);
          res.end();
        } else {
          // Set a timeout to close the connection if no more data comes
          const streamTimeout = setTimeout(() => {
            console.log(`⏰ FIXED [${requestId}]: Timeout waiting for streaming data, ending response`);
            res.end(knowledgeArray[0]);
          }, 30000); // 30 second timeout
          
          // If more data comes, clear the timeout
          res.on('close', () => {
            clearTimeout(streamTimeout);
            console.log(`🔌 FIXED [${requestId}]: Client closed connection`);
          });
          
          res.on('finish', () => {
            clearTimeout(streamTimeout);
            console.log(`✅ FIXED [${requestId}]: Response finished`);
          });
        }
        // For 200/202 responses, keep stream open for more data!
      } else {
        // For GET requests (session endpoint), end normally
        console.log(`✅ FIXED [${requestId}]: GET request complete, ending response`);
        res.end();
      }
    });
    
    proxyRes.on('error', (error) => {
      console.error(`❌ FIXED [${requestId}]: KBAI response error:`, error);
      res.end();
    });
  });
  
  proxyReq.on('error', (err) => {
    console.error(`\n❌ FIXED [${requestId}]: KBAI Request Error ===`);
    console.error('❌ Error:', err.message);
    res.end();
  });
  
  // Handle request body for POST requests
  if (req.method === 'POST') {
    console.log(`📤 FIXED [${requestId}]: Piping POST body to KBAI...`);
    req.pipe(proxyReq);
  } else {
    console.log(`📤 FIXED [${requestId}]: Sending GET request to KBAI...`);
    proxyReq.end();
  }

});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Simple proxy server running on http://localhost:${PORT}`);
  console.log('📡 Proxying requests from /kbai-proxy to https://api.kbai.org/MCP/sse');
  console.log('📡 Proxying requests from /MCP/message to https://api.kbai.org/MCP/message');
});

