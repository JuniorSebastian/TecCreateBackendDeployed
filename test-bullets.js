const { jsonrepair } = require('jsonrepair');

// Simulación simplificada de toBulletArray para testing
const toBulletArray = (value) => {
  const dedupeBullets = (bullets) => {
    const seen = new Set();
    const result = [];
    bullets.forEach((bullet) => {
      const key = bullet.toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(bullet);
      }
    });
    return result;
  };

  const formatBulletText = (text) => {
    if (!text || typeof text !== 'string') return '';
    const cleanedSource = text
      .replace(/[\u2022•▪◦●]/g, ' ')
      .replace(/^[\s\-•\u2022▪◦●*\d]+[\).\-\s]*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanedSource) return '';
    const capitalized = cleanedSource.charAt(0).toUpperCase() + cleanedSource.slice(1);
    const withPeriod = /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`;
    return withPeriod;
  };

  const process = (items) => items
    .filter((item) => typeof item === 'string')
    .flatMap((item) => {
      // PRIMERO: Si el texto tiene bullets explícitos, separarlos
      const bulletPattern = /[•\u2022▪◦●]\s*([^•\u2022▪◦●]+)/g;
      const bulletMatches = [...item.matchAll(bulletPattern)];

      if (bulletMatches.length > 0) {
        // Separar cada match por cambio de minúscula a mayúscula (bullets pegados)
        return bulletMatches.flatMap((match) => {
          const text = match[1].trim();
          // Detectar oraciones pegadas: minúscula seguida de mayúscula
          const separated = text.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1|||$2');
          return separated.split('|||').map((s) => s.trim()).filter(Boolean);
        });
      }

      // SEGUNDO: Si no hay bullets, intentar separar por líneas y otros delimitadores
      const expanded = item
        .replace(/[\u2022•▪◦●]/g, '\n')
        .replace(/\s*[\-–—]\s+/g, '\n')
        .replace(/\s*\d+[\).]\s+/g, '\n')
        .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
        .split(/[\n\r]+/);

      return expanded.map((line) => line.trim()).filter(Boolean);
    })
    .map(formatBulletText)
    .filter(Boolean);

  if (Array.isArray(value)) {
    return dedupeBullets(process(value)).slice(0, 5);
  }

  if (typeof value === 'string') {
    return dedupeBullets(process([value])).slice(0, 5);
  }

  return [];
};

// Test cases
console.log('=== TEST 1: Bullets concatenados con símbolo • ===');
const test1 = '•Macchupichu es un sitio arqueológico ubicado en PerúFue declarado Patrimonio de la Humanidad por la UNESCO en 1983Es uno de los destinos turísticos más populares de América Latina';
const result1 = toBulletArray(test1);
console.log('Input:', test1);
console.log('Output:', result1);
console.log('Cantidad de bullets:', result1.length);
console.log('');

console.log('=== TEST 2: Bullets con múltiples símbolos ===');
const test2 = '•El 11 de Septiembre es una fecha que marca un hito en la historia modernaUn día que cambió el curso de la política y la seguridad globalConmemorando los ataques terroristas en Estados Unidos en 2001';
const result2 = toBulletArray(test2);
console.log('Input:', test2);
console.log('Output:', result2);
console.log('Cantidad de bullets:', result2.length);
console.log('');

console.log('=== TEST 3: Bullets separados correctamente ===');
const test3 = '•Primera viñeta correcta\n•Segunda viñeta correcta\n•Tercera viñeta correcta';
const result3 = toBulletArray(test3);
console.log('Input:', test3);
console.log('Output:', result3);
console.log('Cantidad de bullets:', result3.length);
console.log('');

console.log('=== TEST 4: Array de bullets ===');
const test4 = [
  '•Primer punto con mayúscula',
  '•Segundo punto también correcto',
  '•Tercer punto bien formado'
];
const result4 = toBulletArray(test4);
console.log('Input:', test4);
console.log('Output:', result4);
console.log('Cantidad de bullets:', result4.length);
console.log('');

console.log('=== TEST 5: Texto sin bullets pero con cambios de caso ===');
const test5 = 'Primera oraciónSegunda oraciónTercera oración';
const result5 = toBulletArray(test5);
console.log('Input:', test5);
console.log('Output:', result5);
console.log('Cantidad de bullets:', result5.length);
console.log('');

// Verificación
console.log('=== RESUMEN ===');
console.log('✅ Test 1:', result1.length === 3 ? 'PASÓ' : 'FALLÓ');
console.log('✅ Test 2:', result2.length === 3 ? 'PASÓ' : 'FALLÓ');
console.log('✅ Test 3:', result3.length === 3 ? 'PASÓ' : 'FALLÓ');
console.log('✅ Test 4:', result4.length === 3 ? 'PASÓ' : 'FALLÓ');
console.log('✅ Test 5:', result5.length === 3 ? 'PASÓ' : 'FALLÓ');
