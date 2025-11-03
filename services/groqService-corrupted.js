const { jsonrepair } = require('jsonrepair');
const { sanitizeContenido } = require('../lib/presentaciones');
const { corregirTexto, corregirLista } = require('../lib/ortografia');
const { ensureGroqClient } = require('./groqClient');

const MAX_LOG_LENGTH = 400;

const buildPrompt = (presentacion) => {
  const sanitizedContenido = sanitizeContenido(presentacion.contenido);
  const outline = sanitizedContenido
    .map((item, index) => `Slide ${index + 1}: ${typeof item === 'string' ? item : JSON.stringify(item)}`)
    .join('\n');

  const outlineJson = JSON.stringify(sanitizedContenido, null, 2);
  const idioma = presentacion.idioma || 'Español';
  const totalSlides = presentacion.numero_slides || sanitizedContenido.length || 5;

  return `Actúa como un investigador senior y storyteller que construye presentaciones tipo keynote con rigor académico.
Debes responder EXCLUSIVAMENTE con un JSON válido, sin comentarios, sin bloques de código y siguiendo este esquema EXACTO:
{
  "slides": [
    {
      "titulo": "Título breve profesional",
      "bullets": ["Viñeta 1", "Viñeta 2", "Viñeta 3"],
      "contenido": "Dos o tres párrafos de ampliación separados por \n\n"
    }
  ]
}

Reglas editoriales estrictas:
- Usa SIEMPRE comillas dobles y JSON estricto. No agregues texto fuera del JSON.
- Produce exactamente ${Math.max(3, Math.min(totalSlides, 12))} diapositivas con narrativa progresiva (introducción poderosa, desarrollo profundo, cierre memorable).
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
- Redacta en ${idioma} con tono profesional, entusiasta y claro; evita anglicismos innecesarios.
- La diapositiva final debe sintetizar hallazgos, proponer próximos pasos y terminar con una pregunta provocadora en el tercer bullet.
- Si algún dato es incierto, ofrece la mejor estimación explicando la base del cálculo.

Título general de la presentación: ${presentacion.titulo}
Número objetivo de diapositivas: ${totalSlides}
Resumen proporcionado por la persona usuaria (puedes reorganizarlo para mejorar la narrativa):
${outline}

Esquema JSON de referencia (utilízalo como lista de ideas, puedes ampliar o refinar):
${outlineJson}`;
};

const dedupeBullets = (bullets) => {
  const seen = new Set();
  const result = [];

  bullets.forEach((bullet) => {
    const key = (bullet || '').toLowerCase().trim();
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
      const bulletPattern = /[•\u2022▪◦●]\s*([^•\u2022▪◦●]+)/g;
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
        .replace(/[\u2022•▪◦●]/g, '\n')
        .replace(/\s*[\-–—]\s+/g, '\n')
        .replace(/\s*\d+[\).]\s+/g, '\n')
        .replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
        .split(/[\n\r]+/);

      return expanded.map((line) => line.trim()).filter(Boolean);
    })
    .map((t) => t.replace(/\s+/g, ' ').trim())
    .map((t) => (t.charAt(0).toUpperCase() + t.slice(1)))
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
  return text.replace(/^[•\u2022▪◦●*\-\d]+[\)\.\-\s]*/g, '').trim();
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CONNECTOR_TERMS = [
  'por otro lado',
  'por otra parte',
  'sin embargo',
  'no obstante',
  'de igual forma',
  'de igual manera',
  'por consiguiente',
  'por lo tanto',
  'por ende',
  'por el contrario',
  'mientras tanto',
  'por su parte',
  'además',
  'ademas',
  'asimismo',
  'igualmente',
  'incluso',
  'también',
  'tambien',
  'en cambio',
  'aunque',
  'mientras',
  'pero',
  'y',
  'e',
].sort((a, b) => b.length - a.length);

const CONNECTOR_PATTERN = CONNECTOR_TERMS.map((term) => escapeRegExp(term)).join('|');

const getConnectorThresholds = (connector) => {
  const lower = connector.toLowerCase();
  if (lower === 'y' || lower === 'e') {
    return { before: 80, after: 40 };
  }
  if (lower === 'pero' || lower === 'aunque' || lower === 'mientras' || lower === 'incluso') {
    return { before: 45, after: 30 };
  }
  return { before: 35, after: 25 };
};

