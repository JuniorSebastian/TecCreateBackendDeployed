/**
 * 🧪 Test Gemini API Key
 * Verifica que la API key de Gemini funcione correctamente
 */

const https = require('https');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBrUh1Jf2i-FkiNnfWlXJMFNtgSb5YFcd8';
const MODEL = 'gemini-2.0-flash-preview-image-generation';

async function testGeminiAPI() {
  console.log('🧪 Testeando Gemini API Key...\n');
  console.log(`📋 API Key: ${GEMINI_API_KEY.substring(0, 20)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 8)}`);
  console.log(`🤖 Model: ${MODEL}\n`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = JSON.stringify({
    contents: [{
      parts: [{
        text: 'Generate a simple test image of a blue circle'
      }]
    }],
    generationConfig: {
      responseModalities: ['text', 'image']
    }
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Status Code: ${res.statusCode}\n`);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ API KEY FUNCIONA CORRECTAMENTE!\n');
            console.log('📸 Respuesta de Gemini:');
            console.log(JSON.stringify(response, null, 2));
            resolve(true);
          } else {
            console.log('❌ ERROR EN LA API KEY:\n');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.error?.code === 403) {
              console.log('\n🔴 La API key fue reportada como filtrada (leaked)');
              console.log('🔧 Solución:');
              console.log('   1. Ve a: https://aistudio.google.com/apikey');
              console.log('   2. ELIMINA la API key comprometida');
              console.log('   3. Crea una NUEVA API key');
              console.log('   4. Actualiza la variable GEMINI_API_KEY en DigitalOcean');
              console.log('   5. NO la compartas en chats públicos\n');
            }
            
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Error al parsear respuesta:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Ejecutar test
testGeminiAPI()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
