/**
 * Script para verificar qué API key está cargando el servidor en producción
 * Ejecutar: node scripts/check-env-production.js
 */

console.log('='.repeat(60));
console.log('🔍 VERIFICACIÓN DE ENVIRONMENT VARIABLES EN PRODUCCIÓN');
console.log('='.repeat(60));
console.log('');

const maskKey = (key) => {
  if (!key) return 'NO DEFINIDA';
  if (key.length < 20) return key.slice(0, 8) + '...';
  return key.slice(0, 20) + '...' + key.slice(-8);
};

console.log('📋 GEMINI_API_KEY:');
console.log('  Valor:', maskKey(process.env.GEMINI_API_KEY));
console.log('  Longitud:', process.env.GEMINI_API_KEY?.length || 0);
console.log('  Primeros 20 chars:', process.env.GEMINI_API_KEY?.slice(0, 20) || 'N/A');
console.log('  Últimos 8 chars:', process.env.GEMINI_API_KEY?.slice(-8) || 'N/A');
console.log('');

console.log('📋 OTRAS VARIABLES GEMINI:');
console.log('  GEMINI_IMAGE_MODEL:', process.env.GEMINI_IMAGE_MODEL || 'NO DEFINIDA');
console.log('  GEMINI_IMAGE_MODEL_FALLBACK:', process.env.GEMINI_IMAGE_MODEL_FALLBACK || 'NO DEFINIDA');
console.log('');

console.log('📋 AMBIENTE:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'NO DEFINIDA');
console.log('  PORT:', process.env.PORT || 'NO DEFINIDA');
console.log('');

// Verificar si la key es una de las conocidas
const knownKeys = {
  'AIzaSyDHvfKoqlqSBMDH6l': 'API KEY VIEJA (expirada)',
  'AIzaSyBrUh1Jf2i-FkiNnf': 'API KEY SEGUNDA (también rechazada)',
};

const currentKey = process.env.GEMINI_API_KEY?.slice(0, 20);
const keyStatus = knownKeys[currentKey] || 'NUEVA API KEY (desconocida)';

console.log('🔑 STATUS DE LA API KEY:');
console.log('  Identificación:', keyStatus);
console.log('');

if (currentKey === 'AIzaSyDHvfKoqlqSBMDH6l') {
  console.log('❌ PROBLEMA: Usando la API key VIEJA (expirada)');
  console.log('   Solución: Actualizar GEMINI_API_KEY en DigitalOcean');
} else if (currentKey === 'AIzaSyBrUh1Jf2i-FkiNnf') {
  console.log('⚠️  ADVERTENCIA: Usando la segunda API key (rechazada por Google)');
  console.log('   Solución: Generar una TERCERA API key nueva');
} else {
  console.log('✅ Usando una API key diferente a las anteriores');
}

console.log('');
console.log('='.repeat(60));