const capitalizeSentence = (text) => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const splitSegmentByConnectors = (text) => {
  const sanitized = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  if (!sanitized) {
    return [];
  }

  const regex = new RegExp(`\\b(${CONNECTOR_PATTERN})\\b`, 'gi');
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(sanitized)) !== null) {
    const connector = match[0];
    const connectorStart = match.index;

    if (connectorStart <= lastIndex) {
      continue;
    }

    const preceding = sanitized.slice(lastIndex, connectorStart).trim();
    const following = sanitized.slice(connectorStart + connector.length).trim();

    if (!preceding || !following) {
      continue;
    }

    const { before: minBefore, after: minAfter } = getConnectorThresholds(connector);
    if (preceding.length < minBefore || following.length < minAfter) {
      continue;
    }

    segments.push(preceding);
    lastIndex = connectorStart;
  }

  const tail = sanitized.slice(lastIndex).trim();
  if (tail) {
    segments.push(tail);
  }

  return segments.length ? segments : [sanitized];
};

const expandSegmentsByConnectors = (segment) => {
  const queue = [segment];
  const result = [];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'string') {
      continue;
    }

    const pieces = splitSegmentByConnectors(current);
    if (pieces.length > 1) {
      queue.unshift(...pieces);
    } else {
      const trimmed = current.replace(/\s+/g, ' ').trim();
      if (trimmed) {
        result.push(capitalizeSentence(trimmed));
      }
    }
  }

  return result;
};

const prepareContentParagraphs = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[\u2022•▪◦●]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

const ensureParagraphClosure = (value) => {
  if (!value) return '';
  return /[.!?…]$/.test(value) ? value : `${value}.`;
};

const buildFallbackBullets = (sources) => {
  const entries = Array.isArray(sources) ? sources : [sources];

  return entries
    .filter((item) => typeof item === 'string')
    .flatMap((item) => splitCombinedBullet(item))
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

const splitCombinedBullet = (text) => {
  if (!text || typeof text !== 'string') return [];

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const baseSegments = normalized
    .split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÑÜ])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments = (baseSegments.length ? baseSegments : [normalized])
    .flatMap(expandSegmentsByConnectors)
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return segments.length ? segments : [];
};

const ensureBulletsForSlide = (bullets, fallbackText, fallbackSources = []) => {
  const baseSources = Array.isArray(fallbackSources) ? fallbackSources : [fallbackSources];

  const cleanedBullets = dedupeBullets(
    (bullets || [])
      .map(stripBulletPrefix)
      .flatMap(splitCombinedBullet)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
  );

  if (cleanedBullets.length >= 3) {
    return cleanedBullets.slice(0, 5);
  }

  const fallbackBullets = buildFallbackBullets([fallbackText, ...baseSources]);
  fallbackBullets.forEach((bullet) => {
    if (cleanedBullets.length >= 5) return;
    const key = bullet.toLowerCase();
    if (!cleanedBullets.some((item) => item.toLowerCase() === key)) {
      cleanedBullets.push(bullet);
    }
  });

  if (!cleanedBullets.length) {
    const fallback = (fallbackText || baseSources.join(' ') || '').replace(/\s+/g, ' ').trim();
    if (fallback) cleanedBullets.push(fallback);
  }

  return cleanedBullets.slice(0, 5);
};

