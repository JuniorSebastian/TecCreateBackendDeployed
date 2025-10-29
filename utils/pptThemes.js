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
  modern: {
    key: 'modern',
    name: 'Moderno',
    description: 'Diseño contemporáneo con gradientes suaves y espacios amplios.',
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
  minimal: {
    key: 'minimal',
    name: 'Minimalista',
    description: 'Diseño limpio y elegante con enfoque en el contenido.',
    palette: ['#000000', '#FFFFFF', '#F5F5F5', '#E0E0E0'],
    theme: {
      background: 'FFFFFF',
      surface: 'FAFAFA',
      accent: '000000',
      accentSoft: 'E0E0E0',
      accentMuted: 'BDBDBD',
      bulletBackground: 'F5F5F5',
      bulletHeading: '212121',
      divider: 'E0E0E0',
      textPrimary: '000000',
      textSecondary: '757575',
      highlightBackground: 'F5F5F5',
      highlightBorder: '9E9E9E',
      highlightAccent: '424242',
      footer: '616161',
      avatarBackground: 'F5F5F5',
      avatarBorder: 'E0E0E0',
      authorPanel: 'FAFAFA',
      authorPanelBorder: 'E0E0E0',
      badgeLabel: '000000',
      badgeGlow: 'F5F5F5',
      watermark: 'BDBDBD',
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
