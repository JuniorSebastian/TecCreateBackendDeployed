const fs = require('fs/promises');
const path = require('path');
const pool = require('../database');
const { sanitizeContenido } = require('../lib/presentaciones');
const { normalizeSlides } = require('./pptService');
const {
  PPT_IMAGE_ASPECT_RATIO,
  PPT_IMAGE_TARGET_HEIGHT,
  PPT_IMAGE_TARGET_WIDTH,
  normalizeImageForPpt,
} = require('../lib/pptImages');

const DEFAULT_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';
const FALLBACK_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL_FALLBACK || 'gemini-2.5-flash-image';
const IMAGE_GENERATION_ENABLED = Boolean(DEFAULT_IMAGE_MODEL && process.env.GEMINI_API_KEY);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.GEMINI_IMAGE_TIMEOUT_MS || '20000', 10);
const REQUEST_DELAY_MS = Number.parseInt(process.env.GEMINI_IMAGE_DELAY_MS || '400', 10);
const MAX_SLIDES_WITH_IMAGES = Number.parseInt(process.env.GEMINI_IMAGE_MAX_SLIDES || '25', 10);
const MAX_IMAGE_RETRIES = Number.parseInt(process.env.GEMINI_IMAGE_MAX_RETRIES || '3', 10);
const TEXT_VALIDATION_ENABLED = process.env.GEMINI_IMAGE_VALIDATE_TEXT !== 'false';
const TEXT_VALIDATION_MODEL = process.env.GEMINI_IMAGE_TEXT_MODEL || 'gemini-1.5-flash';
const TEXT_VALIDATION_TIMEOUT_MS = Number.parseInt(process.env.GEMINI_IMAGE_VALIDATE_TIMEOUT_MS || '12000', 10);

const hasFetch = typeof globalThis.fetch === 'function';

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const SLIDES_IMAGE_DIR = path.join(PUBLIC_DIR, 'images', 'slides');

const PPT_ASPECT_RATIO_LABEL = PPT_IMAGE_ASPECT_RATIO.toFixed(2);
const PPT_DIMENSION_LABEL = `${PPT_IMAGE_TARGET_WIDTH}x${PPT_IMAGE_TARGET_HEIGHT}px`;

let textValidationUnavailable = false;
let hasLoggedValidationUnavailable = false;

let ensureSlidesDirPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureApiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('Falta la variable de entorno GEMINI_API_KEY');
  }
  return key.trim();
};

const ensureSlidesDirectory = async () => {
  if (!ensureSlidesDirPromise) {
    ensureSlidesDirPromise = fs.mkdir(SLIDES_IMAGE_DIR, { recursive: true }).catch((error) => {
      ensureSlidesDirPromise = null;
      throw error;
    });
  }
  return ensureSlidesDirPromise;
};

const slugify = (value) => {
  if (!value) {
    return 'slide';
  }

  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
};

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
const isDataUriImage = (value) => typeof value === 'string' && /^data:image\//i.test(value.trim());

const getExtensionFromMime = (mimeType = '') => {
  if (/jpe?g/i.test(mimeType)) {
    return 'jpg';
  }
  if (/webp/i.test(mimeType)) {
    return 'webp';
  }
  if (/gif/i.test(mimeType)) {
    return 'gif';
  }
  if (/bmp/i.test(mimeType)) {
    return 'bmp';
  }
  return 'png';
};

const geminiEndpoint = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const buildPromptForSlide = (presentationTitle, slide, index) => {
  const safeTitle = presentationTitle || 'Presentación profesional';
  const slideTitle = slide?.title || slide?.titulo || `Diapositiva ${index + 1}`;
  const slideContent =
    slide?.contenido ||
    (Array.isArray(slide?.contentParagraphs) ? slide.contentParagraphs.join(' ') : '') ||
    '';

  const contextSnippet = slideContent || safeTitle;

  return [
    `Genera una imagen referencial, realista y profesional para la diapositiva denominada "${slideTitle}"`,
    `Contexto clave: ${contextSnippet}`,
    `El encuadre debe ser vertical (retrato) con relación ancho/alto ≈ ${PPT_ASPECT_RATIO_LABEL} y resolución objetivo ${PPT_DIMENSION_LABEL}, cubriendo todo el lienzo sin bordes libres`,
    'Evita estrictamente texto, números, letras, logotipos, marcas de agua o señalización legible dentro de la imagen',
    'Usa iluminación equilibrada, foco claro y elementos visuales que refuercen el tema descrito',
  ].join('. ') + '.';
};

