// routes/presentacionesRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken, verificarEstado, verificarRol } = require('../middlewares/authMiddleware');
const {
  obtenerMisPresentaciones,
  crearPresentacion,
  obtenerPresentacionPorId,
  actualizarPresentacion,
  eliminarPresentacion,
  exportarPresentacion,
  compartirPresentacion,
  generarDiapositivasIA,
  generarPresentacionIAyExportar,
  generarImagenesPresentacion,
  obtenerPlantillasPpt,
  obtenerFuentesPpt,
  obtenerTemasSugeridos,
  exportarTemaSugerido,
  obtenerTemaSugeridoPorClave,
} = require('../controllers/presentacionesController');

const asyncHandler = require('../lib/asyncHandler');

// ✅ Usa el middleware correctamente
router.get('/plantillas', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), asyncHandler(obtenerPlantillasPpt));
router.get('/fuentes', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), asyncHandler(obtenerFuentesPpt));
router.get('/temas', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), asyncHandler(obtenerTemasSugeridos));
router.get('/temas/:tema', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), asyncHandler(obtenerTemaSugeridoPorClave));
router.get('/mias', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), asyncHandler(obtenerMisPresentaciones));
router.post('/', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(crearPresentacion));
router.post('/generar', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(generarDiapositivasIA));
router.post('/generar/export', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(generarPresentacionIAyExportar));
router.post('/temas/:tema/export', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(exportarTemaSugerido));
router.post('/:id/imagenes', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(generarImagenesPresentacion));
router.put('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(actualizarPresentacion));
router.delete('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), asyncHandler(eliminarPresentacion));
router.post('/:id/share', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(compartirPresentacion));
router.get('/:id/export', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), asyncHandler(exportarPresentacion));
router.get('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), asyncHandler(obtenerPresentacionPorId));

module.exports = router;
