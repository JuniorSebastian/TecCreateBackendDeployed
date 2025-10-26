
// controllers/presentacionesController.js
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const QRCode = require('qrcode');
const pool = require('../database');
const { sanitizeContenido } = require('../utils/presentaciones');
const {
  obtenerPresentacionPorIdYUsuario,
  obtenerPresentacionPorId,
  mapRowToPresentation,
} = require('../services/presentacionService');
const { generarSlidesConGroq } = require('../services/groqService');
const { crearPresentacionPptx, normalizeSlides } = require('../services/pptService');
const {
  generateImagesForSlides,
  generateImagesForPresentation,
  obtenerImagenesPorPresentacion,
} = require('../services/geminiService');
const {
  resolveTemplateKey,
  listTemplateSummaries,
  getTemplateSummary,
} = require('../utils/pptThemes');
const {
  listTopicCategories,
  getTopicByKey,
} = require('../utils/presentacionTopics');
const {
  resolveFontKey,
  listFontSummaries,
  getFontSummary,
  DEFAULT_FONT_KEY,
} = require('../utils/pptFonts');

const SHARE_OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'shared-presentaciones');

const ensureDirectoryExists = async (dirPath) => {
  if (!dirPath) {
    return;
  }

  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

const slugifyForFilename = (value, fallback = 'presentacion') => {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback.toLowerCase();
  }

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return (normalized || fallback).toLowerCase();
};

const getPublicBaseUrl = (req) => {
  const fromEnv = typeof process.env.PUBLIC_BASE_URL === 'string'
    ? process.env.PUBLIC_BASE_URL.trim()
    : '';

  if (fromEnv) {
    return fromEnv.replace(/\/+$/g, '');
  }

  const host = typeof req.get === 'function' ? req.get('host') : '';
  if (!host) {
    return '';
  }

  const protocol = (req.protocol || 'http').replace(/:$/, '');
  return `${protocol}://${host}`;
};

const buildPresentacionBase = (tema, numSlides, idioma) => ({
  titulo: tema,
  contenido: Array.from({ length: numSlides }, (_, idx) => `Sección ${idx + 1}`),
  numero_slides: numSlides,
  idioma,
});

const sanitizeSingleLine = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
};

const buildAuthorContext = (usuario = {}) => {
  if (!usuario || typeof usuario !== 'object') {
    return { nombre: '', email: '' };
  }

  const email = sanitizeSingleLine(usuario.email || usuario.correo || '');
  const nombre = sanitizeSingleLine(
    usuario.nombre
      || usuario.name
      || usuario.displayName
      || (email ? email.split('@')[0] : '')
  );

  return {
    nombre,
    email,
  };
};

const ensureNormalizedSlides = (slides, temaFallback) => {
  const baseSlides = Array.isArray(slides) && slides.length
    ? slides
    : [temaFallback ? String(temaFallback).trim() || 'Sección 1' : 'Sección 1'];
  return normalizeSlides(baseSlides);
};