const locateImagePart = (payload) => {
  const candidates = payload?.candidates || [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || candidate?.parts || [];
    for (const part of parts) {
      if (part?.inlineData?.data) {
        return {
          type: 'base64',
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }

      if (part?.text) {
        const text = part.text.trim();
        if (!text) {
          continue;
        }

        if (isDataUriImage(text)) {
          return { type: 'dataUri', data: text };
        }

        if (isHttpUrl(text)) {
          return { type: 'url', data: text };
        }

        const compact = text.replace(/\s+/g, '');
        if (/^[a-zA-Z0-9+/=]+$/.test(compact) && compact.length > 1000) {
          return { type: 'base64', data: compact, mimeType: 'image/png' };
        }
      }

      if (part?.fileData?.fileUri) {
        return { type: 'url', data: part.fileData.fileUri };
      }
    }
  }

  return null;
};

const dataUriToBuffer = (dataUri) => {
  const match = /^data:(.+?);base64,(.+)$/.exec(dataUri);
  if (!match) {
    throw new Error('Formato de data URI inválido');
  }
  const [, mimeType, base64Data] = match;
  return {
    buffer: Buffer.from(base64Data, 'base64'),
    mimeType,
  };
};

const fetchBufferFromUrl = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Descarga de imagen falló con estado ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers?.get?.('content-type') || 'image/png';
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType,
  };
};

const imagePartToBuffer = async (imagePart) => {
  if (!imagePart) {
    throw new Error('Gemini no proporcionó datos de imagen');
  }

  if (imagePart.type === 'base64') {
    const base64 = imagePart.data.replace(/\s+/g, '');
    return {
      buffer: Buffer.from(base64, 'base64'),
      mimeType: imagePart.mimeType || 'image/png',
    };
  }

  if (imagePart.type === 'dataUri') {
    return dataUriToBuffer(imagePart.data);
  }

  if (imagePart.type === 'url') {
    return fetchBufferFromUrl(imagePart.data);
  }

  throw new Error('Formato de imagen no soportado por Gemini');
};

const saveImageBuffer = async ({
  buffer,
  mimeType,
  presentationId,
  slideIndex,
  slideTitle,
  runId,
}) => {
  await ensureSlidesDirectory();

  const resolvedMime = mimeType || 'image/png';
  const extension = getExtensionFromMime(resolvedMime);
  const prefix = presentationId ? `presentation-${presentationId}` : `preview-${runId}`;
  const titleSlug = slugify(slideTitle).slice(0, 40);
  const fileName = `${prefix}-slide-${slideIndex}-${titleSlug || 'detalle'}-${runId}.${extension}`;
  const absolutePath = path.join(SLIDES_IMAGE_DIR, fileName);

  await fs.writeFile(absolutePath, buffer);

  const relativePath = path.posix.join('images', 'slides', fileName);
  const publicUrl = `/${relativePath}`;
  return { relativePath, publicUrl, absolutePath, mimeType: resolvedMime };
};

