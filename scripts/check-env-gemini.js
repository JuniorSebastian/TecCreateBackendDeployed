/**
 * 🔍 Verificar qué API key de Gemini está usando el servidor
 * 
 * Este script muestra los primeros y últimos caracteres de la API key
 * configurada en las variables de entorno para verificar cuál está activa.
 */

require('dotenv').config();

const EXPECTED_KEY = 'AIzaSyBrUh1Jf2i-FkiNnfWlXJMFNtgSb5YFcd8';

function maskApiKey(key) {
  if (!key || key.length < 16) {
    return key || '(no configurada)';
  }
  const start = key.substring(0, 12);
  const end = key.substring(key.length - 8);
  return `${start}...${end}`;
}

function compareKeys(current, expected) {
  if (!current) {
    return '❌ NO CONFIGURADA';
  }
  if (current === expected) {
    return '✅ CORRECTA (nueva key)';
  }
  if (current.length === expected.length && current.substring(0, 8) === expected.substring(0, 8)) {
    return '⚠️ SIMILAR pero diferente';
  }
  return '❌ INCORRECTA (key vieja o diferente)';
}

console.log('🔍 Verificando configuración de GEMINI_API_KEY\n');
console.log('═'.repeat(60));

const currentKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';

console.log('\n📋 Variables de entorno actuales:');
console.log('─'.repeat(60));
console.log(`GEMINI_API_KEY:    ${maskApiKey(currentKey)}`);
console.log(`GEMINI_IMAGE_MODEL: ${model}`);

console.log('\n🎯 API Key esperada (nueva):');
console.log('─'.repeat(60));
console.log(`Expected:          ${maskApiKey(EXPECTED_KEY)}`);

console.log('\n🔬 Comparación:');
console.log('─'.repeat(60));
const status = compareKeys(currentKey, EXPECTED_KEY);
console.log(`Estado: ${status}`);

if (currentKey && currentKey !== EXPECTED_KEY) {
  console.log('\n⚠️  DETALLE DE DIFERENCIAS:');
  console.log('─'.repeat(60));
  console.log(`Longitud actual:   ${currentKey.length} caracteres`);
  console.log(`Longitud esperada: ${EXPECTED_KEY.length} caracteres`);
  console.log(`Primeros 8:        ${currentKey.substring(0, 8)} ${currentKey.substring(0, 8) === EXPECTED_KEY.substring(0, 8) ? '✓' : '✗'}`);
  console.log(`Últimos 8:         ${currentKey.substring(currentKey.length - 8)} ${currentKey.substring(currentKey.length - 8) === EXPECTED_KEY.substring(EXPECTED_KEY.length - 8) ? '✓' : '✗'}`);
}

console.log('\n═'.repeat(60));

if (currentKey === EXPECTED_KEY) {
  console.log('\n✅ CONFIGURACIÓN CORRECTA');
  console.log('   La API key está actualizada y debería funcionar.');
  process.exit(0);
} else if (!currentKey) {
  console.log('\n❌ API KEY NO CONFIGURADA');
  console.log('   Falta la variable de entorno GEMINI_API_KEY.');
  console.log('\n🔧 Solución:');
  console.log('   1. Exporta la variable: export GEMINI_API_KEY="AIzaSyBrUh1Jf2i-FkiNnfWlXJMFNtgSb5YFcd8"');
  console.log('   2. O actualízala en DigitalOcean: Settings → Environment Variables');
  process.exit(1);
} else {
  console.log('\n❌ API KEY INCORRECTA');
  console.log('   La API key actual no coincide con la nueva key generada.');
  console.log('\n🔧 Solución:');
  console.log('   1. Ve a DigitalOcean: Settings → Environment Variables');
  console.log('   2. Edita GEMINI_API_KEY y reemplázala con:');
  console.log(`      ${EXPECTED_KEY}`);
  console.log('   3. Guarda y espera el redespliegue automático');
  console.log('\n💡 Si estás en local, actualiza tu archivo .env');
  process.exit(1);
}
