const { jsonrepair } = require('jsonrepair');
const { sanitizeContenido } = require('../lib/presentaciones');
const { corregirTexto, corregirLista } = require('../lib/ortografia');
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

  // Limpieza profunda de caracteres no deseados y separación de texto pegado
  let cleanedSource = text
    .replace(/[\u2022•▪◦●]/g, ' ')
    .replace(/^[\s\-•\u2022▪◦●*\d]+[\).\-\s]*/g, '')
    // ELIMINAR patrones prohibidos PRIMERO (antes de cualquier otro proceso)
    .replace(/Profundiza\s+en\s+[^:]+:\s*punto\s+\d+\.?\s*/gi, '')  // Eliminar "Profundiza en X: punto N"
    .replace(/\bpunto\s+\d+\.?\s*/gi, '')  // Eliminar cualquier "punto N"
    .replace(/(\w+)\.\s*\1/gi, '$1')  // Eliminar palabras duplicadas consecutivas
    // Detectar y separar texto pegado: minúscula/número + mayúscula
    .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1. $2')
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')  // Normalizar comillas
    .replace(/['']/g, "'")  // Normalizar apóstrofes
    .replace(/…/g, '...')   // Normalizar puntos suspensivos
    .replace(/\s+([.,;:!?])/g, '$1')  // Eliminar espacios antes de puntuación
    .replace(/([.,;:!?])([^\s])/g, '$1 $2')  // Agregar espacio después de puntuación
    // Eliminar frases repetidas que empiezan con la misma palabra y dos puntos
    .replace(/(\w+\s+\w+):\s*[^.]+\.\s*\1:/gi, '$1:')
    .trim();

  if (!cleanedSource || cleanedSource.length < 3) return '';

  // Capitalizar primera letra correctamente
  const capitalized = cleanedSource.charAt(0).toUpperCase() + cleanedSource.slice(1);
  
  // Asegurar que termina con punto (si no tiene puntuación final)
  const withPeriod = /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
  
  // Verificar que no tenga doble puntuación
  const finalText = withPeriod
    .replace(/\.+$/g, '.')
    .replace(/\?+$/g, '?')
    .replace(/!+$/g, '!')
    // Eliminar múltiples puntos seguidos en medio del texto
    .replace(/\.{2,}/g, '.');
  
  return finalText;
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
  const idioma = presentacion.idioma || 'Español';
  
  // Mapeo de estilos visuales a estilos de escritura
  const styleMapping = {
    'Default': 'Professional',
    'Modern': 'Casual',
    'Minimal': 'Academic',
    'default': 'Professional',
    'modern': 'Casual',
    'minimal': 'Academic',
  };
  
  const rawStyle = presentacion.estilo || presentacion.style || 'Professional';
  const writingStyle = styleMapping[rawStyle] || rawStyle;

  // Configuración basada en nivel de detalle
  const detailConfig = {
    Brief: {
      bulletCount: 3,
      bulletLength: 'entre 10-15 palabras',
      contentLength: '2 párrafos: uno de introducción (2 oraciones) y uno de desarrollo (2-3 oraciones)',
      paragraphCount: 2,
      focus: 'información esencial y directa, sin detalles superfluos',
    },
    Medium: {
      bulletCount: 4,
      bulletLength: 'entre 12-18 palabras',
      contentLength: '2-3 párrafos: introducción (2-3 oraciones), desarrollo (3-4 oraciones) y opcional conclusión (2 oraciones)',
      paragraphCount: 3,
      focus: 'balance entre detalle y claridad, con ejemplos concretos',
    },
    Detailed: {
      bulletCount: 5,
      bulletLength: 'entre 15-22 palabras',
      contentLength: '3 párrafos completos: contexto (3 oraciones), análisis detallado (4-5 oraciones) y conclusiones (2-3 oraciones)',
      paragraphCount: 3,
      focus: 'análisis profundo con datos, estadísticas y ejemplos específicos múltiples',
    },
  };

  // Configuración de estilos de escritura
  const styleConfig = {
    Professional: {
      tone: 'formal, técnico y corporativo',
      guidelines: 'Usa terminología profesional, datos verificables, métricas concretas y lenguaje corporativo estándar. Incluye estadísticas, porcentajes y casos de éxito empresariales.',
      structure: 'Redacta con precisión técnica y claridad ejecutiva.',
    },
    Casual: {
      tone: 'conversacional, cercano y accesible',
      guidelines: 'Usa lenguaje cotidiano sin perder profesionalismo. Incluye analogías simples, ejemplos del día a día y un tono amigable que conecte con la audiencia.',
      structure: 'Redacta de forma clara y directa, como si explicaras a un colega.',
    },
    Academic: {
      tone: 'riguroso, analítico y científico',
      guidelines: 'Usa terminología académica precisa, referencias a teorías consolidadas y argumentación fundamentada. Incluye conceptos, modelos y enfoques metodológicos.',
      structure: 'Redacta con profundidad analítica y rigor científico.',
    },
  };

  const config = detailConfig[detailLevel] || detailConfig.Medium;
  const style = styleConfig[writingStyle] || styleConfig.Professional;

  // Instrucciones específicas por idioma
  const languageInstructions = {
    'Español': 'Redacta en español perfecto con gramática impecable, acentos correctos y concordancia verbal precisa.',
    'English': 'Write in perfect English with impeccable grammar, proper punctuation and clear sentence structure.',
    'French': 'Rédigez en français parfait avec une grammaire impeccable, des accents corrects et une structure claire.',
  };

  const langInstruction = languageInstructions[idioma] || languageInstructions['Español'];

  return `Genera ${slideCount} slides profesionales sobre "${tema}" en ${idioma} (estilo ${writingStyle}, detalle ${detailLevel}).

⚠️ VALIDACIÓN AUTOMÁTICA - Rechazado si incluye:
- "punto 1/2/3/4" o numeración en bullets
- Texto repetido o palabras pegadas
- Ortografía incorrecta (ej: "Machu Picchu" NO "Mache Piche")

**JSON:**
{"slides":[{"titulo":"...","bullets":["...","...","..."],"contenido":"Párrafo 1.\\n\\nPárrafo 2."}]}

**REGLAS:**

1. CANTIDAD: ${slideCount} slides exactos

2. ORTOGRAFÍA: ${langInstruction}
   - Nombres propios correctos: "Machu Picchu" (NO "Mache Piche")
   - Tildes obligatorias: é, á, í, ó, ú

3. TÍTULOS: Máx 8 palabras, específicos, sin artículos innecesarios

4. BULLETS: ${config.bulletCount} por slide (${config.bulletLength})
   ❌ PROHIBIDO: "punto N", texto repetido, palabras pegadas
   ✅ REQUERIDO: Oraciones completas, únicas, con datos específicos
   Ejemplo: ["Machu Picchu fue construida en el siglo XV.","Se encuentra a 2430 msnm.","Recibe 1.5M visitantes/año."]

5. CONTENIDO: ${config.paragraphCount} párrafos separados por \\n\\n
   - P1: Introducción (2-3 oraciones)
   - P2: Desarrollo con datos (3-4 oraciones)
   - P3: Conclusión (2-3 oraciones)
   - ${config.focus}

6. ESTILO: ${style.tone} - ${style.structure}

Responde SOLO con JSON válido. Ortografía correcta: "Machu Picchu" (NO "Mache"), "Perú" (con tilde), "Cusco".`;
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

  // Validar que no contenga patrones prohibidos
  const validateSlideQuality = (slide) => {
    const errors = [];
    
    // Validar bullets
    const bulletsArray = slide.bullets || slide.puntos || slide.items || [];
    if (Array.isArray(bulletsArray)) {
      bulletsArray.forEach((bullet, idx) => {
        const bulletStr = String(bullet || '').toLowerCase();
        // Detectar "punto N"
        if (/punto\s+\d+/i.test(bulletStr)) {
          errors.push(`Bullet ${idx + 1} contiene "punto N" (prohibido)`);
        }
        // Detectar repetición de "Profundiza en"
        if ((bulletStr.match(/profundiza\s+en/gi) || []).length > 1) {
          errors.push(`Bullet ${idx + 1} repite "Profundiza en" múltiples veces`);
        }
        // Detectar texto pegado sin espacios (más de 60 chars sin espacio)
        if (/[a-záéíóúñ]{60,}/i.test(bulletStr)) {
          errors.push(`Bullet ${idx + 1} tiene texto pegado sin espacios`);
        }
      });
    }
    
    return errors;
  };

  // Validar todos los slides
  parsed.slides.forEach((slide, index) => {
    const errors = validateSlideQuality(slide);
    if (errors.length > 0) {
      const validationError = new Error(`Slide ${index + 1} falló validación de calidad:\n${errors.join('\n')}`);
      validationError.rawResponse = cleaned.slice(0, MAX_LOG_LENGTH);
      throw validationError;
    }
  });

  const slides = parsed.slides
    .map((slide, index) => {
      if (!slide || typeof slide !== 'object') {
        return null;
      }

      const rawTitle = slide.titulo || slide.title || slide.heading;
      const title = rawTitle && typeof rawTitle === 'string'
        ? rawTitle.replace(/\s+/g, ' ').replace(/[""]/g, '"').trim()
        : `Sección ${index + 1}`;

      const bullets = toBulletArray(slide.bullets || slide.puntos || slide.items || slide.lines);
      const rawContent = slide.contenido || slide.content || slide.descripcion || slide.resumen || '';
      
      // Limpiar el contenido preservando saltos de línea para párrafos
      const cleanContent = typeof rawContent === 'string' 
        ? rawContent
            .replace(/[""]/g, '"')
            .replace(/['']/g, "'")
            .replace(/…/g, '...')
            // Preservar dobles saltos de línea (\\n\\n) para separar párrafos
            .replace(/\\n\\n/g, '\n\n')
            .replace(/\\n/g, ' ')  // Convertir \n simples en espacios
            // Normalizar espacios DENTRO de párrafos (no entre ellos)
            .split('\n\n')
            .map(para => para.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .join('\n\n')
            .replace(/\s+([.,;:!?])/g, '$1')
            .replace(/([.,;:!?])([^\s])/g, '$1 $2')
            .trim()
        : '';

      return {
        title,
        bullets,
        content: cleanContent,
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
    
    // 📊 LOG: Slide ANTES de corrección
    if (index === 0) {
      console.log('📊 [ANTES CORRECCIÓN]:', JSON.stringify({
        title: slide.title,
        bullets: slide.bullets,
        content: slide.content?.substring(0, 200)
      }, null, 2));
    }
    
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
    
    // 📊 LOG: Slide DESPUÉS de polish
    if (index === 0) {
      console.log('📊 [DESPUÉS POLISH]:', JSON.stringify({
        title: slidePayload.title,
        bullets: slidePayload.bullets,
        contenido: slidePayload.contenido?.substring(0, 200)
      }, null, 2));
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
        max_completion_tokens: 4096,  // Aumentado para evitar corte de contenido
        top_p: 0.9,
        stream: false,
      });

      const respuesta = chatCompletion?.choices?.[0]?.message?.content;
      
      // 📊 LOG: Respuesta RAW de Groq (primeros 500 caracteres)
      console.log('📊 [GROQ RAW]:', respuesta?.substring(0, 500));
      
      slides = parseSlides(respuesta);
      if (slides && slides.length) {
        console.log(`✅ Groq entregó JSON válido en el intento ${attempt}`);
        // 📊 LOG: Contenido parseado (primera slide)
        console.log('📊 [GROQ PARSED]:', JSON.stringify(slides[0], null, 2));
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