const requestImageFromModel = async ({
  model,
  prompt,
  apiKey,
}) => {
  if (!hasFetch) {
    throw new Error('fetch no está disponible en el entorno actual de Node.js');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

  try {
    const endpointUrl = `${geminiEndpoint(model)}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller?.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: [
                  'Generate a single AI image that satisfies every one of these requirements:',
                  `• ${prompt}`,
                  `• Orientation: vertical portrait, width-to-height ratio ≈ ${PPT_ASPECT_RATIO_LABEL}, target size ${PPT_DIMENSION_LABEL}.`,
                  '• Fill the entire canvas without blank borders or transparency.',
                  '• Absolutely avoid text, typography, letters, numbers, logos, signage, captions, charts with labels, or watermarks.',
                  '• Convey the concept strictly through visual elements, composition, lighting, and color.',
                ].join('\n'),
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          temperature: 0.9,
        },
      }),
    });

    const payloadText = await response.text();
    if (!response.ok) {
      const snippet = payloadText ? payloadText.slice(0, 500) : 'Respuesta vacía';
      const error = new Error(`Gemini (${model}) respondió ${response.status}: ${snippet}`);
      error.status = response.status;
      error.body = payloadText;
      throw error;
    }

    let payload;
    try {
      payload = payloadText ? JSON.parse(payloadText) : {};
    } catch (jsonError) {
      const error = new Error(`Respuesta inválida de Gemini (${model}): ${jsonError.message}`);
      error.status = 502;
      error.body = payloadText;
      throw error;
    }

    // Buscar imagen en candidates[].content.parts[].inlineData.data
    const candidates = payload?.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part?.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const dataUri = `data:${mimeType};base64,${part.inlineData.data}`;
          return { dataUri, mimeType, raw: payload };
        }
      }
    }

    throw new Error('Gemini no devolvió datos de imagen utilizables');
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const validateImageHasNoText = async ({ buffer, mimeType }) => {
  if (!TEXT_VALIDATION_ENABLED) {
    return { status: 'skipped', reason: 'validation-disabled' };
  }

  if (textValidationUnavailable) {
    return { status: 'unsupported', reason: 'validator-previous-404' };
  }

  if (!hasFetch) {
    return { status: 'skipped', reason: 'fetch-unavailable' };
  }

  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { status: 'error', reason: 'empty-buffer' };
  }

  const apiKey = ensureApiKey();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TEXT_VALIDATION_TIMEOUT_MS) : null;

  try {
    const endpointUrl = `${geminiEndpoint(TEXT_VALIDATION_MODEL)}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller?.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Analiza la imagen adjunta. Si observas letras, números, palabras, logotipos o cualquier elemento tipográfico responde EXACTAMENTE "TEXTO". Si la imagen está completamente libre de texto responde EXACTAMENTE "SIN_TEXTO". No añadas nada más.',
              },
              {
                inlineData: {
                  mimeType: mimeType || 'image/png',
                  data: buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 16,
        },
      }),
    });

    const payloadText = await response.text();
    if (!response.ok) {
      const reasonCode = `validator-${response.status}`;
      if (response.status === 404) {
        textValidationUnavailable = true;
        if (!hasLoggedValidationUnavailable) {
          console.log(`ℹ️ Validación de texto deshabilitada (modelo ${TEXT_VALIDATION_MODEL} no disponible).`);
          hasLoggedValidationUnavailable = true;
        }
        return { status: 'unsupported', reason: reasonCode, raw: payloadText };
      }

      return {
        status: 'error',
        reason: reasonCode,
        raw: payloadText,
      };
    }

    let payload;
    try {
      payload = payloadText ? JSON.parse(payloadText) : {};
    } catch (jsonError) {
      return { status: 'error', reason: 'validator-json-error', raw: payloadText };
    }

    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const answer = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join(' ')
      .trim();

    if (!answer) {
  return { status: 'error', reason: 'validator-empty' };
    }

    const normalized = answer.toUpperCase();

    if (normalized.includes('SIN_TEXTO')) {
      return { status: 'clear', reason: 'validator-confirmed', raw: answer };
    }

    if (normalized.includes('TEXTO')) {
      return { status: 'text', reason: 'validator-detected', raw: answer };
    }

    return { status: 'unknown', reason: 'validator-ambiguous', raw: answer };
  } catch (error) {
    console.warn('⚠️ Validación de texto en imagen falló:', error.message);
    return { status: 'error', reason: 'validator-error', error };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const callGeminiImage = async ({ prompt, slideIndex, presentationId, slideTitle, runId }) => {
  const apiKey = ensureApiKey();
  const primaryModel = DEFAULT_IMAGE_MODEL;
  const fallbackModel = FALLBACK_IMAGE_MODEL;

  // Lista de modelos a intentar: primero el principal, luego el fallback
  const modelsToTry = [primaryModel];
  if (fallbackModel && fallbackModel !== primaryModel) {
    modelsToTry.push(fallbackModel);
  }

  const shouldRetry = (error) => {
    const status = error.status;
    const message = (error.message || '').toLowerCase();
    const body = (error.body || '').toLowerCase();

    // Errores que indican que el modelo no funciona y debemos intentar con fallback
    const retryableStatuses = [400, 403, 404];
    if (retryableStatuses.includes(status)) {
      return true;
    }

    // Mensajes que indican que el modelo no está disponible
    const retryableKeywords = ['not found', 'unsupported', 'deprecated', 'does not support'];
    return retryableKeywords.some(keyword => message.includes(keyword) || body.includes(keyword));
  };

  const errors = [];

  for (const model of modelsToTry) {
    try {
      console.log(`🔄 Intentando generar imagen con ${model} para la diapositiva ${slideIndex}...`);
      const result = await requestImageFromModel({ model, prompt, apiKey });
      const { buffer, mimeType } = dataUriToBuffer(result.dataUri);
      console.log(`✅ Imagen generada exitosamente con ${model} para la diapositiva ${slideIndex}`);
      return { buffer, mimeType, dataUri: result.dataUri, raw: result.raw, model };
    } catch (error) {
      const status = error.status || error?.body?.error?.code;
      const message = error.message || '';
      errors.push({ model, status, message });
      
      console.warn(`⚠️ Falló ${model} en la diapositiva ${slideIndex}: ${message}`);

      // Si es el último modelo, lanzar el error
      if (model === modelsToTry[modelsToTry.length - 1]) {
        break;
      }

      // Si el error es retryable, intentar con el siguiente modelo
      if (shouldRetry(error)) {
        console.log(`🔁 Cambiando automáticamente al modelo de respaldo...`);
        continue;
      }

      // Si el error no es retryable, lanzarlo inmediatamente
      throw error;
    }
  }

  // Si llegamos aquí, todos los modelos fallaron
  const lastError = errors[errors.length - 1];
  const fallbackError = new Error(
    `No se pudo generar imagen con ninguno de los modelos configurados. Último error: ${lastError?.message || 'Error desconocido'}`
  );
  fallbackError.status = lastError?.status || 500;
  fallbackError.details = { attempts: errors };
  throw fallbackError;
};

const generateValidatedImage = async (args) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_IMAGE_RETRIES; attempt += 1) {
    try {
      const result = await callGeminiImage(args);
      const validation = await validateImageHasNoText({
        buffer: result.buffer,
        mimeType: result.mimeType,
      });

      if (
        validation.status === 'clear'
        || validation.status === 'skipped'
        || validation.status === 'unsupported'
      ) {
        console.log(`🆗 Validación de texto aprobada para la diapositiva ${args.slideIndex} (intento ${attempt}) — ${validation.reason}`);
        return result;
      }

      if (validation.status === 'error') {
        const detail = validation.reason || 'validator-error';
        console.warn(`⚠️ Validación falló por un error (${detail}). Se aceptará la imagen del intento ${attempt}.`);
        return result;
      }

      const reason = validation.reason || 'validator-unknown';
      const rawDetail = validation.raw ? ` | Detalle: ${validation.raw}` : '';

      lastError = new Error(`Validación de texto falló (${reason})${rawDetail}`);
      console.warn(`🔁 Reintentando diapositiva ${args.slideIndex} por validación fallida (${reason}).${rawDetail}`);
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Intento ${attempt} falló para la diapositiva ${args.slideIndex}: ${error.message}`);
    }

    if (attempt < MAX_IMAGE_RETRIES && REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  throw lastError || new Error('No se pudo generar una imagen válida sin texto.');
};

const generateImagesForSlides = async (slides, context = {}) => {
  if (!Array.isArray(slides) || !slides.length) {
    return [];
  }

  if (!IMAGE_GENERATION_ENABLED) {
    console.log('ℹ️ Generación de imágenes deshabilitada (falta GEMINI_IMAGE_MODEL o GEMINI_API_KEY).');
    return slides.map((_, idx) => ({
      numeroSlide: idx + 1,
      error: 'Generación de imágenes deshabilitada. Configura GEMINI_IMAGE_MODEL con un modelo disponible.',
    }));
  }

  const limitedSlides = slides.slice(0, MAX_SLIDES_WITH_IMAGES);
  const titulo = context.titulo || 'Presentación IA';
  const runId = Date.now();
  const results = [];

  for (let idx = 0; idx < limitedSlides.length; idx += 1) {
    const slideIndex = idx + 1;
    const slide = limitedSlides[idx];
    const prompt = buildPromptForSlide(titulo, slide, idx);

    try {
      const { buffer, mimeType, model } = await generateValidatedImage({
        prompt,
        slideIndex,
        presentationId: context.presentacionId,
        slideTitle: slide?.title || slide?.titulo || `Diapositiva ${slideIndex}`,
        runId,
      });

      const normalized = await normalizeImageForPpt(buffer, { mimeType });

      const { relativePath, publicUrl, mimeType: storedMimeType } = await saveImageBuffer({
        buffer: normalized.buffer,
        mimeType: normalized.mimeType,
        presentationId: context.presentacionId,
        slideIndex,
        slideTitle: slide?.title || slide?.titulo || `Diapositiva ${slideIndex}`,
        runId,
      });

      results.push({
        numeroSlide: slideIndex,
        prompt,
        filePath: relativePath,
        url: publicUrl,
        publicUrl,
        model,
        mimeType: storedMimeType,
      });
    } catch (error) {
      console.error(`❌ No se pudo generar imagen para la diapositiva ${slideIndex}: ${error.message}`);
      results.push({
        numeroSlide: slideIndex,
        prompt,
        error: error.message,
      });
    }

    if (idx < limitedSlides.length - 1 && REQUEST_DELAY_MS > 0) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  return results;
};

const deleteImagesForPresentation = async (presentacionId) => {
  await pool.query('DELETE FROM imagenes_presentacion WHERE presentacion_id = $1', [presentacionId]);
};

const storeImageForSlide = async (presentacionId, slideNumber, imageInfo) => {
  if (!presentacionId || slideNumber == null || !imageInfo) {
    return null;
  }

  const rawUrl = typeof imageInfo === 'string'
    ? imageInfo
    : imageInfo.publicUrl || imageInfo.url || imageInfo.filePath || imageInfo.relativePath || null;

  if (!rawUrl) {
    return null;
  }

  const storedUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;

  await pool.query(
    'DELETE FROM imagenes_presentacion WHERE presentacion_id = $1 AND numero_slide = $2',
    [presentacionId, slideNumber]
  );

  const result = await pool.query(
    `INSERT INTO imagenes_presentacion (presentacion_id, url_imagen, numero_slide)
     VALUES ($1, $2, $3)
     RETURNING id, presentacion_id AS "presentacionId", url_imagen AS "urlImagen", numero_slide AS "numeroSlide", fecha_creacion AS "fechaCreacion"`,
    [presentacionId, storedUrl, slideNumber]
  );

  const stored = result.rows[0];
  const relativePath = storedUrl.startsWith('/') ? storedUrl.slice(1) : storedUrl;
  return {
    ...stored,
    urlImagen: storedUrl,
    relativePath,
  };
};

const obtenerPresentacionBase = async (presentacionId) => {
  const result = await pool.query(
    `SELECT id, titulo, contenido, idioma
     FROM presentaciones
     WHERE id = $1`,
    [presentacionId]
  );

  if (!result.rowCount) {
    throw new Error('Presentación no encontrada');
  }

  const row = result.rows[0];
  const contenidoNormalizado = sanitizeContenido(row.contenido);
  const slides = normalizeSlides(contenidoNormalizado);

  return {
    id: row.id,
    titulo: row.titulo,
    idioma: row.idioma || 'es',
    slides,
  };
};

const generateImagesForPresentation = async (presentacionId, options = {}) => {
  if (!presentacionId) {
    throw new Error('Debe proporcionar un identificador de presentación');
  }

  ensureApiKey();

  const presentacion = options.slides && options.titulo
    ? {
        id: presentacionId,
        titulo: options.titulo,
        idioma: options.idioma || 'es',
        slides: options.slides,
      }
    : await obtenerPresentacionBase(presentacionId);

  const generaciones = await generateImagesForSlides(presentacion.slides, {
    titulo: presentacion.titulo,
    idioma: presentacion.idioma,
    presentacionId: presentacion.id,
  });

  await deleteImagesForPresentation(presentacionId);

  const almacenadas = [];
  const errores = [];

  for (const item of generaciones) {
    if (item.error) {
      errores.push({ slide: item.numeroSlide, mensaje: item.error });
      continue;
    }

    const stored = await storeImageForSlide(presentacionId, item.numeroSlide, item);
    if (stored) {
      const relativePath = stored.relativePath || (stored.urlImagen?.startsWith('/') ? stored.urlImagen.slice(1) : stored.urlImagen);
      almacenadas.push({
        id: stored.id,
        numeroSlide: stored.numeroSlide,
        url: stored.urlImagen,
        publicUrl: stored.urlImagen,
        filePath: relativePath,
      });
    }
  }

  return {
    presentacionId,
    titulo: presentacion.titulo,
    imagenes: almacenadas,
    errores,
  };
};

const obtenerImagenesPorPresentacion = async (presentacionId) => {
  if (!presentacionId) {
    return [];
  }

  const result = await pool.query(
    `SELECT id, presentacion_id AS "presentacionId", url_imagen AS url, numero_slide AS "numeroSlide", fecha_creacion AS "fechaCreacion"
     FROM imagenes_presentacion
     WHERE presentacion_id = $1
     ORDER BY numero_slide ASC`,
    [presentacionId]
  );

  return result.rows.map((row) => {
    const publicUrl = row.url;
    const relativePath = typeof publicUrl === 'string' && publicUrl.startsWith('/')
      ? publicUrl.slice(1)
      : publicUrl;
    return {
      id: row.id,
      numeroSlide: row.numeroSlide,
      url: publicUrl,
      publicUrl,
      filePath: relativePath,
      fechaCreacion: row.fechaCreacion,
    };
  });
};

module.exports = {
  generateImagesForSlides,
  generateImagesForPresentation,
  obtenerImagenesPorPresentacion,
};