const buildPptExportPayload = async (presentacion, usuario) => {
  let slides;
  try {
    slides = await generarSlidesConGroq(presentacion);
  } catch (groqError) {
    console.warn('Groq no pudo generar slides estructurados, usando contenido original:', groqError);
    if (groqError.rawResponse) {
      console.warn('Respuesta cruda de Groq (recortada):', groqError.rawResponse);
    }

    const fallbackSegments = sanitizeContenido(presentacion.contenido);
    slides = normalizeSlides(fallbackSegments);
  }

  const normalizedSlides = ensureNormalizedSlides(slides, presentacion.titulo || 'Presentación TecCreate');
  const autor = buildAuthorContext(usuario);
  const templateKey = resolveTemplateKey(presentacion?.plantilla);
  const templateSummary = getTemplateSummary(templateKey);
  const fontKey = resolveFontKey(presentacion?.fuente);
  const fontSummary = getFontSummary(fontKey);

  const candidateId = presentacion && presentacion.id != null
    ? Number.parseInt(presentacion.id, 10)
    : null;
  const presentacionId = Number.isFinite(candidateId) && candidateId > 0 ? candidateId : null;
  const idiomaPreferido = typeof presentacion?.idioma === 'string' && presentacion.idioma.trim()
    ? presentacion.idioma.trim()
    : 'es';

  let imagenes = [];
  if (process.env.GEMINI_API_KEY) {
    if (presentacionId) {
      try {
        imagenes = await obtenerImagenesPorPresentacion(presentacionId);
      } catch (imageLookupError) {
        console.warn('No se pudieron recuperar imágenes almacenadas:', imageLookupError.message);
      }

      if (!imagenes || !imagenes.length) {
        try {
          const imageGeneration = await generateImagesForPresentation(presentacionId, {
            slides: normalizedSlides,
            titulo: presentacion.titulo,
            idioma: idiomaPreferido,
          });
          imagenes = imageGeneration.imagenes || [];
        } catch (imageGenerationError) {
          console.warn('No se pudieron generar imágenes con Gemini:', imageGenerationError.message);
        }
      }
    } else {
      try {
        const previewImages = await generateImagesForSlides(normalizedSlides, {
          titulo: presentacion.titulo,
          idioma: idiomaPreferido,
        });

        imagenes = previewImages
          .filter((item) => item && !item.error && (item.publicUrl || item.url))
          .map((item) => ({
            numeroSlide: item.numeroSlide,
            url: item.publicUrl || item.url,
            publicUrl: item.publicUrl || item.url,
            filePath: item.filePath,
            mimeType: item.mimeType,
            prompt: item.prompt,
          }));
      } catch (previewError) {
        console.warn('No se pudieron generar imágenes temporales con Gemini:', previewError.message);
      }
    }
  }

  const pptBuffer = await crearPresentacionPptx({
    ...presentacion,
    contenido: normalizedSlides,
    autor,
    plantilla: templateKey,
    fuente: fontKey,
    imagenes,
  });

  return {
    pptBuffer,
    normalizedSlides,
    imagenes,
    autor,
    template: templateSummary,
    templateKey,
    font: fontSummary,
    fontKey,
  };
};

const mapSlidesToResponse = (normalizedSlides) => normalizedSlides.map((slide, index) => {
  const rawTitle = typeof slide?.title === 'string' ? slide.title.trim() : '';
  const titulo = rawTitle || `Sección ${index + 1}`;
  const bullets = Array.isArray(slide?.bullets) && slide.bullets.length
    ? slide.bullets
        .map((bullet) => (typeof bullet === 'string' ? bullet.replace(/\s+/g, ' ').trim() : ''))
        .filter(Boolean)
    : [titulo];

  const paragraphs = Array.isArray(slide?.contentParagraphs) && slide.contentParagraphs.length
    ? slide.contentParagraphs
        .map((paragraph) => (typeof paragraph === 'string' ? paragraph.replace(/\s+/g, ' ').trim() : ''))
        .filter(Boolean)
    : typeof slide?.contenido === 'string' && slide.contenido.trim()
      ? [slide.contenido.trim()]
      : [];

  return {
    titulo,
    contenido: paragraphs.length ? paragraphs.join('\n\n') : bullets.join('\n'),
    bullets,
    descripcion: typeof slide?.descripcion === 'string'
      ? slide.descripcion.replace(/\s+/g, ' ').trim()
      : '',
    contentParagraphs: paragraphs,
  };
});

