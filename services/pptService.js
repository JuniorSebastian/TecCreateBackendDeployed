const shouldOmitBullet = (text) => {
  if (!text) {
    return false;
  }
  const normalized = text
    .toString()
    .replace(/[.!?…]+$/g, '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return false;
  }
  return normalized === 'contenido clave' || normalized.includes('contenido clave');
};

const splitBulletIntoSentences = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const prepared = insertSentenceBoundaries(text).trim();
  if (!prepared) {
    return [];
  }

  const segments = prepared
    .split(/(?<=[.!?…])\s*(?=[A-ZÁÉÍÓÚÑ0-9])/)
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return segments.length ? segments : [prepared];
};

const splitBulletForFormatting = (text) => {
  if (!text || typeof text !== 'string') {
    return { lead: null, body: null, full: '' };
  }

  const source = text.trim();
  if (!source) {
    return { lead: null, body: null, full: '' };
  }

  const cleanLead = (value) => value.replace(/[.!?…:;\-–—\s]+$/g, '').trim();
  const cleanBody = (value) => value.replace(/^[\s:;\-–—]+/, '').trim();

  const colonIndex = source.indexOf(':');
  if (colonIndex > 2 && colonIndex < source.length - 3) {
    const lead = cleanLead(source.slice(0, colonIndex));
    const body = cleanBody(source.slice(colonIndex + 1));
    if (lead && body) {
      return { lead, body, full: source };
    }
  }

  const dashMatch = /^(.*?)[\s]*[-–—]{1}\s+(.*)$/.exec(source);
  if (dashMatch) {
    const lead = cleanLead(dashMatch[1] || '');
    const body = cleanBody(dashMatch[2] || '');
    if (lead && body) {
      return { lead, body, full: source };
    }
  }

  const sentenceMatch = /^(.{10,90}?)[.!?…]\s+(.+)$/.exec(source);
  if (sentenceMatch) {
    const lead = cleanLead(sentenceMatch[1] || '');
    const body = cleanBody(sentenceMatch[2] || '');
    if (lead && body && lead.length <= 80) {
      return { lead, body, full: source };
    }
  }

  return { lead: null, body: null, full: source };
};
const fs = require('fs/promises');
const path = require('path');
const PptxGenJS = require('pptxgenjs');
const { sanitizeContenido } = require('../utils/presentaciones');
const { getTemplateTheme, resolveTemplateKey } = require('../utils/pptThemes');
const { getFontConfig } = require('../utils/pptFonts');
const {
  bufferToDataUri,
  normalizeDataUriForPpt,
  normalizeImageForPpt,
} = require('../utils/pptImages');

const DEFAULT_BULLET = 'Contenido pendiente';

const BRAND = (() => {
  const name = 'TecCreate';
  const tagline = '';
  const watermark = 'TecCreate';
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || 'TC';

  return { name, tagline, watermark, initials };
})();

const TITLE_AREA = { x: 0.85, y: 0.95, w: 6.2, h: 0.85 };
const BULLET_AREA = { x: 0.95, y: 2.15, w: 5.25, h: 3.6 };
const IMAGE_AREA = { x: 6.5, y: 2.15, w: 2.8, h: 3.6 };
const IMAGE_FRAME = {
  x: IMAGE_AREA.x + 0.18,
  y: IMAGE_AREA.y + 0.18,
  w: IMAGE_AREA.w - 0.36,
  h: IMAGE_AREA.h - 0.36,
};
const FOOTER_AREA = { x: 0.75, y: 6.05, w: 8.6, h: 0.35 };
const WATERMARK_AREA = { x: 0.75, y: 6.1, w: 8.6, h: 0.45 };
const PANEL_LABEL_HEIGHT = 0.26;

const IMAGE_DOWNLOAD_TIMEOUT_MS = Number.parseInt(process.env.PPT_IMAGE_DOWNLOAD_TIMEOUT_MS || '12000', 10);
const globalFetch = typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null;
let hasLoggedFetchWarning = false;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value.trim());
const isDataUriImage = (value) => typeof value === 'string' && /^data:image\//i.test(value.trim());

