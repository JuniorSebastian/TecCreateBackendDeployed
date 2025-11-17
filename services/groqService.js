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
    // Detectar y separar texto pegado: minúscula/número + mayúscula
    .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1. $2')
    // Detectar repetición de frases (ej: "Profundiza en X: punto 1.Profundiza en X: punto 2")
    .replace(/([.:;])\s*Profundiza\s+en\s+[^:]+:\s*punto\s+\d+/gi, '$1')
    // Limpiar patrones de "punto N" mal formateados
    .replace(/[.:;]?\s*punto\s+\d+\.?/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')  // Normalizar comillas
    .replace(/['']/g, "'")  // Normalizar apóstrofes
    .replace(/…/g, '...')   // Normalizar puntos suspensivos
    .replace(/\s+([.,;:!?])/g, '$1')  // Eliminar espacios antes de puntuación
    .replace(/([.,;:!?])([^\s])/g, '$1 $2')  // Agregar espacio después de puntuación
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

  return `Eres un experto creador de contenido profesional para presentaciones. Genera contenido de ALTA CALIDAD sobre el siguiente tema en formato JSON válido.

**TEMA:** ${tema}
**IDIOMA:** ${idioma}
**NIVEL DE DETALLE:** ${detailLevel}
**ESTILO:** ${writingStyle}

**FORMATO JSON REQUERIDO:**
{
  "slides": [
    {
      "titulo": "string",
      "bullets": ["string", "string", "string"],
      "contenido": "string con párrafos separados por \\n\\n"
    }
  ]
}

**NOTA SOBRE EL CONTENIDO:** El campo "contenido" debe contener 2-3 párrafos bien estructurados,
separados por doble salto de línea (\\n\\n). Cada párrafo debe desarrollar una idea completa.

**INSTRUCCIONES DE CALIDAD (CRÍTICO):**

1. **CANTIDAD:** Genera EXACTAMENTE ${slideCount} diapositivas, ni más ni menos.

2. **ORTOGRAFÍA PERFECTA (MÁXIMA PRIORIDAD):** ${langInstruction}
   - VERIFICA cada palabra 2 veces antes de incluirla
   - Nombres propios SIEMPRE con ortografía correcta (ej: "Machu Picchu" NO "Mache Piche")
   - Lugares turísticos: verifica acentos y mayúsculas (ej: "Cusco" o "Cuzco", NO "Cuco")
   - Personas famosas: ortografía exacta (ej: "Leonardo da Vinci" NO "Leonardo Da vinchi")
   - Términos técnicos: usa la forma estándar internacional
   - Tildes y acentos obligatorios en español (é, á, í, ó, ú)
   - CERO errores de puntuación
   - CERO errores de concordancia

3. **TÍTULOS (máximo 8 palabras):**
   - Claros, específicos y descriptivos
   - Sin artículos innecesarios al inicio
   - Primera letra mayúscula, resto en minúscula (excepto nombres propios)
   - Ejemplo bueno: "Beneficios de la inteligencia artificial"
   - Ejemplo malo: "La IA es muy buena"

4. **BULLETS (exactamente ${config.bulletCount} por slide, ${config.bulletLength}):**
   - CADA BULLET EN UNA LÍNEA SEPARADA en el array JSON
   - Cada bullet debe ser UNA ORACIÓN COMPLETA e INDEPENDIENTE
   - Inicia con mayúscula, termina con punto
   - NO juntes múltiples ideas en un solo bullet
   - NO repitas el mismo texto varias veces en un bullet
   - NO uses numeración (punto 1, punto 2, etc.) dentro de los bullets
   - NO incluyas listas numeradas dentro de un bullet
   - Usa verbos de acción variados o sustantivos concretos
   - Incluye datos específicos, cifras o ejemplos tangibles
   - NO repitas conceptos entre bullets
   - NO uses frases genéricas como "es importante", "muy útil", "fundamental"
   - Mantén estructura paralela (todos empiezan similar)
   - ${style.guidelines}
   
   Ejemplo CORRECTO:
   "bullets": [
     "Machu Picchu fue construida en el siglo XV por el imperio inca.",
     "La ciudadela se encuentra a 2430 metros sobre el nivel del mar.",
     "Recibe más de 1.5 millones de visitantes cada año."
   ]
   
   Ejemplo INCORRECTO (NO hacer):
   "bullets": [
     "Profundiza en conclusiones: punto 1. Profundiza en conclusiones: punto 2.",
     "Machu Picchu es importanteFue construidaAtrae millones de visitantes."
   ]

5. **CONTENIDO (${config.contentLength} EN PÁRRAFOS SEPARADOS):**
   - ESTRUCTURA: Genera 2-3 párrafos bien diferenciados, separados por doble salto (\\n\\n)
   - PÁRRAFO 1: Introducción o contexto general del tema (2-3 oraciones)
   - PÁRRAFO 2: Desarrollo o detalles principales (3-4 oraciones)
   - PÁRRAFO 3 (opcional): Conclusión, implicaciones o ejemplos (2-3 oraciones)
   - Cada párrafo debe ser INDEPENDIENTE pero conectado temáticamente
   - Desarrolla y profundiza los puntos de los bullets
   - Incluye contexto, razones, datos específicos o ejemplos concretos
   - Usa conectores apropiados entre oraciones DENTRO de cada párrafo
   - ${config.focus}
   - Cada oración debe tener sentido completo
   - NO escribas todo en un solo bloque, SEPARA por párrafos
   
   Ejemplo de formato correcto:
   "contenido": "Primer párrafo con introducción al tema. Explica el contexto general.\\n\\nSegundo párrafo desarrollando los detalles. Incluye datos específicos y ejemplos concretos.\\n\\nTercer párrafo con conclusiones o implicaciones finales."

6. **ESTILO DE REDACCIÓN:**
   - Tono: ${style.tone}
   - ${style.structure}
   - Evita repeticiones innecesarias
   - Usa vocabulario preciso y variado
   - Mantén consistencia en tiempos verbales

7. **VALIDACIÓN FINAL (CRÍTICO):**
   - Lee cada texto completo antes de incluirlo
   - VERIFICA ORTOGRAFÍA de nombres propios, lugares y términos técnicos
   - VERIFICA ESPACIOS: cada oración debe tener espacios entre palabras
   - NO pegues oraciones sin puntos ni espacios (ej: "idea1Fue construidaEs famoso")
   - Confirma que cada bullet está separado correctamente en el array
   - Verifica que cada bullet agregue valor real y sea ÚNCO (no repetido)
   - Asegura que el contenido fluye naturalmente
   - NO uses numeración dentro de bullets (punto 1, punto 2, etc.)
   - DOUBLE-CHECK: ortografía y gramática perfectas
   - Si el tema contiene nombres (lugares, personas, marcas): búscalos en tu conocimiento y usa la ortografía EXACTA

**IMPORTANTE:** 
- Responde ÚNICAMENTE con el JSON válido, sin texto adicional
- Usa comillas dobles para todas las strings
- No incluyas comentarios ni explicaciones fuera del JSON
- Cada slide debe ser informativa y profesional
- La ortografía es MÁS IMPORTANTE que cualquier otra cosa

**EJEMPLOS DE ORTOGRAFÍA CORRECTA:**
- "Machu Picchu" (NO "Mache Piche", "Machu Pichu", "Machupicchu")
- "Cusco" o "Cuzco" (NO "Cuco", "Cusco")  
- "Perú" (NO "Peru" sin tilde)
- "México" (NO "Mejico", "Mexico")

Genera ahora el contenido siguiendo TODAS estas instrucciones con máxima calidad y ORTOGRAFÍA PERFECTA.`;
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