exports.obtenerMisPresentaciones = async (req, res) => {
  try {
    const usuario = req.usuario || {};
    const emailSesion = sanitizeSingleLine(usuario.email || usuario.correo || '');
    if (!emailSesion) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const rol = sanitizeSingleLine(usuario.rol || '').toLowerCase();
    const elevatedAccess = rol === 'admin' || rol === 'soporte';

    const rawEmailQuery = sanitizeSingleLine(
      req.query?.email
        || req.query?.usuarioEmail
        || req.query?.userEmail
        || req.query?.correo
        || ''
    );

    const rawUserId = sanitizeSingleLine(
      typeof req.query?.usuarioId !== 'undefined'
        ? String(req.query.usuarioId)
        : typeof req.query?.userId !== 'undefined'
          ? String(req.query.userId)
          : typeof req.query?.idUsuario !== 'undefined'
            ? String(req.query.idUsuario)
            : ''
    );

    let ownerMetadata = {
      id: Number.isFinite(Number(usuario.id)) ? Number(usuario.id) : null,
      nombre: sanitizeSingleLine(usuario.nombre || usuario.name || '') || null,
      email: emailSesion,
      encontrado: true,
    };

    if (elevatedAccess) {
      if (rawUserId) {
        const parsedId = Number(rawUserId);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
          return res.status(400).json({ error: 'Identificador de usuario inválido' });
        }

        const targetUserResult = await pool.query(
          'SELECT id, nombre, email FROM usuarios WHERE id = $1 LIMIT 1',
          [parsedId],
        );

        if (!targetUserResult.rowCount) {
          return res.status(404).json({ error: 'Usuario solicitado no encontrado' });
        }

        const targetUser = targetUserResult.rows[0];
        ownerMetadata = {
          id: targetUser.id,
          nombre: sanitizeSingleLine(targetUser.nombre || '') || null,
          email: sanitizeSingleLine(targetUser.email || ''),
          encontrado: true,
        };
      } else if (rawEmailQuery) {
        const targetUserResult = await pool.query(
          'SELECT id, nombre, email FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1',
          [rawEmailQuery],
        );

        if (targetUserResult.rowCount) {
          const targetUser = targetUserResult.rows[0];
          ownerMetadata = {
            id: targetUser.id,
            nombre: sanitizeSingleLine(targetUser.nombre || '') || null,
            email: sanitizeSingleLine(targetUser.email || ''),
            encontrado: true,
          };
        } else {
          ownerMetadata = {
            id: null,
            nombre: null,
            email: rawEmailQuery,
            encontrado: false,
          };
        }
      }
    }

    const ownerEmail = ownerMetadata.email;
    if (!ownerEmail) {
      return res.status(400).json({ error: 'No se pudo determinar el propietario de las presentaciones solicitadas' });
    }

    const result = await pool.query(
      `SELECT id, titulo, contenido, plantilla, fuente, idioma, numero_slides, fecha_creacion, email
       FROM presentaciones
       WHERE LOWER(email) = LOWER($1)
       ORDER BY fecha_creacion DESC`,
      [ownerEmail],
    );

    const requesterEmailLower = emailSesion.toLowerCase();

    const presentations = result.rows.map((row) => {
      const presentation = mapRowToPresentation(row);
      return {
        ...presentation,
        propietario_id: ownerMetadata.id,
        propietario_nombre: ownerMetadata.nombre,
        propietario_email: sanitizeSingleLine(row.email || ownerMetadata.email || ''),
        propietario_encontrado: Boolean(ownerMetadata.encontrado),
        propietario_es_solicitante: typeof row.email === 'string'
          ? row.email.toLowerCase() === requesterEmailLower
          : ownerEmail.toLowerCase() === requesterEmailLower,
      };
    });

    const meta = {
      propietario: {
        id: ownerMetadata.id,
        nombre: ownerMetadata.nombre,
        email: ownerEmail,
        encontrado: Boolean(ownerMetadata.encontrado),
      },
      solicitadoPor: {
        id: Number.isFinite(Number(usuario.id)) ? Number(usuario.id) : null,
        email: emailSesion,
        rol,
      },
      accesoElevado: elevatedAccess,
      total: presentations.length,
    };

    try {
      const metaHeader = Buffer.from(JSON.stringify(meta), 'utf8').toString('base64');
      res.setHeader('X-Presentaciones-Propietario', metaHeader);
    } catch (headerError) {
      console.warn('No se pudo adjuntar metadatos de propietario en cabecera:', headerError.message);
    }

    res.json(presentations);
  } catch (err) {
    console.error('Error al obtener presentaciones:', err);
    res.status(500).json({ error: 'Error al obtener presentaciones' });
  }
};

exports.crearPresentacion = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if ((req.usuario?.estado || '').toLowerCase() === 'inactivo') {
      return res.status(403).json({ error: 'Tu cuenta está inactiva. Contacta con un administrador para reactivarla.' });
    }

    const { titulo, contenido, plantilla, fuente, idioma, numero_slides } = req.body;

    if (!titulo || !contenido) {
      return res.status(400).json({ error: 'Título y contenido son obligatorios' });
    }

    const sanitizedContenido = sanitizeContenido(contenido);
    const plantillaKey = resolveTemplateKey(plantilla);
    const fuenteKey = resolveFontKey(fuente);

    const result = await pool.query(
      `INSERT INTO presentaciones (titulo, contenido, email, plantilla, fuente, idioma, numero_slides)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, titulo, contenido, plantilla, fuente, idioma, numero_slides, fecha_creacion`,
      [
        titulo.trim(),
        JSON.stringify(sanitizedContenido),
        email,
        plantillaKey,
        fuenteKey,
        idioma || null,
        numero_slides || null,
      ]
    );

    const created = result.rows[0];
    created.contenido = sanitizeContenido(created.contenido);
    created.plantilla = resolveTemplateKey(created.plantilla);
    created.fuente = resolveFontKey(created.fuente);

    res.status(201).json(created);
  } catch (err) {
    console.error('Error al crear presentación:', err);
    res.status(500).json({ error: 'Error al crear presentación' });
  }
};