const guessMimeFromFilename = (filename = '') => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  if (lower.endsWith('.gif')) {
    return 'image/gif';
  }
  if (lower.endsWith('.bmp')) {
    return 'image/bmp';
  }
  if (lower.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  return 'image/png';
};

const downloadImageAsDataUri = async (url) => {
  if (!globalFetch || !isHttpUrl(url)) {
    if (!globalFetch && !hasLoggedFetchWarning) {
      console.warn('El entorno actual no soporta fetch; no se descargarán imágenes externas para el PPT');
      hasLoggedFetchWarning = true;
    }
    return null;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), IMAGE_DOWNLOAD_TIMEOUT_MS) : null;

  try {
    const response = await globalFetch(url, { signal: controller?.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const mimeType = (response.headers && typeof response.headers.get === 'function' && response.headers.get('content-type'))
      || 'image/png';

    const sanitizedMime = mimeType.includes(';') ? mimeType.split(';')[0] : mimeType;
  const base64 = Buffer.from(buffer).toString('base64');
  const rawDataUri = `data:${sanitizedMime};base64,${base64}`;
  const normalized = await normalizeDataUriForPpt(rawDataUri, { mimeType: sanitizedMime });
  return normalized || rawDataUri;
  } catch (error) {
    console.warn(`No se pudo descargar la imagen ${url}:`, error.message);
    return null;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};

const resolveImageDataUri = async (imageEntry, cache) => {
  if (!imageEntry) {
    return null;
  }

  const candidate = imageEntry.dataUri
    || imageEntry.data_uri
    || imageEntry.url
    || imageEntry.filePath
    || imageEntry.path
    || imageEntry.relativePath
    || imageEntry.urlImagen
    || imageEntry.url_imagen
    || imageEntry.imageUrl
    || imageEntry.imagen
    || null;

  if (!candidate || typeof candidate !== 'string') {
    return null;
  }

  const cacheKey = candidate.trim();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  let dataUri = null;

  if (isDataUriImage(candidate)) {
    dataUri = await normalizeDataUriForPpt(candidate, {}) || candidate;
  } else if (isHttpUrl(candidate)) {
    dataUri = await downloadImageAsDataUri(candidate);
  } else {
    const normalized = candidate.replace(/\\/g, '/');
    const withoutTraversal = normalized.replace(/^\.+/g, '').replace(/(\.\.\/)+/g, '').replace(/(\.\/)+/g, '');
    const safeRelative = withoutTraversal.replace(/^\/+/, '');
    if (!safeRelative) {
      return null;
    }
    const absolutePath = path.resolve(PUBLIC_DIR, safeRelative);
    if (absolutePath.startsWith(PUBLIC_DIR)) {
      try {
        const buffer = await fs.readFile(absolutePath);
        const mimeType = guessMimeFromFilename(absolutePath);
        const resized = await normalizeImageForPpt(buffer, { mimeType });
        dataUri = bufferToDataUri(resized.buffer, resized.mimeType)
          || `data:${mimeType};base64,${buffer.toString('base64')}`;
      } catch (error) {
        console.warn(`No se pudo cargar la imagen local ${absolutePath}:`, error.message);
      }
    }
  }

  if (dataUri) {
    cache.set(cacheKey, dataUri);
    return dataUri;
  }

  return null;
};

const mapImagenesBySlide = (imagenes) => {
  const map = new Map();
  if (!Array.isArray(imagenes)) {
    return map;
  }

  imagenes.forEach((entry) => {
    const rawIndex = entry?.numeroSlide ?? entry?.numero_slide ?? entry?.slide ?? entry?.slideNumber ?? entry?.index;
    const slideNumber = Number.parseInt(rawIndex, 10);
    if (Number.isNaN(slideNumber) || slideNumber <= 0) {
      return;
    }
    map.set(slideNumber, entry);
  });

  return map;
};

const stripLeadingBullet = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/^[•\u2022▪◦●\-\*]+\s*/, '').trim();
};

