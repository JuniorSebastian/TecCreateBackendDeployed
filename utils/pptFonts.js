const DEFAULT_FONT_KEY = 'segoe-ui';

const PPT_FONTS = {
  'segoe-ui': {
    key: 'segoe-ui',
    name: 'Segoe UI',
    description: 'Moderna, muy legible en pantallas y estándar en Windows.',
    category: 'Moderna',
    pairing: 'Ideal para tecnología y presentaciones corporativas.',
    heading: 'Segoe UI Semibold',
    body: 'Segoe UI',
  },
  calibri: {
    key: 'calibri',
    name: 'Calibri',
    description: 'Clásica en entornos empresariales, tono cálido y cercano.',
    category: 'Profesional',
    pairing: 'Buena para negocios y educación formal.',
    heading: 'Calibri Bold',
    body: 'Calibri',
  },
  arial: {
    key: 'arial',
    name: 'Arial',
    description: 'Sans-serif universal, segura cuando no sabes qué elegir.',
    category: 'Universal',
    pairing: 'Funciona en casi cualquier contexto.',
    heading: 'Arial Bold',
    body: 'Arial',
  },
  'helvetica-neue': {
    key: 'helvetica-neue',
    name: 'Helvetica Neue',
    description: 'Diseño limpio y equilibrado, muy usada en branding moderno.',
    category: 'Moderna',
    pairing: 'Excelente para productos digitales y startups.',
    heading: 'HelveticaNeue-Bold',
    body: 'HelveticaNeue',
  },
  roboto: {
    key: 'roboto',
    name: 'Roboto',
    description: 'Tipografía de Google, optimizada para interfaces digitales.',
    category: 'Moderna',
    pairing: 'Perfecta para contenidos tecnológicos y apps.',
    heading: 'Roboto Bold',
    body: 'Roboto',
  },
  montserrat: {
    key: 'montserrat',
    name: 'Montserrat',
    description: 'Sans-serif geométrica con personalidad elegante.',
    category: 'Creativa',
    pairing: 'Destaca en branding y material de innovación.',
    heading: 'Montserrat SemiBold',
    body: 'Montserrat',
  },
  'open-sans': {
    key: 'open-sans',
    name: 'Open Sans',
    description: 'Equilibrio entre formal y amigable, muy versátil.',
    category: 'Profesional',
    pairing: 'Adecuada para informes, educación y tecnología.',
    heading: 'Open Sans Semibold',
    body: 'Open Sans',
  },
  lato: {
    key: 'lato',
    name: 'Lato',
    description: 'Estilo cálido con excelente legibilidad.',
    category: 'Profesional',
    pairing: 'Funciona bien en recursos humanos y marketing.',
    heading: 'Lato Bold',
    body: 'Lato',
  },
  georgia: {
    key: 'georgia',
    name: 'Georgia',
    description: 'Serif elegante con gran lectura en pantalla.',
    category: 'Clásica',
    pairing: 'Ideal para narrativa, historia y humanidades.',
    heading: 'Georgia Bold',
    body: 'Georgia',
  },
  'times-new-roman': {
    key: 'times-new-roman',
    name: 'Times New Roman',
    description: 'Serif tradicional, transmite formalidad académica.',
    category: 'Clásica',
    pairing: 'Adecuada para documentos institucionales.',
    heading: 'Times New Roman Bold',
    body: 'Times New Roman',
  },
  garamond: {
    key: 'garamond',
    name: 'Garamond',
    description: 'Serif refinada, muy usada en publicaciones impresas.',
    category: 'Clásica',
    pairing: 'Perfecta para literatura y artes.',
    heading: 'Garamond Bold',
    body: 'Garamond',
  },
};

const resolveFontKey = (value) => {
  if (typeof value === 'string') {
    const key = value.trim().toLowerCase();
    if (key && PPT_FONTS[key]) {
      return key;
    }
  }
  return DEFAULT_FONT_KEY;
};

const getFontConfig = (value) => {
  const key = resolveFontKey(value);
  const config = PPT_FONTS[key] || PPT_FONTS[DEFAULT_FONT_KEY];

  return {
    key: config.key,
    name: config.name,
    description: config.description,
    category: config.category,
    pairing: config.pairing,
    heading: config.heading,
    body: config.body,
  };
};

const listFontSummaries = () => Object.values(PPT_FONTS).map((font) => ({
  key: font.key,
  name: font.name,
  description: font.description,
  category: font.category,
  pairing: font.pairing,
}));

const getFontSummary = (value) => {
  const config = getFontConfig(value);
  return {
    key: config.key,
    name: config.name,
    description: config.description,
    category: config.category,
    pairing: config.pairing,
  };
};

module.exports = {
  DEFAULT_FONT_KEY,
  PPT_FONTS,
  resolveFontKey,
  getFontConfig,
  listFontSummaries,
  getFontSummary,
};
