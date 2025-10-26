const fs = require('fs');

const groqServiceContent = `const { jsonrepair } = require('jsonrepair');
const { sanitizeContenido } = require('../utils/presentaciones');
const { corregirTexto, corregirLista } = require('../utils/ortografia');
const { ensureGroqClient } = require('./groqClient');

const MAX_LOG_LENGTH = 400;

const insertSentenceBoundaries = (text) => {
  if (!text || typeof text !== 'string') return '';

  const withBoundaries = text
    .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1. $2')
    .replace(/([\\\.\\!\\?])(\\S)/g, '$1 $2')
    .replace(/:(\S)/g, ': $1');

  const trimmed = withBoundaries.replace(/\\s+/g, ' ').trim();
  if (!trimmed) return '';

  return trimmed;
};

const formatBulletText = (text) => {
  if (!text || typeof text !== 'string') return '';

  const cleanedSource = text
    .replace(/[\\u2022•▪◦●]/g, ' ')
    .replace(/^[\\s\\-•\\u2022▪◦●*\\d]+[\\)\.\\-\\s]*/g, '')
    .replace(/\\s+/g, ' ')
    .trim();

  if (!cleanedSource) return '';

  const capitalized = cleanedSource.charAt(0).toUpperCase() + cleanedSource.slice(1);
  
  const withPeriod = /[.!?…]$/.test(capitalized) ? capitalized : \\\`\\\${capitalized}.\\\`;
  
  return withPeriod;
};

const buildPrompt = (presentacion) => {
  const sanitizedContenido = sanitizeContenido(presentacion.contenido);
  const outline = sanitizedContenido
    .map((item, index) => \\\`Slide \\\${index + 1}: \\\${typeof item === 'string' ? item : JSON.stringify(item)}\\\`)
    .join('\\\\n');

  const outlineJson = JSON.stringify(sanitizedContenido, null, 2);
  const idioma = presentacion.idioma || 'Español';
  const totalSlides = presentacion.numero_slides || sanitizedContenido.length;

  return \\\`Actúa como un investigador senior y storyteller que construye presentaciones tipo keynote con rigor académico.
Debes responder EXCLUSIVAMENTE con un JSON válido, sin comentarios, sin bloques de código y siguiendo este esquema EXACTO:
{
  "slides": [
    {
      "titulo": "Título breve profesional",
      "bullets": ["Viñeta 1", "Viñeta 2", "Viñeta 3"],
      "contenido": "Dos o tres párrafos de ampliación separados por \\\\\\\\n\\\\\\\\n"
    }
  ]
}

Reglas editoriales estrictas:
- Usa SIEMPRE comillas dobles y JSON estricto. No agregues texto fuera del JSON.
- Produce exactamente \\\${Math.max(3, Math.min(totalSlides, 12))} diapositivas con narrativa progresiva (introducción poderosa, desarrollo profundo, cierre memorable).
- Cada diapositiva debe incluir:
  * "titulo": una frase de hasta 55 caracteres sin emojis ni mayúsculas completas.
  * "bullets": un arreglo de 3 oraciones completas (16-20 palabras) formateadas como viñetas; evita numeraciones, guiones o concatenar varias ideas en una sola entrada.
  * "contenido": 2 o 3 párrafos separados por dobles saltos de línea que amplíen los bullets con contexto adicional.
- Los bullets deben incluir datos concretos (fechas, cifras, nombres propios, lugares, consecuencias o comparaciones verificables).
- Combina contexto histórico/cultural con implicaciones prácticas y aprendizajes accionables; evita generalidades y relleno.
- Integra referencias a fuentes reconocidas (UNESCO, estudios académicos, informes oficiales) sólo si son reales.
- Varía la estructura sintáctica (causa-efecto, comparación, cronología, impacto) para mantener dinamismo narrativo.
- Cuida minuciosamente ortografía, acentuación y puntuación; entrega texto listo para publicar sin errores.
- Evita repetir literalmente títulos o bullets entre diapositivas; usa sinónimos cuando sea necesario.
- Redacta en \\\${idioma} con tono profesional, entusiasta y claro; evita anglicismos innecesarios.
- La diapositiva final debe sintetizar hallazgos, proponer próximos pasos y terminar con una pregunta provocadora en el tercer bullet.
- Si algún dato es incierto, ofrece la mejor estimación explicando la base del cálculo.

Título general de la presentación: \\\${presentacion.titulo}
Número objetivo de diapositivas: \\\${totalSlides}
Resumen proporcionado por la persona usuaria (puedes reorganizarlo para mejorar la narrativa):
\\\${outline}

Esquema JSON de referencia (utilízalo como lista de ideas, puedes ampliar o refinar):
\\\${outlineJson}\\\`;
};

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

const toBulletArray = (value) => {
  const process = (items) => items
    .filter((item) => typeof item === 'string')
    .flatMap((item) => {
      const bulletPattern = /[•\\u2022▪◦●]\\s*([^•\\u2022▪◦●]+)/g;
      const bulletMatches = [...item.matchAll(bulletPattern)];

      if (bulletMatches.length > 0) {
        return bulletMatches.flatMap((match) => {
          const text = match[1].trim();
          const separated = text
            .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1|||$2')
            .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1|||$2');
          return separated.split('|||').map((s) => s.trim()).filter(Boolean);
        });
      }

      const expanded = item
        .replace(/[\\u2022•▪◦●]/g, '\\n')
        .replace(/\\s*[\\-–—]\\s+/g, '\\n')
        .replace(/\\s*\\d+[\\)\\.\\s]+/g, '\\n')
        .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1\\n$2')
        .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1\\n$2')
        .split(/[\\n\\r]+/);

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

const stripBulletPrefix = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/^[•\\u2022▪◦●*\\-\\d]+[\\)\\.\\-\\s]*/g, '').trim();
};

const cleanGroqJsonString = (rawContent) => {
  let cleaned = rawContent.trim().replace(/[\\u200B-\\u200D\\uFEFF]/g, '');

  if (cleaned.startsWith('\\\`\\\`\\\`')) {
    cleaned = cleaned.replace(/^\\\`\\\`\\\`(?:json)?\\s*/i, '');
    cleaned = cleaned.replace(/\\\`\\\`\\\`\\s*$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned
    .replace(/,\\s*]/g, ']')
    .replace(/,\\s*}/g, '}');

  return cleaned;
};

const tryParseJson = (text) => {
  const attempts = [
    (value) => value,
    (value) =>
      value
        .replace(/'(.*?)'/g, '"$1"')
        .replace(/\\r?\\n/g, '\\n')
        .trim(),
    (value) => jsonrepair(value),
    (value) => jsonrepair(
      value
        .replace(/'(.*?)'/g, '"$1"')
        .replace(/\\r?\\n/g, '\\n')
    ),
  ];

  let lastError;
  for (const transform of attempts) {
    try {
      const candidate = transform(text);
      const jsonString = typeof candidate === 'string' ? candidate : JSON.stringify(candidate);
      return JSON.parse(jsonString);
    } catch (err) {
      lastError = err;
    }
  }

  const parseError = new Error('No se pudo parsear el JSON retornado por Groq.');
  parseError.cause = lastError;
  throw parseError;
};

const parseSlides = (rawContent) => {
  if (!rawContent) {
    throw new Error('Groq respondió vacío.');
  }

  const cleaned = cleanGroqJsonString(rawContent);

  let parsed;
  try {
    parsed = tryParseJson(cleaned);
  } catch (err) {
    const parseError = new Error('No se pudo parsear el JSON retornado por Groq.');
    parseError.rawResponse = cleaned.slice(0, MAX_LOG_LENGTH);
    parseError.cause = err;
    throw parseError;
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.slides)) {
    const structureError = new Error('El JSON de Groq no contiene un array "slides".');
    structureError.rawResponse = cleaned.slice(0, MAX_LOG_LENGTH);
    throw structureError;
  }

  const slides = parsed.slides
    .map((slide, index) => {
      if (!slide || typeof slide !== 'object') {
        return null;
      }

      const rawTitle = slide.titulo || slide.title || slide.heading;
      const title = rawTitle && typeof rawTitle === 'string'
        ? rawTitle.replace(/\\s+/g, ' ').trim()
        : \\\`Sección \\\${index + 1}\\\`;

      const bullets = toBulletArray(slide.bullets || slide.puntos || slide.items || slide.lines);
      const rawContent = slide.contenido || slide.content || slide.descripcion || slide.resumen || '';
      const content = rawContent;

      return {
        title,
        bullets,
        content,
      };
    })
    .filter(Boolean);

  if (!slides.length) {
    const emptyError = new Error('Groq devolvió un array de slides vacío.');
    emptyError.rawResponse = cleaned.slice(0, MAX_LOG_LENGTH);
    throw emptyError;
  }

  return slides;
};

const ensureTitleForSlide = (title, index) => {
  const normalized = typeof title === 'string'
    ? title.replace(/\\s+/g, ' ').trim()
    : '';

  if (!normalized) {
    return \\\`Sección \\\${index + 1}\\\`;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const ensureBulletsForSlide = (bullets, fallbackText) => {
  const cleanedBullets = dedupeBullets(
    bullets
      .map(stripBulletPrefix)
      .map(formatBulletText)
      .filter(Boolean)
  );

  if (cleanedBullets.length >= 3) {
    return cleanedBullets.slice(0, 5);
  }

  if (fallbackText && typeof fallbackText === 'string') {
    const fallback = formatBulletText(fallbackText);
    if (fallback && !cleanedBullets.some(b => b.toLowerCase() === fallback.toLowerCase())) {
      cleanedBullets.push(fallback);
    }
  }

  return cleanedBullets.slice(0, 5);
};

const polishSlides = async (slides) => {
  if (!Array.isArray(slides) || !slides.length) {
    return [];
  }

  const processed = [];

  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const correctedTitle = ensureTitleForSlide(await corregirTexto(slide.title), index);

    const originalBullets = Array.isArray(slide.bullets) ? slide.bullets : [];
    const sanitizedBullets = originalBullets.map(stripBulletPrefix);
    const correctedBullets = await corregirLista(sanitizedBullets.length ? sanitizedBullets : [correctedTitle]);
    const finalBullets = ensureBulletsForSlide(correctedBullets, correctedTitle);

    const cleanBullets = finalBullets.map((bullet) =>
      bullet
        .replace(/\\s*\\n\\s*/g, ' ')
        .trim()
        .replace(/^[•\\u2022▪◦●]+\\s*/, '')
    );

    processed.push({
      title: correctedTitle,
      bullets: cleanBullets,
    });
  }

  return processed;
};

async function generarSlidesConGroq(presentacion) {
  const client = ensureGroqClient();
  const prompt = buildPrompt(presentacion);

  const chatCompletion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_completion_tokens: 2048,
    top_p: 0.9,
    stream: false,
  });

  const respuesta = chatCompletion?.choices?.[0]?.message?.content;
  const slides = parseSlides(respuesta);
  return slides.length ? await polishSlides(slides) : slides;
}

module.exports = {
  generarSlidesConGroq,
};
`;

fs.writeFileSync('services/groqService.js', groqServiceContent, 'utf8');
console.log('✅ groqService.js creado exitosamente');
console.log('📊 Tamaño:', groqServiceContent.length, 'caracteres');
