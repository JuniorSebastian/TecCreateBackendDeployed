const SUPPORT_REPORT_CATEGORIES = [
  {
    key: 'bug',
    label: 'Error en la aplicación',
    description: 'Reportes de fallos técnicos o errores de la plataforma.',
    aliases: ['error', 'error en la aplicacion', 'error en la aplicación', 'fallo', 'bug'],
  },
  {
    key: 'soporte',
    label: 'Soporte o problema de cuenta',
    description: 'Solicitudes de ayuda técnica o problemas de acceso.',
    aliases: ['soporte', 'soporte tecnico', 'soporte técnico', 'ayuda', 'problema de cuenta'],
  },
  {
    key: 'idea',
    label: 'Sugerencia o nueva funcionalidad',
    description: 'Sugerencias de nuevas funciones o mejoras al producto.',
    aliases: ['idea', 'mejora', 'sugerencia', 'sugerencia de mejora'],
  },
  {
    key: 'otro',
    label: 'Otro motivo',
    description: 'Cualquier consulta que no encaje en las categorías anteriores.',
    aliases: ['otro', 'otros', 'general', 'consulta'],
  },
];

const SUPPORT_REPORT_STATUSES = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_proceso', label: 'En proceso' },
  { key: 'resuelto', label: 'Resuelto' },
];

const normalizeKey = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase();
};

const canonicalize = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const normalizeCategory = (value) => {
  const key = normalizeKey(value);
  if (!key) {
    return null;
  }

  const direct = SUPPORT_REPORT_CATEGORIES.find((category) => category.key === key);
  if (direct) {
    return direct.key;
  }

  const canonical = canonicalize(value);
  if (!canonical) {
    return null;
  }

  const match = SUPPORT_REPORT_CATEGORIES.find((category) => {
    if (canonicalize(category.label) === canonical) {
      return true;
    }
    return Array.isArray(category.aliases)
      && category.aliases.some((alias) => canonicalize(alias) === canonical);
  });

  return match ? match.key : null;
};

const normalizeStatus = (value) => {
  const key = normalizeKey(value);
  if (!key) {
    return null;
  }

  const direct = SUPPORT_REPORT_STATUSES.find((status) => status.key === key);
  if (direct) {
    return direct.key;
  }

  const canonical = canonicalize(value);
  const match = SUPPORT_REPORT_STATUSES.find(
    (status) => canonicalize(status.label) === canonical,
  );

  return match ? match.key : null;
};

const listSupportCategories = () => SUPPORT_REPORT_CATEGORIES.map((category) => ({
  key: category.key,
  label: category.label,
  description: category.description,
}));

const listSupportStatuses = () => SUPPORT_REPORT_STATUSES.map((status) => ({
  key: status.key,
  label: status.label,
}));

const getSupportCategorySummary = (value) => {
  const key = normalizeCategory(value);
  if (!key) {
    return null;
  }

  const category = SUPPORT_REPORT_CATEGORIES.find((item) => item.key === key);
  if (!category) {
    return {
      key,
      label: key,
      description: '',
    };
  }

  return {
    key: category.key,
    label: category.label,
    description: category.description,
  };
};

const getSupportStatusSummary = (value) => {
  const key = normalizeStatus(value);
  if (!key) {
    return null;
  }

  const status = SUPPORT_REPORT_STATUSES.find((item) => item.key === key);
  if (!status) {
    return {
      key,
      label: key,
    };
  }

  return {
    key: status.key,
    label: status.label,
  };
};

module.exports = {
  SUPPORT_REPORT_CATEGORIES,
  SUPPORT_REPORT_STATUSES,
  normalizeCategory,
  normalizeStatus,
  listSupportCategories,
  listSupportStatuses,
  getSupportCategorySummary,
  getSupportStatusSummary,
};
