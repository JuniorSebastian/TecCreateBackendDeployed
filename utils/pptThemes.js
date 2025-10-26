const DEFAULT_THEME = {
  background: 'F8FAFC',
  surface: 'FFFFFF',
  accent: '1D4ED8',
  accentSoft: 'DBEAFE',
  accentMuted: 'BFDBFE',
  bulletBackground: 'F1F5F9',
  bulletHeading: '1E293B',
  divider: 'E2E8F0',
  textPrimary: '0F172A',
  textSecondary: '475569',
  highlightBackground: 'E0F2FE',
  highlightBorder: '38BDF8',
  highlightAccent: '0284C7',
  footer: '475569',
  avatarBackground: 'E0E7FF',
  avatarBorder: 'C7D2FE',
  authorPanel: 'F8FAFC',
  authorPanelBorder: 'CBD5F5',
  badgeLabel: '1D4ED8',
  badgeGlow: 'EFF6FF',
  watermark: '94A3B8',
};

const PPT_TEMPLATES = {
  default: {
    key: 'default',
    name: 'TecCreate Clásico',
    description: 'Paleta corporativa actual con azules brillantes y fondos claros.',
    palette: ['#1D4ED8', '#0F172A', '#BFDBFE', '#F8FAFC'],
    theme: DEFAULT_THEME,
  },
  software: {
    key: 'software',
    name: 'Diseño y Desarrollo de Software',
    description: 'Inspirada en UI modernas: azul eléctrico, gris oscuro y acentos violetas.',
    palette: ['#007BFF', '#2C2C2C', '#7C4DFF', '#FFFFFF'],
    theme: {
      background: 'F3F6FF',
      surface: 'FFFFFF',
      accent: '007BFF',
      accentSoft: 'CFE4FF',
      accentMuted: 'A8C6FF',
      bulletBackground: 'EEF2FF',
      bulletHeading: '1F2937',
      divider: 'D8E3FF',
      textPrimary: '1A202E',
      textSecondary: '4B5563',
      highlightBackground: 'EFE9FF',
      highlightBorder: '7C4DFF',
      highlightAccent: '5B32D4',
      footer: '2C2C2C',
      avatarBackground: 'E5E7FF',
      avatarBorder: 'C4C7FF',
      authorPanel: 'F7F9FF',
      authorPanelBorder: 'D2DAFF',
      badgeLabel: '007BFF',
      badgeGlow: 'E6F0FF',
      watermark: '9CA3AF',
    },
  },
  maquinaria: {
    key: 'maquinaria',
    name: 'Gestión y Mantenimiento de Maquinaria',
    description: 'Colores industriales con amarillo maquinaria y acentos metálicos.',
    palette: ['#FFC107', '#1B1B1B', '#9E9E9E', '#004D40'],
    theme: {
      background: 'FBF5E6',
      surface: 'FFFFFF',
      accent: 'FFC107',
      accentSoft: 'FFE8A3',
      accentMuted: 'FFD66B',
      bulletBackground: 'FFF7DA',
      bulletHeading: '1E1E1E',
      divider: 'E4DCC3',
      textPrimary: '222222',
      textSecondary: '4A4A4A',
      highlightBackground: 'F5F0E0',
      highlightBorder: '9E9E9E',
      highlightAccent: '004D40',
      footer: '1B1B1B',
      avatarBackground: 'FFF3C4',
      avatarBorder: 'E2C16F',
      authorPanel: 'FAF3DF',
      authorPanelBorder: 'E8D8AA',
      badgeLabel: '004D40',
      badgeGlow: 'FFF2C6',
      watermark: '7A7A7A',
    },
  },
  mecatronica: {
    key: 'mecatronica',
    name: 'Mecatrónica Industrial',
    description: 'Fusiona azul cobalto, verde neón y tonos acero para un look futurista.',
    palette: ['#0057B8', '#00C853', '#607D8B', '#121212'],
    theme: {
      background: 'EBF3FF',
      surface: 'FFFFFF',
      accent: '0057B8',
      accentSoft: 'BCD8FF',
      accentMuted: '8AB9F0',
      bulletBackground: 'E3F7EE',
      bulletHeading: '0B1F33',
      divider: 'C9D9E7',
      textPrimary: '10212E',
      textSecondary: '44525E',
      highlightBackground: 'E2FFE8',
      highlightBorder: '00C853',
      highlightAccent: '00A844',
      footer: '121212',
      avatarBackground: 'DDEAFE',
      avatarBorder: 'AFCFF5',
      authorPanel: 'F1F6FF',
      authorPanelBorder: 'C5D8F2',
      badgeLabel: '00C853',
      badgeGlow: 'E2FFEF',
      watermark: '6B7C89',
    },
  },
  quimica: {
    key: 'quimica',
    name: 'Procesos Químicos y Metalúrgicos',
    description: 'Azul petróleo con acentos cobre y grises neutros de laboratorio.',
    palette: ['#01579B', '#EF6C00', '#757575', '#F5F5F5'],
    theme: {
      background: 'EFF5FB',
      surface: 'FFFFFF',
      accent: '01579B',
      accentSoft: 'C7DEF4',
      accentMuted: '94C4E6',
      bulletBackground: 'F4F6F8',
      bulletHeading: '0F1F2B',
      divider: 'D6DEE5',
      textPrimary: '133045',
      textSecondary: '4F5B66',
      highlightBackground: 'FBEDE2',
      highlightBorder: 'EF6C00',
      highlightAccent: 'C65600',
      footer: '515C66',
      avatarBackground: 'E3EFF8',
      avatarBorder: 'C1D8ED',
      authorPanel: 'F7FAFD',
      authorPanelBorder: 'D6E3F1',
      badgeLabel: 'EF6C00',
      badgeGlow: 'FEF3E7',
      watermark: '7C878F',
    },
  },
};

const resolveTemplateKey = (value) => {
  if (typeof value === 'string') {
    const key = value.trim().toLowerCase();
    if (key && PPT_TEMPLATES[key]) {
      return key;
    }
  }
  return 'default';
};

const getTemplateConfig = (value) => PPT_TEMPLATES[resolveTemplateKey(value)];

const getTemplateTheme = (value) => ({ ...getTemplateConfig(value).theme });

const listTemplateSummaries = () => Object.values(PPT_TEMPLATES).map(({ key, name, description, palette }) => ({
  key,
  name,
  description,
  palette: [...palette],
}));

const getTemplateSummary = (value) => {
  const config = getTemplateConfig(value);
  return {
    key: config.key,
    name: config.name,
    description: config.description,
    palette: [...config.palette],
  };
};

module.exports = {
  PPT_TEMPLATES,
  resolveTemplateKey,
  getTemplateConfig,
  getTemplateTheme,
  listTemplateSummaries,
  getTemplateSummary,
};
