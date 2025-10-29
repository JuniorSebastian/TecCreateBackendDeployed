const { jsonrepair } = require('jsonrepair');
const { sanitizeContenido } = require('../utils/presentaciones');
const { corregirTexto, corregirLista } = require('../utils/ortografia');
const { ensureGroqClient } = require('./groqClient');

const MAX_LOG_LENGTH = 400;
const MAX_GROQ_ATTEMPTS = Number.parseInt(process.env.GROQ_JSON_MAX_ATTEMPTS || '3', 10);
const GROQ_ATTEMPT_DELAY_MS = Number.parseInt(process.env.GROQ_JSON_ATTEMPT_DELAY_MS || '600', 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const insertSentenceBoundaries = (text) => {
  if (!text || typeof text !== 'string') return '';

  const withBoundaries = text
    .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1. $2')
    .replace(/([\.\!\?])(\S)/g, '$1 $2')
    .replace(/:(S)/g, ': $1');

  const trimmed = withBoundaries.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';

  return trimmed;
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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parsePositiveInteger = (value) => {
  if (value == null) {
    return null;
  }

  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const resolveDesiredSlideCount = (presentacion) => {
  const MAX_SLIDES = 20;
  const DEFAULT_SLIDES = 8;

  const candidates = [];

  if (presentacion && typeof presentacion === 'object') {
    const directCandidates = [
      presentacion.numero_slides,
      presentacion.numeroSlides,
      presentacion.numeroSlide,
      presentacion.slidesCount,
      presentacion.totalSlides,
    ];

    directCandidates.forEach((candidate) => {
      const parsed = parsePositiveInteger(candidate);
      if (parsed) {
        candidates.push(parsed);
      }
    });

    if (Array.isArray(presentacion.contenido)) {
      const lengthCandidate = parsePositiveInteger(presentacion.contenido.length);
      if (lengthCandidate) {
        candidates.push(lengthCandidate);
      }
    }
  }

  const resolved = candidates.find((value) => Number.isFinite(value) && value > 0);
  if (resolved) {
    return clamp(resolved, 1, MAX_SLIDES);
  }

  return DEFAULT_SLIDES;
};

const buildFallbackSlide = (presentacion, index, fallbackSections) => {
  const sections = Array.isArray(fallbackSections)
    ? fallbackSections
    : sanitizeContenido(presentacion?.contenido);

  const section = sections[index];
  const baseTitle = typeof presentacion?.titulo === 'string' && presentacion.titulo.trim()
    ? `${presentacion.titulo.trim()} — Sección ${index + 1}`
    : `Sección ${index + 1}`;

  if (typeof section === 'string') {
    const trimmed = section.trim();
    const title = trimmed || baseTitle;
    return {
      title,
      bullets: [title],
      contenido: trimmed || title,
    };
  }

  if (Array.isArray(section)) {
    const meaningful = section.filter((item) => typeof item === 'string' && item.trim());
    const title = meaningful[0]?.trim() || baseTitle;
    return {
      title,
      bullets: meaningful.length ? meaningful : [title],
      contenido: meaningful.join(' '),
    };
  }

  if (section && typeof section === 'object') {
    const rawTitle = section.titulo || section.title || section.heading || section.seccion;
    const title = typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle.trim() : baseTitle;
    const bulletsSource = section.bullets
      || section.puntos
      || section.items
      || section.lista
      || section.lines
      || section.detalles
      || section.texto
      || section.descripcion
      || section.description
      || [];

    const bullets = Array.isArray(bulletsSource)
      ? bulletsSource.filter((item) => typeof item === 'string' && item.trim())
      : typeof bulletsSource === 'string' && bulletsSource.trim()
        ? [bulletsSource.trim()]
        : [title];

    const contenido = typeof section.contenido === 'string' && section.contenido.trim()
      ? section.contenido.trim()
      : typeof section.descripcion === 'string' && section.descripcion.trim()
        ? section.descripcion.trim()
        : bullets.join(' ');

    return {
      title,
      bullets: bullets.length ? bullets : [title],
      contenido,
    };
  }

  return {
    title: baseTitle,
    bullets: [baseTitle],
    contenido: baseTitle,
  };
};

const enforceSlideCount = (slides, presentacion) => {
  const desiredCount = resolveDesiredSlideCount(presentacion);
  const working = Array.isArray(slides) ? slides.slice(0, desiredCount) : [];
  const fallbackSections = sanitizeContenido(presentacion?.contenido);

  while (working.length < desiredCount) {
    const nextIndex = working.length;
    working.push(buildFallbackSlide(presentacion, nextIndex, fallbackSections));
  }

  return {
    desiredCount,
    slides: working,
  };
};

const buildPrompt = (presentacion) => {
  const tema = presentacion.titulo || 'Presentación profesional';
  const slideCount = resolveDesiredSlideCount(presentacion);
  const detailLevel = presentacion.detailLevel || presentacion.nivel || 'Medium';
  const writingStyle = presentacion.estilo || presentacion.style || 'Professional';

  // Configuración basada en nivel de detalle
  const detailConfig = {
    Brief: {
      bulletCount: 3,
      bulletWordRange: '8-12',
      contentSentences: 2,
      description: 'conciso y directo',
    },
    Medium: {
      bulletCount: 4,
      bulletWordRange: '10-18',
      contentSentences: 3,
      description: 'equilibrado y profesional',
    },
    Detailed: {
      bulletCount: 5,
      bulletWordRange: '15-25',
      contentSentences: 4,
      description: 'exhaustivo y profundo',
    },
  };

  // Configuración de estilos de escritura
  const styleConfig = {
    Professional: {
      tone: 'formal y técnico',
      vocabulary: 'terminología profesional especializada',
      structure: 'Usa lenguaje corporativo, datos precisos, métricas y KPIs',
      examples: 'casos de estudio empresariales y estadísticas verificables',
    },
    Casual: {
      tone: 'conversacional y accesible',
      vocabulary: 'lenguaje cotidiano y analogías simples',
      structure: 'Usa ejemplos del día a día, preguntas retóricas y tono cercano',
      examples: 'situaciones cotidianas y metáforas familiares',
    },
    Academic: {
      tone: 'riguroso y analítico',
      vocabulary: 'terminología científica y académica',
      structure: 'Usa referencias conceptuales, análisis crítico y argumentación fundamentada',
      examples: 'teorías, modelos y estudios de investigación',
    },
  };

  const config = detailConfig[detailLevel] || detailConfig.Medium;
  const style = styleConfig[writingStyle] || styleConfig.Professional;

  return `Genera una lista de diapositivas sobre el siguiente tema en formato JSON válido y altamente informativo.

Estructura exacta:
{
  "slides": [
    {
      "titulo": "string",
      "bullets": ["string", "string", "string"],
      "contenido": "string"
    }
  ]
}

Instrucciones estrictas:
- El array "slides" debe contener EXACTAMENTE ${slideCount} elementos, ni más ni menos.
- No agregues comentarios, encabezados ni texto fuera del JSON solicitado.
- Usa comillas dobles y asegura que el JSON sea válido.
- Cada "titulo" debe ser breve (máximo 8 palabras) y descriptivo.
- Cada lista "bullets" debe tener exactamente ${config.bulletCount} entradas entre ${config.bulletWordRange} palabras, incluir datos concretos, beneficios medibles o pasos accionables, iniciar con verbos distintos y evitar conectores genéricos.
- El campo "contenido" debe contener un párrafo de ${config.contentSentences} oraciones que resuma el contexto, profundice en los bullets e incluya ejemplos específicos.
- El tono debe ser ${config.description}.
- No repitas texto entre los bullets ni con el título y evita frases vacías como "importante" o "muy útil".
- Mantén coherencia con el idioma del tema.

ESTILO DE ESCRITURA: ${writingStyle}
- Tono: ${style.tone}
- Vocabulario: ${style.vocabulary}
- Estructura: ${style.structure}
- Ejemplos: ${style.examples}

Tema: ${tema}`;
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
        .replace(/\s*\d+[\)\.\s]+/g, '\n')
        .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
        .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
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
  return text.replace(/^[•\u2022▪◦●*\-\d]+[\)\.\-\s]*/g, '').trim();
};

const cleanGroqJsonString = (rawContent) => {
  if (!rawContent || typeof rawContent !== 'string') {
    return '';
  }

  let cleaned = rawContent
    .replace(/```json|```/gi, '')
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .replace(/\+\s*\\n/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
};

const tryParseJson = (text) => {
  const sanitized = (text || '')
    .replace(/\r/g, '')
    .replace(/\n/g, ' ')
    .replace(/\+\s*\\n/g, '')
    .trim();

  try {
    return JSON.parse(sanitized);
  } catch (primaryError) {
    try {
      const repaired = jsonrepair(sanitized);
      return JSON.parse(repaired);
    } catch (repairError) {
      const parseError = new Error('No se pudo parsear el JSON retornado por Groq.');
      parseError.cause = repairError;
      throw parseError;
    }
  }
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

      return {
        title,
        bullets,
        content: rawContent,
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
    ? title.replace(/\s+/g, ' ').trim()
    : '';

  if (!normalized) {
  return `Sección ${index + 1}`;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const ensureBulletsForSlide = (bullets, fallbackText) => {
  const TARGET_COUNT = 4;
  const cleanedBullets = dedupeBullets(
    bullets
      .map(stripBulletPrefix)
      .map(formatBulletText)
      .filter(Boolean)
  );

  const working = cleanedBullets.slice(0, TARGET_COUNT);

  if (working.length >= TARGET_COUNT) {
    return working;
  }

  if (fallbackText && typeof fallbackText === 'string') {
    const fallback = formatBulletText(fallbackText);
    if (fallback && !working.some((b) => b.toLowerCase() === fallback.toLowerCase())) {
      working.push(fallback);
    }
  }

  while (working.length < TARGET_COUNT) {
    const anchor = fallbackText && typeof fallbackText === 'string'
      ? fallbackText.trim()
      : 'Aspecto clave';
    const suffix = working.length + 1;
    working.push(`Profundiza en ${anchor.toLowerCase()} — punto ${suffix}`);
  }

  return working.slice(0, TARGET_COUNT);
};

const polishSlides = async (slides) => {
  if (!Array.isArray(slides) || !slides.length) {
    return [];
  }

  const extractContentCandidates = (slide) => {
    const sources = [];

    const push = (value) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach((item) => push(item));
        return;
      }
      if (typeof value === 'string') {
        sources.push(value);
      }
    };

    push(slide.contenido);
    push(slide.content);
    push(slide.descripcion);
    push(slide.descripcionLarga);
    push(slide.detalle);

    return sources;
  };

  const splitParagraphs = (text) => {
    if (!text || typeof text !== 'string') {
      return [];
    }

    return text
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}|\r{2,}/)
      .map((paragraph) => insertSentenceBoundaries(paragraph)
        .replace(/\s+/g, ' ')
        .trim())
      .filter(Boolean);
  };

  const processed = [];

  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const correctedTitle = ensureTitleForSlide(await corregirTexto(slide.title), index);

    const originalBullets = Array.isArray(slide.bullets) ? slide.bullets : [];
    const sanitizedBullets = originalBullets.map(stripBulletPrefix);
    const correctedBullets = await corregirLista(
      sanitizedBullets.length ? sanitizedBullets : [correctedTitle]
    );
    const finalBullets = ensureBulletsForSlide(correctedBullets, correctedTitle);
    const twiceCorrectedBullets = await corregirLista(finalBullets);

    const cleanBullets = twiceCorrectedBullets.map((bullet) =>
      bullet
        .replace(/\s*\n\s*/g, ' ')
        .trim()
        .replace(/^[•\u2022▪◦●]+\s*/, '')
    );

    const rawParagraphs = extractContentCandidates(slide)
      .flatMap(splitParagraphs);

    const correctedParagraphs = (await Promise.all(
      rawParagraphs.map((paragraph) => corregirTexto(paragraph))
    ))
      .map((paragraph) => insertSentenceBoundaries(paragraph)
        .replace(/\s+/g, ' ')
        .trim())
      .filter(Boolean);

    let contenido = correctedParagraphs.join('\n\n');

    if (!contenido && cleanBullets.length) {
      const fallbackParagraph = cleanBullets.join(' ');
      const correctedFallback = await corregirTexto(fallbackParagraph);
      const normalizedFallback = insertSentenceBoundaries(correctedFallback)
        .replace(/\s+/g, ' ')
        .trim();
      contenido = normalizedFallback;
    }

    const slidePayload = {
      title: correctedTitle,
      bullets: cleanBullets,
    };

    if (contenido) {
      slidePayload.contenido = contenido;
    }

    processed.push(slidePayload);
  }

  return processed;
};