exports.obtenerPresentacionPorId = async (req, res) => {
  try {
    const usuario = req.usuario || {};
    const emailSesion = sanitizeSingleLine(usuario.email || usuario.correo || '');
    if (!emailSesion) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    const rol = sanitizeSingleLine(usuario.rol || '').toLowerCase();

    const presentacion = (rol === 'admin' || rol === 'soporte')
      ? await obtenerPresentacionPorId(numericId)
      : await obtenerPresentacionPorIdYUsuario(numericId, emailSesion);

    if (!presentacion) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const ownerEmail = sanitizeSingleLine(presentacion.email || '');
    let ownerMetadata = {
      id: null,
      nombre: null,
      email: ownerEmail || null,
      encontrado: false,
    };

    if (ownerEmail) {
      try {
        const ownerResult = await pool.query(
          'SELECT id, nombre FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1',
          [ownerEmail],
        );
        if (ownerResult.rowCount) {
          ownerMetadata = {
            id: ownerResult.rows[0].id,
            nombre: sanitizeSingleLine(ownerResult.rows[0].nombre || '') || null,
            email: ownerEmail,
            encontrado: true,
          };
        }
      } catch (ownerLookupError) {
        console.warn('No se pudo obtener información de propietario para la presentación:', ownerLookupError.message);
      }
    }

    const enriched = {
      ...presentacion,
      plantilla: resolveTemplateKey(presentacion.plantilla),
      fuente: resolveFontKey(presentacion.fuente),
      propietario_id: ownerMetadata.id,
      propietario_nombre: ownerMetadata.nombre,
      propietario_email: ownerMetadata.email,
      propietario_encontrado: Boolean(ownerMetadata.encontrado),
      propietario_es_solicitante: ownerEmail
        ? ownerEmail.toLowerCase() === emailSesion.toLowerCase()
        : false,
    };

    res.json(enriched);
  } catch (err) {
    console.error('Error al obtener presentación:', err);
    res.status(500).json({ error: 'Error al obtener presentación' });
  }
};

exports.actualizarPresentacion = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    const { titulo, contenido, plantilla, fuente, idioma, numero_slides } = req.body || {};

    const setClauses = [];
    const values = [numericId, email];
    let paramIndex = 3;

    if (typeof titulo !== 'undefined') {
      const trimmed = titulo.trim();
      if (!trimmed) {
        return res.status(400).json({ error: 'El título no puede estar vacío' });
      }
      setClauses.push(`titulo = $${paramIndex}`);
      values.push(trimmed);
      paramIndex += 1;
    }

    let sanitizedContenido = null;
    if (typeof contenido !== 'undefined') {
      sanitizedContenido = sanitizeContenido(contenido);
      setClauses.push(`contenido = $${paramIndex}`);
      values.push(JSON.stringify(sanitizedContenido));
      paramIndex += 1;
    }

    if (typeof plantilla !== 'undefined') {
      const plantillaKey = resolveTemplateKey(plantilla);
      setClauses.push(`plantilla = $${paramIndex}`);
      values.push(plantillaKey);
      paramIndex += 1;
    }

    if (typeof fuente !== 'undefined') {
      const fuenteKey = resolveFontKey(fuente);
      setClauses.push(`fuente = $${paramIndex}`);
      values.push(fuenteKey);
      paramIndex += 1;
    }

    if (typeof idioma !== 'undefined') {
      setClauses.push(`idioma = $${paramIndex}`);
      values.push(idioma || null);
      paramIndex += 1;
    }

    const slidesCount = sanitizedContenido
      ? sanitizedContenido.length
      : Number.isInteger(numero_slides) && numero_slides > 0
        ? numero_slides
        : null;

    if (slidesCount !== null) {
      setClauses.push(`numero_slides = $${paramIndex}`);
      values.push(slidesCount);
      paramIndex += 1;
    }

    if (!setClauses.length) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const result = await pool.query(
      `UPDATE presentaciones
       SET ${setClauses.join(', ')}
       WHERE id = $1 AND email = $2
       RETURNING id, titulo, contenido, plantilla, fuente, idioma, numero_slides, fecha_creacion`,
      values
    );

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const updated = result.rows[0];
    updated.contenido = sanitizeContenido(updated.contenido);
    updated.plantilla = resolveTemplateKey(updated.plantilla);
    updated.fuente = resolveFontKey(updated.fuente);

    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar presentación:', err);
    res.status(500).json({ error: 'Error al actualizar presentación' });
  }
};