const ensureTitleForSlide = (title, index) => {
  const normalized = typeof title === 'string'
    ? title.replace(/\s+/g, ' ').trim()
    : '';

  if (!normalized) {
    return `Sección ${index + 1}`;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const cleanGroqJsonString = (rawContent) => {
  let cleaned = (rawContent || '').toString().trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/```\s*$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}');

  return cleaned;
};

const tryParseJson = (text) => {
  const attempts = [
    (v) => v,
    (v) => v.replace(/'(.*?)'/g, '"$1"'),
    (v) => jsonrepair(v),
    (v) => jsonrepair(v.replace(/'(.*?)'/g, '"$1"')),
  ];

  let lastError = null;
  for (const transform of attempts) {
    try {
      const candidate = transform(text);
      return JSON.parse(candidate);
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
      if (!slide || typeof slide !== 'object') return null;

      const rawTitle = slide.titulo || slide.title || slide.heading;
      const title = rawTitle && typeof rawTitle === 'string'
        ? rawTitle.replace(/\s+/g, ' ').trim()
        : `Sección ${index + 1}`;

      const bullets = toBulletArray(slide.bullets || slide.puntos || slide.items || slide.lines);
      const rawContent = slide.contenido || slide.content || slide.descripcion || slide.resumen || '';
      const contentParagraphs = prepareContentParagraphs(rawContent);
      const content = contentParagraphs.map(ensureParagraphClosure).join('\n\n');

      return { title, bullets, content };
    })
    .filter(Boolean);

  if (!slides.length) {
    const emptyError = new Error('Groq devolvió un array de slides vacío.');
    emptyError.rawResponse = cleaned.slice(0, MAX_LOG_LENGTH);
    throw emptyError;
  }

  return slides;
};

const polishSlides = async (slides) => {
  if (!Array.isArray(slides) || !slides.length) return [];
  const processed = [];
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const correctedTitle = ensureTitleForSlide(await corregirTexto(slide.title), index);

    const originalBullets = Array.isArray(slide.bullets) ? slide.bullets : [];
    const sanitizedBullets = originalBullets.map(stripBulletPrefix);
    const fallbackCandidates = sanitizedBullets.length ? [...sanitizedBullets] : [];
    if (typeof slide.content === 'string' && slide.content.trim()) fallbackCandidates.push(slide.content);
    fallbackCandidates.push(slide.title);
    const correctedBullets = await corregirLista(sanitizedBullets.length ? sanitizedBullets : [correctedTitle]);
    const finalBullets = ensureBulletsForSlide(correctedBullets, correctedTitle, fallbackCandidates);
    const cleanBullets = finalBullets.map((b) => b.replace(/\s*\n\s*/g, ' ').trim().replace(/^[•\u2022▪◦●]+\s*/, ''));
    processed.push({ title: correctedTitle, bullets: cleanBullets });
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

module.exports = { generarSlidesConGroq };
const { jsonrepair } = require('jsonrepair');
const { sanitizeContenido } = require('../lib/presentaciones');
const { c      // SEGUNDO: Si no hay bullets, intentar separar por líneas y otros delimitadores
      const expanded = item
        .replace(/[\u2022•▪◦●]/g, '\n')
        .replace(/\s*[\-–—]\s+/g, '\n')
        .replace(/\s*\d+[\).\s+/g, '\n')
        // Agregar separación por cambio de caso (incluye números)
        .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
        .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
  .split(/[\n\r]+/);exto, corregirLista } = require('../lib/ortografia');
const { ensureGroqClient } = require('./groqClient');

const MAX_LOG_LENGTH = 400;

const insertSentenceBoundaries = (text) => {
  if (!text || typeof text !== 'string') return '';

  const withBoundaries = text
    .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1. $2')
    .replace(/([\.\!\?])(\S)/g, '$1 $2')
    .replace(/:(\S)/g, ': $1');

  const trimmed = withBoundaries.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  return trimmed;
};

const formatBulletText = (text) => {
  if (!text || typeof text !== 'string') return '';

  // Limpiar símbolos de bullet y espacios múltiples
  const cleanedSource = text
    .replace(/[\u2022•▪◦●]/g, ' ')
    .replace(/^[\s\-•\u2022▪◦●*\d]+[\).\-\s]*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedSource) return '';

  // Capitalizar primera letra
  const capitalized = cleanedSource.charAt(0).toUpperCase() + cleanedSource.slice(1);
  
  // Asegurar que termine con punto si no tiene puntuación final
  const withPeriod = /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`;
  
  return withPeriod;
};

const buildPrompt = (presentacion) => {
  const sanitizedContenido = sanitizeContenido(presentacion.contenido);
  const outline = sanitizedContenido
    .map((item, index) => `Slide ${index + 1}: ${typeof item === 'string' ? item : JSON.stringify(item)}`)
    .join('\n');

  const outlineJson = JSON.stringify(sanitizedContenido, null, 2);
  const idioma = presentacion.idioma || 'Español';
  const totalSlides = presentacion.numero_slides || sanitizedContenido.length;

  return `Actúa como un investigador senior y storyteller que construye presentaciones tipo keynote con rigor académico.
Debes responder EXCLUSIVAMENTE con un JSON válido, sin comentarios, sin bloques de código y siguiendo este esquema EXACTO:
{
  "slides": [
    {
      "titulo": "Título breve profesional",
      "bullets": ["Viñeta 1", "Viñeta 2", "Viñeta 3"],
      "contenido": "Dos o tres párrafos de ampliación separados por \n\n"
    }
  ]
}

Reglas editoriales estrictas:
- Usa SIEMPRE comillas dobles y JSON estricto. No agregues texto fuera del JSON.
- Produce exactamente ${Math.max(3, Math.min(totalSlides, 12))} diapositivas con narrativa progresiva (introducción poderosa, desarrollo profundo, cierre memorable).
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
- Redacta en ${idioma} con tono profesional, entusiasta y claro; evita anglicismos innecesarios.
- La diapositiva final debe sintetizar hallazgos, proponer próximos pasos y terminar con una pregunta provocadora en el tercer bullet.
- Si algún dato es incierto, ofrece la mejor estimación explicando la base del cálculo.

Título general de la presentación: ${presentacion.titulo}
Número objetivo de diapositivas: ${totalSlides}
Resumen proporcionado por la persona usuaria (puedes reorganizarlo para mejorar la narrativa):
${outline}

Esquema JSON de referencia (utilízalo como lista de ideas, puedes ampliar o refinar):
${outlineJson}`;
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
      // PRIMERO: Si el texto tiene bullets explícitos, separarlos
      const bulletPattern = /[•\u2022▪◦●]\s*([^•\u2022▪◦●]+)/g;
      const bulletMatches = [...item.matchAll(bulletPattern)];

      if (bulletMatches.length > 0) {
        // Separar cada match por cambio de minúscula a mayúscula (bullets pegados)
        return bulletMatches.flatMap((match) => {
          const text = match[1].trim();
          // Detectar oraciones pegadas: minúscula o número seguido de mayúscula
          const separated = text
            .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1|||$2')
            .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1|||$2');
          return separated.split('|||').map((s) => s.trim()).filter(Boolean);
        });
      }

      // SEGUNDO: Si no hay bullets, intentar separar por líneas y otros delimitadores
      const expanded = item
        .replace(/[\u2022•▪◦●]/g, '\n')
        .replace(/\s*[\-–—]\s+/g, '\n')
        .replace(/\s*\d+[\).]\s+/g, '\n')
        // Agregar separación por cambio de caso
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

const stripBulletPrefix = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/^[•\u2022▪◦●*\-\d]+[\).\-\s]*/g, '').trim();
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CONNECTOR_TERMS = [
  'por otro lado',
  'por otra parte',
  'sin embargo',
  'no obstante',
  'de igual forma',
  'de igual manera',
  'por consiguiente',
  'por lo tanto',
  'por ende',
  'por el contrario',
  'mientras tanto',
  'por su parte',
  'además',
  'ademas',
  'asimismo',
  'igualmente',
  'incluso',
  'también',
  'tambien',
  'en cambio',
  'aunque',
  'mientras',
  'pero',
  'y',
  'e',
].sort((a, b) => b.length - a.length);

