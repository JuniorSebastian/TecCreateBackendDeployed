const { resolveTemplateKey } = require('./pptThemes');
const { resolveFontKey, DEFAULT_FONT_KEY } = require('./pptFonts');

const DEFAULT_LANGUAGE = 'Español';
const DEFAULT_SLIDES = 8;

const TOPIC_CATEGORIES = [
  {
    key: 'tecnologia-software',
    area: 'tecnologia',
    name: 'Área de Tecnología y Software',
    description: 'Temas base para carreras de desarrollo de software y mecatrónica aplicada.',
    defaultTemplate: 'software',
    templates: ['software', 'mecatronica'],
    defaultFont: 'segoe-ui',
    fonts: ['segoe-ui', 'roboto', 'montserrat', 'open-sans'],
    topics: [
      { key: 'fundamentos-programacion', title: 'Fundamentos de Programación' },
      { key: 'programacion-orientada-objetos', title: 'Programación Orientada a Objetos' },
      { key: 'algoritmos-estructuras-datos', title: 'Algoritmos y Estructuras de Datos' },
      { key: 'base-de-datos', title: 'Base de Datos' },
      { key: 'desarrollo-aplicaciones-web', title: 'Desarrollo de Aplicaciones Web' },
      { key: 'programacion-dispositivos-moviles', title: 'Programación en Dispositivos Móviles' },
      { key: 'redes-comunicacion-datos', title: 'Redes y Comunicación de Datos' },
      { key: 'sistemas-operativos', title: 'Sistemas Operativos' },
      { key: 'inteligencia-artificial-aplicada', title: 'Inteligencia Artificial Aplicada' },
      { key: 'integracion-sistemas-empresariales', title: 'Integración de Sistemas Empresariales' },
      { key: 'ciberseguridad-etica-digital', title: 'Ciberseguridad y Ética Digital' },
    ],
  },
  {
    key: 'ingenieria-mantenimiento',
    area: 'ingenieria',
    name: 'Área de Ingeniería y Mantenimiento',
    description: 'Temáticas para maquinaria pesada, mantenimiento industrial y mecatrónica aplicada.',
    defaultTemplate: 'maquinaria',
    templates: ['maquinaria', 'mecatronica'],
  defaultFont: 'calibri',
  fonts: ['calibri', 'arial', 'lato', 'segoe-ui'],
    topics: [
      { key: 'dibujo-tecnico-cad', title: 'Dibujo Técnico y Diseño Asistido por Computadora (CAD)' },
      { key: 'mecanica-materiales', title: 'Mecánica de Materiales' },
      { key: 'electronica-electricidad-industrial', title: 'Electrónica y Electricidad Industrial' },
      { key: 'hidraulica-neumatica', title: 'Hidráulica y Neumática' },
      { key: 'automatizacion-control-industrial', title: 'Automatización y Control Industrial' },
      { key: 'instrumentacion-sensores', title: 'Instrumentación y Sensores' },
      { key: 'robotica-industrial', title: 'Robótica Industrial' },
      { key: 'mantenimiento-preventivo-correctivo', title: 'Mantenimiento Preventivo y Correctivo' },
      { key: 'administracion-flotas-equipos', title: 'Administración de Flotas y Equipos' },
      { key: 'seguridad-industrial-medio-ambiente', title: 'Seguridad Industrial y Medio Ambiente' },
    ],
  },
  {
    key: 'procesos-quimicos-metalurgicos',
    area: 'procesos',
    name: 'Área de Procesos Químicos y Metalúrgicos',
    description: 'Contenidos para ingeniería de procesos, química aplicada y metalurgia.',
    defaultTemplate: 'quimica',
    templates: ['quimica'],
  defaultFont: 'calibri',
  fonts: ['calibri', 'georgia', 'garamond', 'times-new-roman'],
    topics: [
      { key: 'quimica-general-analitica', title: 'Química General y Analítica' },
      { key: 'termodinamica', title: 'Termodinámica' },
      { key: 'fisicoquimica', title: 'Fisicoquímica' },
      { key: 'operaciones-unitarias', title: 'Operaciones Unitarias' },
      { key: 'tecnologia-procesos-quimicos', title: 'Tecnología de Procesos Químicos' },
      { key: 'metalurgia-extractiva', title: 'Metalurgia Extractiva' },
      { key: 'analisis-materiales-minerales', title: 'Análisis de Materiales y Minerales' },
      { key: 'laboratorio-quimica-aplicada', title: 'Laboratorio de Química Aplicada' },
      { key: 'control-calidad-procesos-industriales', title: 'Control de Calidad en Procesos Industriales' },
    ],
  },
  {
    key: 'gestion-innovacion-empleabilidad',
    area: 'gestion',
    name: 'Área de Gestión, Innovación y Empleabilidad',
    description: 'Competencias transversales para todas las carreras profesionales.',
    defaultTemplate: 'default',
    templates: ['default', 'software', 'maquinaria', 'mecatronica', 'quimica'],
  defaultFont: 'segoe-ui',
  fonts: ['segoe-ui', 'open-sans', 'lato', 'arial', 'montserrat'],
    topics: [
      { key: 'matematica-aplicada', title: 'Matemática Aplicada' },
      { key: 'fisica-general', title: 'Física General' },
      { key: 'estadistica-control-procesos', title: 'Estadística y Control de Procesos' },
      { key: 'gestion-innovacion-emprendimiento', title: 'Gestión de la Innovación y Emprendimiento' },
      { key: 'comunicacion-liderazgo', title: 'Comunicación y Liderazgo' },
      { key: 'gestion-proyectos', title: 'Gestión de Proyectos' },
      { key: 'etica-profesional-responsabilidad-social', title: 'Ética Profesional y Responsabilidad Social' },
      { key: 'ingles-tecnico', title: 'Inglés Técnico' },
      { key: 'seguridad-salud-ocupacional-medio-ambiente', title: 'Seguridad, Salud Ocupacional y Medio Ambiente' },
    ],
  },
];