exports.eliminarPresentacion = async (req, res) => {
  try {
    const usuario = req.usuario;
    const email = usuario?.email;
    if (!usuario || !email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    let result;
    const rol = (usuario.rol || '').toLowerCase();

    if (rol === 'admin' || rol === 'soporte') {
      result = await pool.query(
        'DELETE FROM presentaciones WHERE id = $1',
        [numericId],
      );
    } else {
      result = await pool.query(
        'DELETE FROM presentaciones WHERE id = $1 AND email = $2',
        [numericId, email],
      );
    }

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar presentación:', err);
    res.status(500).json({ error: 'Error al eliminar presentación' });
  }
};

exports.generarDiapositivasIA = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      tema,
      idioma = 'Español',
      numeroSlides = 8,
      slides: slidesFromClient,
      outline,
    } = req.body || {};

    if (!tema || typeof tema !== 'string' || !tema.trim()) {
      return res.status(400).json({ error: 'Debes proporcionar un tema válido' });
    }

    const temaNormalizado = tema.trim();

    const slidesInput = Array.isArray(slidesFromClient)
      ? slidesFromClient
      : Array.isArray(outline)
        ? outline
        : null;

    if (slidesInput) {
      const normalizedSlides = ensureNormalizedSlides(slidesInput, temaNormalizado);
      const slidesConContenido = mapSlidesToResponse(normalizedSlides);

      return res.json({
        tema: temaNormalizado,
        idioma,
        slides: slidesConContenido,
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'Servicio Groq no configurado' });
    }

    const parsedSlides = Number.parseInt(numeroSlides, 10);
    const slidesCount = Number.isFinite(parsedSlides) && parsedSlides > 0
      ? Math.min(parsedSlides, 20)
      : 8;

    const presentacionBase = buildPresentacionBase(temaNormalizado, slidesCount, idioma);

    let normalizedSlides;
    try {
      const groqSlides = await generarSlidesConGroq(presentacionBase);
      normalizedSlides = ensureNormalizedSlides(groqSlides, temaNormalizado);
    } catch (groqError) {
      console.warn('Groq no pudo generar slides estructurados, usando esquema básico:', groqError);
      if (groqError.rawResponse) {
        console.warn('Respuesta cruda de Groq (recortada):', groqError.rawResponse);
      }
      normalizedSlides = ensureNormalizedSlides(presentacionBase.contenido, temaNormalizado);
    }

    const slides = mapSlidesToResponse(normalizedSlides);

    res.json({
      tema: temaNormalizado,
      idioma,
      slides,
    });
  } catch (err) {
    console.error('Error al generar diapositivas con IA:', err);
    res.status(500).json({ error: 'Error al generar diapositivas con IA' });
  }
};