const CONNECTOR_PATTERN = CONNECTOR_TERMS.map((term) => escapeRegExp(term)).join('|');

const getConnectorThresholds = (connector) => {
  const lower = connector.toLowerCase();
  if (lower === 'y' || lower === 'e') {
    return { before: 80, after: 40 };
  }
  if (lower === 'pero' || lower === 'aunque' || lower === 'mientras' || lower === 'incluso') {
    return { before: 45, after: 30 };
  }
  return { before: 35, after: 25 };
};

const capitalizeSentence = (text) => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const splitSegmentByConnectors = (text) => {
  const sanitized = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
  if (!sanitized) {
    return [];
  }

  const regex = new RegExp(`\\b(${CONNECTOR_PATTERN})\\b`, 'gi');
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(sanitized)) !== null) {
    const connector = match[0];
    const connectorStart = match.index;

    if (connectorStart <= lastIndex) {
      continue;
    }

    const preceding = sanitized.slice(lastIndex, connectorStart).trim();
    const following = sanitized.slice(connectorStart + connector.length).trim();

    if (!preceding || !following) {
      continue;
    }

    const { before: minBefore, after: minAfter } = getConnectorThresholds(connector);
    if (preceding.length < minBefore || following.length < minAfter) {
      continue;
    }

    segments.push(preceding);
    lastIndex = connectorStart;
  }

  const tail = sanitized.slice(lastIndex).trim();
  if (tail) {
    segments.push(tail);
  }

  return segments.length ? segments : [sanitized];
};

const expandSegmentsByConnectors = (segment) => {
  const queue = [segment];
  const result = [];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'string') {
      continue;
    }

    const pieces = splitSegmentByConnectors(current);
    if (pieces.length > 1) {
      queue.unshift(...pieces);
    } else {
      const trimmed = current.replace(/\s+/g, ' ').trim();
      if (trimmed) {
        result.push(capitalizeSentence(trimmed));
      }
    }
  }

  return result;
};