const normalizedCategory = (category) => {
  const defaultTemplate = resolveTemplateKey(category.defaultTemplate || 'default');
  const defaultFont = resolveFontKey(category.defaultFont || DEFAULT_FONT_KEY);
  const templates = Array.isArray(category.templates)
    ? category.templates.map((template) => resolveTemplateKey(template)).filter(Boolean)
    : [defaultTemplate];
  const fonts = Array.isArray(category.fonts)
    ? category.fonts.map((font) => resolveFontKey(font)).filter(Boolean)
    : [defaultFont];

  const topics = Array.isArray(category.topics)
    ? category.topics.map((topic) => normalizeTopic(category, topic, defaultTemplate, defaultFont))
    : [];

  return {
    key: category.key,
    area: category.area,
    name: category.name,
    description: category.description,
    defaultTemplate,
    templates,
    defaultFont,
    fonts,
    topics,
  };
};

const normalizeTopic = (category, topic, defaultTemplate, defaultFont) => {
  const templateKey = resolveTemplateKey(topic.plantilla || defaultTemplate);
  const slides = Number.isFinite(topic.slides) && topic.slides > 0 ? topic.slides : DEFAULT_SLIDES;
  const idioma = typeof topic.idioma === 'string' && topic.idioma.trim()
    ? topic.idioma.trim()
    : DEFAULT_LANGUAGE;
  const fontKey = resolveFontKey(topic.font || defaultFont);

  return {
    key: topic.key,
    title: topic.title,
    description: topic.description || '',
    plantilla: templateKey,
    slides,
    idioma,
    font: fontKey,
    tags: Array.isArray(topic.tags) ? topic.tags.map((tag) => tag.trim()).filter(Boolean) : [],
  };
};

const CATEGORIES = TOPIC_CATEGORIES.map(normalizedCategory);

const TOPIC_INDEX = new Map();

CATEGORIES.forEach((category) => {
  category.topics.forEach((topic) => {
    TOPIC_INDEX.set(topic.key, {
      ...topic,
      category: {
        key: category.key,
        name: category.name,
        description: category.description,
        area: category.area,
        defaultTemplate: category.defaultTemplate,
        templates: category.templates,
        defaultFont: category.defaultFont,
        fonts: category.fonts,
      },
    });
  });
});

const listTopicCategories = () => CATEGORIES.map((category) => ({
  key: category.key,
  area: category.area,
  name: category.name,
  description: category.description,
  defaultTemplate: category.defaultTemplate,
  templates: [...category.templates],
  defaultFont: category.defaultFont,
  fonts: [...category.fonts],
  topics: category.topics.map((topic) => ({
    key: topic.key,
    title: topic.title,
    description: topic.description,
    plantilla: topic.plantilla,
    font: topic.font,
    slides: topic.slides,
    idioma: topic.idioma,
    tags: [...topic.tags],
  })),
}));

const getTopicByKey = (value) => {
  if (!value) {
    return null;
  }

  const normalizedKey = value.toString().trim().toLowerCase();
  return TOPIC_INDEX.get(normalizedKey) || null;
};

module.exports = {
  listTopicCategories,
  getTopicByKey,
};