exports.exportarPresentacion = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    const presentacion = await obtenerPresentacionPorIdYUsuario(numericId, email);
    if (!presentacion) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'Servicio Groq no configurado' });
    }

    const plantillaKey = resolveTemplateKey(presentacion.plantilla);
    const { pptBuffer, fontKey } = await buildPptExportPayload(
      { ...presentacion, plantilla: plantillaKey },
      req.usuario,
    );

    if (!pptBuffer || !Buffer.isBuffer(pptBuffer)) {
      return res.status(500).json({ error: 'No se pudo generar el archivo PPT' });
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="TecCreate-${slugifyForFilename(presentacion.titulo, 'presentacion')}.pptx"`
    );
    res.setHeader('X-Presentacion-Plantilla', plantillaKey);
    res.setHeader('X-Presentacion-Fuente', fontKey);
    res.send(pptBuffer);
  } catch (err) {
    console.error('Error al exportar presentación:', err);
    res.status(500).json({ error: 'Error al exportar presentación' });
  }
};

exports.compartirPresentacion = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    const presentacion = await obtenerPresentacionPorIdYUsuario(numericId, email);
    if (!presentacion) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'Servicio Groq no configurado' });
    }

    const plantillaKey = resolveTemplateKey(presentacion.plantilla);
    const { pptBuffer, normalizedSlides, template, font, fontKey } = await buildPptExportPayload(
      { ...presentacion, plantilla: plantillaKey },
      req.usuario,
    );

    if (!pptBuffer || !Buffer.isBuffer(pptBuffer)) {
      return res.status(500).json({ error: 'No se pudo generar el archivo PPT' });
    }

    await ensureDirectoryExists(SHARE_OUTPUT_DIR);

    const shareId = crypto.randomUUID();
    const baseName = slugifyForFilename(presentacion.titulo, 'presentacion');
    const fileName = `${baseName}-${shareId}.pptx`;
    const filePath = path.join(SHARE_OUTPUT_DIR, fileName);

    await fs.writeFile(filePath, pptBuffer);

    const sharePath = `/public/shared-presentaciones/${fileName}`;
    const baseUrl = getPublicBaseUrl(req);
    const shareUrl = baseUrl ? `${baseUrl}${sharePath}` : sharePath;

    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        errorCorrectionLevel: 'Q',
        type: 'image/png',
        margin: 1,
        width: 320,
      });
    } catch (qrError) {
      console.warn('No se pudo generar el código QR para la presentación compartida:', qrError.message);
    }

    res.status(201).json({
      shareId,
      fileName,
      shareUrl,
      sharePath,
      qrCodeDataUrl,
      slides: Array.isArray(normalizedSlides) ? normalizedSlides.length : null,
      createdAt: new Date().toISOString(),
      template,
      font,
      fontKey,
    });
  } catch (err) {
    console.error('Error al generar enlace compartido de la presentación:', err);
    res.status(500).json({ error: 'Error al preparar la presentación compartida' });
  }
};

exports.generarPresentacionIAyExportar = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if ((req.usuario?.estado || '').toLowerCase() === 'inactivo') {
      return res.status(403).json({ error: 'Tu cuenta está inactiva. Contacta con soporte para reactivarla.' });
    }

    const {
      tema,
      idioma = 'Español',
      numeroSlides = 8,
      guardar = false,
      plantilla,
      fuente,
    } = req.body || {};

    if (!tema || typeof tema !== 'string' || !tema.trim()) {
      return res.status(400).json({ error: 'Debes proporcionar un tema válido' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'Servicio Groq no configurado' });
    }

    const parsedSlides = Number.parseInt(numeroSlides, 10);
    const slidesCount = Number.isFinite(parsedSlides) && parsedSlides > 0
      ? Math.min(parsedSlides, 20)
      : 8;

    const temaNormalizado = tema.trim();
    const presentacionBase = buildPresentacionBase(temaNormalizado, slidesCount, idioma);
    const plantillaKey = resolveTemplateKey(plantilla);
    const fuenteKey = resolveFontKey(fuente);

    let normalizedSlides;
    try {
      const groqSlides = await generarSlidesConGroq(presentacionBase);
      normalizedSlides = ensureNormalizedSlides(groqSlides, temaNormalizado);
    } catch (groqError) {
      console.warn('Groq no pudo generar slides estructurados, usando esquema básico:', groqError);
      if (groqError.rawResponse) {
        console.warn('Respuesta cruda de Groq (recortada):', groqError.rawResponse);
      }
      normalizedSlides = ensureNormalizedSlides(presentacionBase.contenido, temaNormalizado);
    }

    const slides = mapSlidesToResponse(normalizedSlides);

    let savedId = null;
    if (guardar) {
      const resumenSlides = slides.map((slide) => {
        const bulletText = Array.isArray(slide.bullets)
          ? slide.bullets.join(' ')
          : typeof slide.contenido === 'string'
            ? slide.contenido.replace(/\s+/g, ' ').trim()
            : '';
        return `${slide.titulo}: ${bulletText}`;
      });

      const insert = await pool.query(
        `INSERT INTO presentaciones (titulo, contenido, email, plantilla, fuente, idioma, numero_slides)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id` ,
        [
          temaNormalizado,
          JSON.stringify(resumenSlides),
          email,
          plantillaKey,
          fuenteKey,
          idioma,
          normalizedSlides.length,
        ]
      );

      savedId = insert.rows[0]?.id || null;
      if (savedId) {
        res.setHeader('X-Presentacion-Id', savedId);
      }
    }

    const autor = buildAuthorContext(req.usuario);

    let imagenes = [];
    if (process.env.GEMINI_API_KEY) {
      try {
        if (guardar && savedId) {
          const resultado = await generateImagesForPresentation(savedId, {
            slides: normalizedSlides,
            titulo: temaNormalizado,
            idioma,
          });
          imagenes = resultado.imagenes || [];
        } else {
          imagenes = await generateImagesForSlides(normalizedSlides, {
            titulo: temaNormalizado,
            idioma,
          });
        }
      } catch (imageError) {
        console.warn('No se pudieron generar imágenes IA para la exportación inmediata:', imageError.message);
      }
    }

    const pptBuffer = await crearPresentacionPptx({
      titulo: temaNormalizado,
      contenido: normalizedSlides,
      idioma,
      numero_slides: normalizedSlides.length,
      autor,
      imagenes,
      plantilla: plantillaKey,
      fuente: fuenteKey,
    });

    const safeTitle = temaNormalizado.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80) || 'PresentacionIA';
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="TecCreate-${safeTitle}.pptx"`
    );
    res.setHeader('X-Presentacion-Plantilla', plantillaKey);
    res.setHeader('X-Presentacion-Fuente', fuenteKey);

    res.send(pptBuffer);
  } catch (err) {
    console.error('Error al generar y exportar presentación IA:', err);
    res.status(500).json({ error: 'Error al generar y exportar presentación IA' });
  }
};