const prepareContentParagraphs = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[\u2022•▪◦●]/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) {
    return [];
  }

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => insertSentenceBoundaries(paragraph)
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean);
};

const ensureParagraphClosure = (value) => {
  if (!value) return '';
  return /[.!?…]$/.test(value) ? value : `${value}.`;
};

const buildFallbackBullets = (sources) => {
  const entries = Array.isArray(sources) ? sources : [sources];

  return entries
    .filter((item) => typeof item === 'string')
    .flatMap((item) => splitCombinedBullet(item))
    .map(formatBulletText)
    .filter(Boolean);
};

const splitCombinedBullet = (text) => {
  if (!text || typeof text !== 'string') return [];

  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const baseSegments = normalized
    .split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÑÜ])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const segments = (baseSegments.length ? baseSegments : [normalized])
    .flatMap(expandSegmentsByConnectors)
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return segments.length ? segments : [];
};

const ensureBulletsForSlide = (bullets, fallbackText, fallbackSources = []) => {
  const baseSources = Array.isArray(fallbackSources) ? fallbackSources : [fallbackSources];

  const cleanedBullets = dedupeBullets(
    bullets
      .map(stripBulletPrefix)
      .flatMap(splitCombinedBullet)
      .map(formatBulletText)
      .filter(Boolean)
  );

  if (cleanedBullets.length >= 3) {
    return cleanedBullets.slice(0, 5);
  }

  const fallbackBullets = buildFallbackBullets([fallbackText, ...baseSources]);
  fallbackBullets.forEach((bullet) => {
    if (cleanedBullets.length >= 5) return;
    const key = bullet.toLowerCase();
    if (!cleanedBullets.some((item) => item.toLowerCase() === key)) {
      cleanedBullets.push(bullet);
    }
  });

  if (!cleanedBullets.length) {
    const fallback = formatBulletText(fallbackText || baseSources.join(' '));
    if (fallback) {
      cleanedBullets.push(fallback);
    }
  }

  return cleanedBullets.slice(0, 5);
};

const ensureTitleForSlide = (title, index) => {
  const normalized = typeof title === 'string'
    ? title.replace(/\s+/g, ' ').trim()
    : '';

  if (!normalized) {
    return `Sección ${index + 1}`;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const cleanGroqJsonString = (rawContent) => {
  let cleaned = rawContent.trim().replace(/[\u200B-\u200D\uFEFF]/g, '');

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/```\s*$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  cleaned = cleaned
    .replace(/,\s*]/g, ']')
    .replace(/,\s*}/g, '}');

  return cleaned;
};

const tryParseJson = (text) => {
  const attempts = [
    (value) => value,
    (value) =>
      value
        .replace(/'(.*?)'/g, '"$1"')
        .replace(/\r?\n/g, '\n')
        .trim(),
    (value) => jsonrepair(value),
    (value) => jsonrepair(
      value
        .replace(/'(.*?)'/g, '"$1"')
        .replace(/\r?\n/g, '\n')
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
        ? rawTitle.replace(/\s+/g, ' ').trim()
        : `Sección ${index + 1}`;

      const bullets = toBulletArray(slide.bullets || slide.puntos || slide.items || slide.lines);
      const rawContent = slide.contenido || slide.content || slide.descripcion || slide.resumen || '';
      const contentParagraphs = prepareContentParagraphs(rawContent);
      const content = contentParagraphs.map(ensureParagraphClosure).join('\n\n');

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
    const fallbackCandidates = sanitizedBullets.length ? [...sanitizedBullets] : [];
    if (typeof slide.content === 'string' && slide.content.trim()) {
      fallbackCandidates.push(slide.content);
    }
    fallbackCandidates.push(slide.title);
    const correctedBullets = await corregirLista(sanitizedBullets.length ? sanitizedBullets : [correctedTitle]);
    const finalBullets = ensureBulletsForSlide(
      correctedBullets,
      correctedTitle,
      fallbackCandidates
    );

    // CRÍTICO: NO agregar el símbolo • aquí; eliminamos cualquier residuo por si viene desde el modelo
    // El generador de PPT manejará el formato de viñetas
    const cleanBullets = finalBullets.map((bullet) =>
      bullet
        .replace(/\s*\n\s*/g, ' ')
        .trim()
        .replace(/^[•\u2022▪◦●]+\s*/, '')
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