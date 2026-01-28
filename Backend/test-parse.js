// test-parse.js - robust tester for pdf-parse export shapes
const fs = require('fs');
const path = require('path');

const SAMPLE = 'sample.pdf'; // change to a real PDF file name in the same folder

(async () => {
  try {
    const imported = require('pdf-parse');
    console.log('require("pdf-parse") type:', typeof imported);
    console.log('keys:', Object.keys(imported || {}).slice(0, 50));

    // prepare candidate invokers (same logic as loader)
    const candidates = [];

    if (typeof imported === 'function') {
      candidates.push({ desc: 'direct function', fn: async (buf) => imported(buf) });
    }
    if (imported && typeof imported.default === 'function') {
      candidates.push({ desc: 'default function', fn: async (buf) => imported.default(buf) });
    }
    if (imported && typeof imported.parse === 'function') {
      candidates.push({ desc: 'parse function', fn: async (buf) => imported.parse(buf) });
    }
    if (imported && typeof imported.PDFParse === 'function') {
      candidates.push({
        desc: 'PDFParse constructor',
        fn: async (buf) => {
          try {
            const inst = new imported.PDFParse(buf);
            if (typeof inst.parse === 'function') return inst.parse();
          } catch (e) {
            // ignore
          }
          // try calling directly
          return imported.PDFParse(buf);
        }
      });
    }

    const fallbackKey = Object.keys(imported || {}).find(k => typeof imported[k] === 'function' && /parse|pdf|PDF/i.test(k));
    if (fallbackKey) candidates.push({ desc: `fallback ${fallbackKey}`, fn: async (buf) => imported[fallbackKey](buf) });

    const firstFuncKey = Object.keys(imported || {}).find(k => typeof imported[k] === 'function');
    if (firstFuncKey) candidates.push({ desc: `last-resort ${firstFuncKey}`, fn: async (buf) => imported[firstFuncKey](buf) });

    if (!candidates.length) {
      console.error('No callable candidates found on pdf-parse export. Aborting.');
      return;
    }

    // check file existence
    const pdfPath = path.resolve(__dirname, SAMPLE);
    if (!fs.existsSync(pdfPath)) {
      console.error(`No sample PDF found at ${pdfPath}. Please place a PDF named ${SAMPLE} here or change SAMPLE var.`);
      return;
    }

    const buffer = fs.readFileSync(pdfPath);

    for (const c of candidates) {
      try {
        console.log('Trying candidate:', c.desc);
        const result = await c.fn(buffer);
        console.log(`Candidate "${c.desc}" succeeded. Result type:`, typeof result);
        if (result && typeof result === 'object') {
          console.log('Result keys:', Object.keys(result).slice(0, 50));
          if (result.text) {
            console.log('Extracted text length:', (result.text || '').length);
            console.log('Preview:', (result.text || '').slice(0, 300));
          }
        } else if (typeof result === 'string') {
          console.log('Returned string, length:', result.length);
          console.log('Preview:', result.slice(0, 300));
        } else {
          console.log('Result (non-object):', result);
        }
        console.log('✅ SUCCESS with candidate:', c.desc);
        return;
      } catch (err) {
        console.warn(`Candidate "${c.desc}" failed:`, err && (err.message || err.toString()));
      }
    }

    console.error('All candidates failed to parse the PDF.');
  } catch (err) {
    console.error('Test script failed:', err && err.message ? err.message : err);
  }
})();