exports.generarImagenesPresentacion = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Servicio Gemini no configurado' });
    }

    const { id } = req.params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Identificador inválido' });
    }

    const presentacion = await obtenerPresentacionPorIdYUsuario(numericId, email);
    if (!presentacion) {
      return res.status(404).json({ error: 'Presentación no encontrada' });
    }

    const contenidoSanitizado = sanitizeContenido(presentacion.contenido);
    const normalizedSlides = ensureNormalizedSlides(contenidoSanitizado, presentacion.titulo);

    const resultado = await generateImagesForPresentation(numericId, {
      slides: normalizedSlides,
      titulo: presentacion.titulo,
      idioma: presentacion.idioma || 'es',
    });

    res.json({
      presentacionId: numericId,
      imagenes: resultado.imagenes,
      errores: resultado.errores,
    });
  } catch (err) {
    console.error('Error al generar imágenes de la presentación:', err);
    res.status(500).json({ error: 'Error al generar imágenes de la presentación' });
  }
};

exports.obtenerTemasSugeridos = (req, res) => {
  const categories = listTopicCategories().map((category) => ({
    key: category.key,
    area: category.area,
    name: category.name,
    description: category.description,
    defaultTemplate: getTemplateSummary(category.defaultTemplate),
    templates: category.templates.map((templateKey) => getTemplateSummary(templateKey)),
    defaultFont: getFontSummary(category.defaultFont),
    fonts: category.fonts.map((fontKey) => getFontSummary(fontKey)),
    topics: category.topics.map((topic) => ({
      key: topic.key,
      title: topic.title,
      description: topic.description,
      plantilla: getTemplateSummary(topic.plantilla),
      font: getFontSummary(topic.font),
      slides: topic.slides,
      idioma: topic.idioma,
      tags: topic.tags,
    })),
  }));

  const totalTopics = categories.reduce((sum, category) => sum + category.topics.length, 0);

  res.json({
    categories,
    totalTopics,
    defaultTemplate: getTemplateSummary('default'),
    defaultFont: getFontSummary(DEFAULT_FONT_KEY),
    fonts: listFontSummaries(),
  });
};

