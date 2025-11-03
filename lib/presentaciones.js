const FALLBACK_SECTION = 'Sección 1';

const ensureFallback = (items) => (items.length ? items : [FALLBACK_SECTION]);

const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
};

const sanitizeArrayOfStrings = (values) => {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .map((entry) => sanitizeString(typeof entry === 'string' ? entry : String(entry || '')))
    .filter(Boolean);
};

const sanitizeSlideItem = (item, index) => {
  if (typeof item === 'string') {
    const sanitized = sanitizeString(item);
    return sanitized || `Sección ${index + 1}`;
  }

  if (item == null) {
    return `Sección ${index + 1}`;
  }

  if (Array.isArray(item)) {
    const sanitizedArray = sanitizeArrayOfStrings(item);
    return sanitizedArray.length ? sanitizedArray : [`Sección ${index + 1}`];
  }

  if (typeof item === 'object') {
    const cleaned = {};
    Object.entries(item).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const sanitized = sanitizeString(value);
        if (sanitized) {
          cleaned[key] = sanitized;
        }
      } else if (Array.isArray(value)) {
        const sanitizedArray = sanitizeArrayOfStrings(value);
        if (sanitizedArray.length) {
          cleaned[key] = sanitizedArray;
        }
      } else if (value != null) {
        cleaned[key] = value;
      }
    });

    return Object.keys(cleaned).length ? cleaned : { titulo: `Sección ${index + 1}` };
  }

  return sanitizeString(String(item)) || `Sección ${index + 1}`;
};

const normalizeArray = (arr) => ensureFallback(arr.map((item, index) => sanitizeSlideItem(item, index)).filter(Boolean));

const sanitizeContenido = (contenido) => {
  if (!contenido) {
    return [FALLBACK_SECTION];
  }

  if (Array.isArray(contenido)) {
    return normalizeArray(contenido);
  }

  try {
    const parsed = JSON.parse(contenido);
    return Array.isArray(parsed) ? normalizeArray(parsed) : [FALLBACK_SECTION];
  } catch (err) {
    return [FALLBACK_SECTION];
  }
};

module.exports = {
  sanitizeContenido,
  ensureFallback,
  FALLBACK_SECTION,
};
