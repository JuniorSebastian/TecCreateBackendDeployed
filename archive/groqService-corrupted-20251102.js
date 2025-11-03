/*
  Archivo archivado: services/groqService-corrupted.js
  Fecha: 2025-11-02
  Nota: El archivo original estaba corrupto/incompleto y provocaba errores de parseo. Se conserva aquí como referencia
  dentro de un bloque de comentario para evitar que Node lo ejecute accidentalmente.

  Si deseas restaurarlo, revisa este archivo y extrae las secciones válidas manualmente.

  Contenido original (tal como estaba):

*/
/* ORIGINAL FILE START
const { jsonrepair } = require('jsonrepair');
const { sanitizeContenido } = require('../lib/presentaciones');
const { c      // SEGUNDO: Si no hay bullets, intentar separar por líneas y otros delimitadores
      const expanded = item
        .replace(/[^/\u2022•▪◦●]/g, '\n')
        .replace(/\s*[\-–—]\s+/g, '\n')
        .replace(/\s*\d+[\).]\s+/g, '\n')
        // Agregar separación por cambio de caso (incluye números)
        .replace(/([a-záéíóúñ0-9])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
        .replace(/([.!?])([A-ZÁÉÍÓÚÑ])/g, '$1\n$2')
  .split(/[\n\r]+/);exto, corregirLista } = require('../lib/ortografia');
const { ensureGroqClient } = require('./groqClient');

const MAX_LOG_LENGTH = 400;

... (rest of original file omitted in archive for brevity) ...

module.exports = {
  generarSlidesConGroq,
};

ORIGINAL FILE END */

// Archivo archivado. No exporta nada. Para usar el servicio activo revisa `services/groqService.js`.