const insertSentenceBoundaries = (text) => {
  if (!text || typeof text !== 'string') return '';

  const withBoundaries = text
    .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1. $2')
    .replace(/([.!?])([^\s])/g, '$1 $2')
    .replace(/:(\S)/g, ': $1');

  return withBoundaries.replace(/\s+/g, ' ').trim();
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

const splitTextIntoBullets = (text) => {
  if (!text || typeof text !== 'string') return [];

  // Primero intentar separar por bullets explícitos
  const bulletPattern = /[•\u2022▪◦●\-\*]\s*([^\n•\u2022▪◦●\-\*]+)/g;
  const matches = [...text.matchAll(bulletPattern)];
  
  if (matches.length > 0) {
    return matches
      .map(match => match[1].trim())
      .filter(Boolean)
      .map(bullet => insertSentenceBoundaries(bullet));
  }

  // Si no hay bullets explícitos, usar la lógica anterior
  const prepared = insertSentenceBoundaries(stripLeadingBullet(text));
  if (!prepared) return [];

  const baseSegments = prepared
    .split(/(?<=[.!?…])\s+|[\n\r]+/)
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  return (baseSegments.length ? baseSegments : [prepared])
    .flatMap(expandSegmentsByConnectors)
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
};

const ensureArray = (value) => {
  if (Array.isArray(value)) {
    const converted = value
      .filter((text) => typeof text === 'string' && text.trim())
      .flatMap(splitTextIntoBullets)
      .filter(Boolean);
    return converted.length ? converted : [];
  }

  if (typeof value === 'string' && value.trim()) {
    // Primero intentar separar por saltos de línea que indiquen bullets separados
    const linePattern = /^[•\u2022▪◦●\-\*]\s*.+$/gm;
    const lineMatches = value.match(linePattern);
    
    if (lineMatches && lineMatches.length > 1) {
      return lineMatches
        .map(line => stripLeadingBullet(line).trim())
        .filter(Boolean);
    }

    // Si hay bullets en el mismo párrafo sin saltos de línea
    const inlinePattern = /[•\u2022▪◦●]\s*([^•\u2022▪◦●]+)/g;
    const inlineMatches = [...value.matchAll(inlinePattern)];
    
    if (inlineMatches.length > 0) {
      // Separar cada match por cambio de minúscula a mayúscula (oraciones pegadas)
      return inlineMatches
        .flatMap(match => {
          const text = match[1].trim();
          // Detectar oraciones pegadas: minúscula o número seguido de mayúscula
          const separated = text
            .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1|||$2')
            .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1|||$2');
          return separated.split('|||').map(s => s.trim()).filter(Boolean);
        })
        .filter(Boolean);
    }

    // Si no hay bullets evidentes, usar splitTextIntoBullets
    const split = splitTextIntoBullets(value);
    if (split.length) {
      return split;
    }
    
    const fallback = insertSentenceBoundaries(stripLeadingBullet(value));
    return fallback ? [fallback] : [];
  }

  return [];
};

const prepareContentParagraphs = (value) => {
  if (typeof value !== 'string') {
    return [];
  }

  const normalized = value
    .replace(/\r\n/g, '\n')
    .replace(/[\u2022•▪◦●\-\*]+\s*/g, '') // Removido bullets
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

const normalizeWhitespace = (text) => {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(/\s+/g, ' ').trim();
};

const ensureTerminalPunctuation = (text) => {
  const trimmed = normalizeWhitespace(text);
  if (!trimmed) {
    return '';
  }

  if (/[.!?…:]$/.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}.`;
};

const formatBulletText = (text) => {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return '';
  }

  const capitalized = capitalizeSentence(normalized);
  return ensureTerminalPunctuation(capitalized);
};

const addPanelLabel = (pptx, slide, text, area, theme, fonts) => {
  const labelText = normalizeWhitespace(text) || '';
  if (!labelText) {
    return;
  }

  const labelWidth = Math.min(area.w - 0.4, Math.max(1.4, labelText.length * 0.15 + 0.85));

  slide.addShape(pptx.ShapeType.roundRect, {
    x: area.x + 0.12,
    y: area.y - PANEL_LABEL_HEIGHT - 0.08,
    w: labelWidth,
    h: PANEL_LABEL_HEIGHT,
    fill: { color: theme.accent },
    line: { color: theme.accent },
    radius: 0.18,
    shadow: {
      type: 'outer',
      color: '000000',
      opacity: 0.16,
      blur: 4,
      offset: 2,
      angle: 270,
    },
  });

  slide.addText(labelText, {
    x: area.x + 0.24,
    y: area.y - PANEL_LABEL_HEIGHT - 0.04,
    w: labelWidth - 0.3,
    h: PANEL_LABEL_HEIGHT - 0.08,
    fontSize: 12,
    bold: true,
    color: 'FFFFFF',
    fontFace: fonts.body,
    align: 'left',
    valign: 'middle',
  });
};

const addBrandHeader = (pptx, slide, slideIndex, theme, fonts) => {
  const headerHeight = 0.65;

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: headerHeight,
    fill: { color: theme.accent },
    line: { color: theme.accent },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: headerHeight,
    w: 10,
    h: 0.05,
    fill: { color: theme.accentSoft },
    line: { color: theme.accentSoft },
  });

  const headerTextParts = [
    {
      text: BRAND.name,
      options: {
        fontSize: 18,
        bold: true,
        color: 'FFFFFF',
        fontFace: fonts.heading,
        paraSpaceAfter: BRAND.tagline ? 1 : 0,
      },
    },
  ];

  if (BRAND.tagline) {
    headerTextParts.push({
      text: BRAND.tagline,
      options: {
        fontSize: 11,
        color: theme.accentSoft,
        fontFace: fonts.body,
      },
    });
  }

  slide.addText(headerTextParts, {
    x: 0.75,
    y: 0.15,
    w: 6.5,
    h: headerHeight - 0.18,
    align: 'left',
    valign: 'middle',
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 8.4,
    y: 0.16,
    w: 1.4,
    h: headerHeight - 0.22,
    fill: { color: 'FFFFFF' },
    line: { color: theme.accentSoft, width: 0.6 },
    radius: 0.22,
  });

  slide.addText(`Slide ${slideIndex + 1}`, {
    x: 8.45,
    y: 0.16,
    w: 1.3,
    h: headerHeight - 0.22,
    fontSize: 12,
    bold: true,
    color: theme.accent,
    fontFace: fonts.body,
    align: 'center',
    valign: 'middle',
  });
};

const buildSlideFromString = (text, index) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return {
      title: `Sección ${index + 1}`,
      bullets: [DEFAULT_BULLET],
      contentParagraphs: [],
    };
  }

  const colonIndex = normalized.indexOf(':');
  let title;
  let body;

  if (colonIndex !== -1 && colonIndex <= 80) {
    title = normalized.slice(0, colonIndex).trim();
    body = normalized.slice(colonIndex + 1).trim();
  } else if (normalized.length > 70) {
    title = normalized.slice(0, 70).trim();
    body = normalized.slice(70).trim();
  } else {
    title = normalized;
    body = '';
  }

  const bullets = body ? ensureArray(body).slice(0, 5) : [];

  return {
    title: title || `Sección ${index + 1}`,
    bullets: bullets.length ? bullets : [normalized],
    contentParagraphs: prepareContentParagraphs(body),
  };
};

const normalizeSlides = (contenido) => {
  if (!Array.isArray(contenido) || !contenido.length) {
    const sanitized = sanitizeContenido(contenido);
    return sanitized.map((text, index) => buildSlideFromString(text, index));
  }

  return contenido
    .map((item, index) => {
      if (typeof item === 'string') {
        return buildSlideFromString(item, index);
      }

      if (!item || typeof item !== 'object') {
        return buildSlideFromString(`Sección ${index + 1}`, index);
      }

      const rawTitle = item.titulo || item.title || item.heading || item.seccion;
      const title = rawTitle && typeof rawTitle === 'string'
        ? rawTitle.replace(/\s+/g, ' ').trim()
        : `Sección ${index + 1}`;

      // Buscar contenido en múltiples campos posibles
      const contentSource = item.bullets || item.puntos || item.texto || 
                           item.descripcion || item.contenido || item.content ||
                           item.descripcionLarga || item.detalle || '';
      
      let bullets = ensureArray(contentSource);
      
      // Si no hay bullets y hay título, usar el título
      if (!bullets.length && title) {
        bullets = [title];
      }

      const contentParagraphs = prepareContentParagraphs(
        item.contenido || item.content || item.descripcionLarga || item.detalle || ''
      );

      return {
        title: title || `Sección ${index + 1}`,
        bullets,
        contentParagraphs,
      };
    })
    .filter(Boolean);
};

async function crearPresentacionPptx(presentacion) {
  const pptx = new PptxGenJS();
  const slides = normalizeSlides(presentacion.contenido);
  const templateKey = resolveTemplateKey(presentacion?.plantilla);
  const theme = getTemplateTheme(templateKey);
  const fonts = getFontConfig(presentacion?.fuente);

  pptx.author = BRAND.name;
  pptx.company = BRAND.name;
  pptx.subject = presentacion.titulo || 'Presentación generada';
  pptx.title = presentacion.titulo || 'Presentación TecCreate';

  // Validar que hay slides con contenido
  if (!slides || slides.length === 0) {
    console.warn('No se generaron slides válidos');
    return null;
  }

  const imageCache = new Map();
  const imageMap = mapImagenesBySlide(presentacion.imagenes);

  for (let index = 0; index < slides.length; index += 1) {
    const slideData = slides[index];
    const slide = pptx.addSlide();

    slide.background = { color: theme.background };

    const imageEntry = imageMap.get(index + 1);
    const imageDataUri = await resolveImageDataUri(imageEntry, imageCache);

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.55,
      y: 1.0,
      w: 9.0,
      h: 4.6,
  fill: { color: theme.surface },
  line: { color: theme.divider, width: 0.5 },
      radius: 0.3,
      shadow: {
        type: 'outer',
        color: '000000',
        opacity: 0.08,
        blur: 9,
        offset: 4,
        angle: 270,
      },
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: BULLET_AREA.x - 0.1,
      y: BULLET_AREA.y - 0.12,
      w: BULLET_AREA.w + 0.2,
      h: BULLET_AREA.h + 0.18,
  fill: { color: theme.bulletBackground },
  line: { color: theme.accentSoft, width: 0.4 },
      radius: 0.22,
    });

    slide.addShape(pptx.ShapeType.roundRect, {
      x: IMAGE_AREA.x - 0.1,
      y: IMAGE_AREA.y - 0.12,
      w: IMAGE_AREA.w + 0.2,
      h: IMAGE_AREA.h + 0.18,
  fill: { color: theme.surface },
  line: { color: theme.accentSoft, width: 0.4 },
      radius: 0.22,
      shadow: {
        type: 'outer',
        color: '000000',
        opacity: 0.07,
        blur: 6,
        offset: 2,
        angle: 270,
      },
    });

    addBrandHeader(pptx, slide, index, theme, fonts);

    slide.addShape(pptx.ShapeType.roundRect, {
      x: TITLE_AREA.x - 0.18,
      y: TITLE_AREA.y - 0.12,
      w: TITLE_AREA.w + 0.32,
      h: TITLE_AREA.h + 0.18,
  fill: { color: theme.accentSoft },
  line: { color: theme.accent, width: 0.6 },
      radius: 0.24,
    });

    slide.addShape(pptx.ShapeType.rect, {
      x: TITLE_AREA.x - 0.22,
      y: TITLE_AREA.y - 0.12,
      w: 0.16,
      h: TITLE_AREA.h + 0.18,
  fill: { color: theme.accent },
  line: { color: theme.accent },
    });

    slide.addText(slideData.title || `Sección ${index + 1}`, {
      ...TITLE_AREA,
      fontSize: 34,
      bold: true,
      color: theme.textPrimary,
      fontFace: fonts.heading,
      align: 'left',
      shrinkText: true,
      margin: 0.12,
    });

    const bullets = Array.isArray(slideData.bullets) && slideData.bullets.length
      ? slideData.bullets
      : [DEFAULT_BULLET];

    const cleanedBullets = bullets
      .map((text) => stripLeadingBullet(typeof text === 'string' ? text : String(text || '')))
      .map((text) => normalizeWhitespace(text))
      .filter(Boolean);

    const formattedBullets = (cleanedBullets.length ? cleanedBullets : [DEFAULT_BULLET])
      .map((text) => formatBulletText(text) || DEFAULT_BULLET)
      .filter(Boolean);

    const sanitizedBulletsForSlide = formattedBullets.filter((text) => !shouldOmitBullet(text));

    const expandedBullets = sanitizedBulletsForSlide.flatMap((text) => splitBulletIntoSentences(text));

    const bulletSource = expandedBullets.length ? expandedBullets : [DEFAULT_BULLET];

    const bulletFragments = bulletSource.flatMap((text) => {
      const { lead, body, full } = splitBulletForFormatting(text);
      const baseOptions = {
        bullet: true,
    bulletColor: theme.accent,
        bulletSize: 100,
        indentLevel: 0,
        fontSize: 20,
    color: theme.textPrimary,
    fontFace: fonts.body,
        paraSpaceBefore: 2,
        paraSpaceAfter: 10,
        lineSpacingMultiple: 1.22,
      };

      if (lead && body) {
        const continuationOptions = {
          ...baseOptions,
          bullet: false,
          bold: false,
          paraSpaceBefore: 0,
        };

        return [
          {
            text: `${lead}: `,
            options: {
              ...baseOptions,
              bold: true,
            },
          },
          {
            text: body,
            options: continuationOptions,
          },
        ];
      }

      return [{ text: full, options: baseOptions }];
    });

    slide.addText(bulletFragments, {
      ...BULLET_AREA,
      align: 'left',
      valign: 'top',
      margin: 0.12,
    });

  addPanelLabel(pptx, slide, 'Imagen referencial', IMAGE_AREA, theme, fonts);

    if (imageDataUri) {
      slide.addImage({
        data: imageDataUri,
        x: IMAGE_FRAME.x,
        y: IMAGE_FRAME.y,
        w: IMAGE_FRAME.w,
        h: IMAGE_FRAME.h,
        sizing: {
          type: 'cover',
          w: IMAGE_FRAME.w,
          h: IMAGE_FRAME.h,
        },
      });
    } else {
      slide.addText('Imagen en preparación', {
        x: IMAGE_FRAME.x,
        y: IMAGE_FRAME.y + (IMAGE_FRAME.h / 2) - 0.45,
        w: IMAGE_FRAME.w,
        h: 0.9,
        fontSize: 15,
        italic: true,
        color: theme.textSecondary,
        fontFace: fonts.body,
        align: 'center',
        valign: 'middle',
        margin: 0.06,
      });
    }

    slide.addText(BRAND.watermark, {
      ...WATERMARK_AREA,
      fontSize: 20,
      bold: true,
      color: theme.watermark,
      fontFace: fonts.heading,
      align: 'center',
      valign: 'middle',
      margin: 0.08,
      opacity: 0.35,
    });
  }

  const buffer = await pptx.write('nodebuffer');
  return buffer;
}

module.exports = {
  crearPresentacionPptx,
  normalizeSlides,
};