async function generarSlidesConGroq(presentacion) {
  const client = ensureGroqClient();
  const prompt = buildPrompt(presentacion);

  let slides = null;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_GROQ_ATTEMPTS; attempt += 1) {
    try {
      const chatCompletion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_completion_tokens: 2048,
        top_p: 0.9,
        stream: false,
      });

      const respuesta = chatCompletion?.choices?.[0]?.message?.content;
      slides = parseSlides(respuesta);
      if (slides && slides.length) {
        console.log(`✅ Groq entregó JSON válido en el intento ${attempt}`);
        break;
      }
      lastError = new Error('Groq devolvió un conjunto de slides vacío.');
    } catch (error) {
      lastError = error;
      const parsedMessage = error?.message || 'Error desconocido al procesar la respuesta de Groq';
      console.warn(`⚠️ Groq falló en el intento ${attempt}: ${parsedMessage}`);
      if (error.rawResponse) {
        console.warn(`ℹ️ Respuesta recortada (intento ${attempt}): ${error.rawResponse}`);
      }
    }

    if (attempt < MAX_GROQ_ATTEMPTS && GROQ_ATTEMPT_DELAY_MS > 0) {
      await sleep(GROQ_ATTEMPT_DELAY_MS);
    }
  }

  if (!slides || !slides.length) {
    console.error('🚨 Groq agotó los intentos para devolver JSON válido.', lastError?.message || 'Error desconocido');
    const fallbackText = (lastError?.rawResponse || lastError?.message || '').replace(/\s+/g, ' ').trim();
    const bullets = toBulletArray(fallbackText).slice(0, 5);
    slides = [
      {
        title: presentacion.titulo || 'Resumen general',
        bullets: bullets.length ? bullets : [fallbackText || 'Contenido no disponible'],
        content: fallbackText || 'No se pudo obtener contenido estructurado.',
      },
    ];
  }

  const enforced = enforceSlideCount(slides, presentacion);
  const sizedSlides = enforced.slides;

  const polished = sizedSlides.length ? await polishSlides(sizedSlides) : sizedSlides;
  const finalSet = enforceSlideCount(polished, { ...presentacion, numero_slides: enforced.desiredCount }).slides;

  return finalSet;
}

module.exports = {
  generarSlidesConGroq,
};