exports.obtenerTemaSugeridoPorClave = (req, res) => {
  const { tema: temaKey } = req.params;
  const topic = getTopicByKey(temaKey);

  if (!topic) {
    return res.status(404).json({ error: 'Tema sugerido no encontrado' });
  }

  const categoryTemplates = topic.category?.templates || [];
  const categoryFonts = topic.category?.fonts || [];

  return res.json({
    topic: {
      key: topic.key,
      title: topic.title,
      description: topic.description,
      plantilla: getTemplateSummary(topic.plantilla),
      font: getFontSummary(topic.font),
      slides: topic.slides,
      idioma: topic.idioma,
      tags: topic.tags,
    },
    category: topic.category
      ? {
          key: topic.category.key,
          name: topic.category.name,
          description: topic.category.description,
          area: topic.category.area,
          defaultTemplate: getTemplateSummary(topic.category.defaultTemplate),
          templates: categoryTemplates.map((templateKey) => getTemplateSummary(templateKey)),
          defaultFont: getFontSummary(topic.category.defaultFont),
          fonts: categoryFonts.map((fontKey) => getFontSummary(fontKey)),
        }
      : null,
    availableTemplates: categoryTemplates.map((templateKey) => getTemplateSummary(templateKey)),
    defaultTemplate: getTemplateSummary('default'),
    availableFonts: categoryFonts.map((fontKey) => getFontSummary(fontKey)),
    defaultFont: getFontSummary(DEFAULT_FONT_KEY),
  });
};

exports.exportarTemaSugerido = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'Servicio Groq no configurado' });
    }

    const { tema: temaKey } = req.params;
    const topic = getTopicByKey(temaKey);

    if (!topic) {
      return res.status(404).json({ error: 'Tema sugerido no encontrado' });
    }

  const overrides = req.body || {};
  const slidesOverride = Number.parseInt(overrides.numeroSlides ?? overrides.slides, 10);
  const idiomaOverride = typeof overrides.idioma === 'string' ? overrides.idioma.trim() : '';
  const plantillaOverride = overrides.plantilla;
  const fuenteOverride = overrides.fuente;

    const slidesCount = Number.isFinite(slidesOverride) && slidesOverride > 0
      ? Math.min(slidesOverride, 20)
      : topic.slides;

  const idioma = idiomaOverride || topic.idioma || 'Español';
  const plantillaKey = resolveTemplateKey(plantillaOverride || topic.plantilla || topic.category?.defaultTemplate);
  const fontKey = resolveFontKey(fuenteOverride || topic.font || topic.category?.defaultFont);

    const base = buildPresentacionBase(topic.title, slidesCount, idioma);

    const presentacion = {
      id: null,
      titulo: topic.title,
      contenido: base.contenido,
      numero_slides: slidesCount,
      idioma,
      plantilla: plantillaKey,
      fuente: fontKey,
    };

    const { pptBuffer, template, font } = await buildPptExportPayload(presentacion, req.usuario);

    if (!pptBuffer || !Buffer.isBuffer(pptBuffer)) {
      return res.status(500).json({ error: 'No se pudo generar el archivo PPT para el tema sugerido' });
    }

    const safeTitle = slugifyForFilename(`${topic.title}-${plantillaKey}`, 'presentacion-tema');

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="TecCreate-${safeTitle}.pptx"`
    );
    res.setHeader('X-Presentacion-Plantilla', plantillaKey);
    res.setHeader('X-Presentacion-Topic', topic.key);
    res.setHeader('X-Presentacion-Fuente', fontKey);
    if (topic.category?.key) {
      res.setHeader('X-Presentacion-Categoria', topic.category.key);
    }
    if (template?.name) {
      res.setHeader('X-Presentacion-Plantilla-Name', template.name);
    }
    if (font?.name) {
      res.setHeader('X-Presentacion-Fuente-Name', font.name);
    }

    res.send(pptBuffer);
  } catch (err) {
    console.error('Error al exportar tema sugerido:', err);
    res.status(500).json({ error: 'Error al exportar el tema sugerido' });
  }
};

exports.obtenerPlantillasPpt = (req, res) => {
  res.json({
    default: 'default',
    templates: listTemplateSummaries(),
  });
};

exports.obtenerFuentesPpt = (req, res) => {
  res.json({
    default: DEFAULT_FONT_KEY,
    fonts: listFontSummaries(),
  });
};