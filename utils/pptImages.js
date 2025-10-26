const DEFAULT_LIMIT_INPUT_PIXELS = 50_000_000;

let sharpInstance = null;
let sharpLoadFailed = false;
let hasLoggedSharpLoadError = false;

const ensureSharp = () => {
  if (!sharpInstance) {
    // Carga perezosa para evitar fallos cuando la dependencia aún no está instalada
    // eslint-disable-next-line global-require
    sharpInstance = require('sharp');
  }
  return sharpInstance;
};

const PPT_IMAGE_FRAME = {
  widthInches: 2.44,
  heightInches: 3.24,
};

const DEFAULT_TARGET_DPI = Number.parseInt(process.env.PPT_IMAGE_TARGET_DPI || '600', 10);
const deriveDimension = (inches, fallbackDpi) => {
  const dpi = Number.isFinite(fallbackDpi) && fallbackDpi > 0 ? fallbackDpi : 600;
  return Math.max(1, Math.round(inches * dpi));
};

const DEFAULT_TARGET_WIDTH = deriveDimension(
  PPT_IMAGE_FRAME.widthInches,
  Number.parseInt(process.env.PPT_IMAGE_TARGET_DPI || '', 10) || DEFAULT_TARGET_DPI
);
const DEFAULT_TARGET_HEIGHT = deriveDimension(
  PPT_IMAGE_FRAME.heightInches,
  Number.parseInt(process.env.PPT_IMAGE_TARGET_DPI || '', 10) || DEFAULT_TARGET_DPI
);

const PPT_IMAGE_TARGET_WIDTH = Number.parseInt(
  process.env.PPT_IMAGE_TARGET_WIDTH || `${DEFAULT_TARGET_WIDTH}`,
  10
);
const PPT_IMAGE_TARGET_HEIGHT = Number.parseInt(
  process.env.PPT_IMAGE_TARGET_HEIGHT || `${DEFAULT_TARGET_HEIGHT}`,
  10
);

const PPT_IMAGE_ASPECT_RATIO = Number(
  (PPT_IMAGE_TARGET_WIDTH / PPT_IMAGE_TARGET_HEIGHT).toFixed(4)
);

const PPT_IMAGE_BACKGROUND = { r: 248, g: 250, b: 252, alpha: 1 };

const bufferToDataUri = (buffer, mimeType) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return null;
  }
  const resolvedMime = mimeType && typeof mimeType === 'string' ? mimeType : 'image/png';
  return `data:${resolvedMime};base64,${buffer.toString('base64')}`;
};

const normalizeImageForPpt = async (buffer, options = {}) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { buffer, mimeType: options.mimeType || 'image/png' };
  }

  if (sharpLoadFailed) {
    return { buffer, mimeType: options.mimeType || 'image/png' };
  }

  let sharp;

  try {
    sharp = ensureSharp();
  } catch (loadError) {
    sharpLoadFailed = true;
    if (!hasLoggedSharpLoadError) {
      console.warn('No se pudo cargar sharp para redimensionar imágenes:', loadError.message);
      console.warn('Instala la dependencia ejecutando "npm install sharp" dentro de backend/ para habilitar el redimensionado.');
      hasLoggedSharpLoadError = true;
    }
    return { buffer, mimeType: options.mimeType || 'image/png' };
  }

  try {
    const resized = await sharp(buffer, {
      failOnError: false,
      limitInputPixels: options.limitInputPixels || DEFAULT_LIMIT_INPUT_PIXELS,
    })
      .resize({
        width: options.width || PPT_IMAGE_TARGET_WIDTH,
        height: options.height || PPT_IMAGE_TARGET_HEIGHT,
        fit: options.fit || 'cover',
        position: options.position || sharp.gravity.centre,
        background: options.background || PPT_IMAGE_BACKGROUND,
        withoutEnlargement: options.withoutEnlargement || false,
        fastShrinkOnLoad: options.fastShrinkOnLoad !== false,
        kernel: sharp.kernel.cubic,
      })
      .png({
        quality: options.quality || 92,
        compressionLevel: options.compressionLevel ?? 8,
        adaptiveFiltering: true,
      })
      .toBuffer();

    return {
      buffer: resized,
      mimeType: 'image/png',
    };
  } catch (error) {
    console.warn('No se pudo redimensionar la imagen para PPT:', error.message);
    return { buffer, mimeType: options.mimeType || 'image/png' };
  }
};

const normalizeDataUriForPpt = async (dataUri, options = {}) => {
  if (!dataUri || typeof dataUri !== 'string') {
    return dataUri;
  }

  const trimmed = dataUri.trim();
  const match = /^data:(.+?);base64,(.+)$/i.exec(trimmed);
  if (!match) {
    return dataUri;
  }

  try {
    const [, mimeType, base64] = match;
    const buffer = Buffer.from(base64, 'base64');
    const result = await normalizeImageForPpt(buffer, { ...options, mimeType });
    return bufferToDataUri(result.buffer, result.mimeType) || dataUri;
  } catch (error) {
    console.warn('No se pudo procesar la data URI para PPT:', error.message);
    return dataUri;
  }
};

module.exports = {
  PPT_IMAGE_ASPECT_RATIO,
  PPT_IMAGE_TARGET_WIDTH,
  PPT_IMAGE_TARGET_HEIGHT,
  normalizeImageForPpt,
  normalizeDataUriForPpt,
  bufferToDataUri,
};
