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

// ✅ Usa el middleware correctamente
router.get('/plantillas', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), obtenerPlantillasPpt);
router.get('/fuentes', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), obtenerFuentesPpt);
router.get('/temas', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), obtenerTemasSugeridos);
router.get('/temas/:tema', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), obtenerTemaSugeridoPorClave);
router.get('/mias', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), obtenerMisPresentaciones);
router.post('/', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), crearPresentacion);
router.post('/generar', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), generarDiapositivasIA);
router.post('/generar/export', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), generarPresentacionIAyExportar);
router.post('/temas/:tema/export', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), exportarTemaSugerido);
router.post('/:id/imagenes', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), generarImagenesPresentacion);
router.put('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), actualizarPresentacion);
router.delete('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), eliminarPresentacion);
router.post('/:id/share', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), compartirPresentacion);
router.get('/:id/export', verificarToken, verificarEstado, verificarRol(['admin', 'usuario']), exportarPresentacion);
router.get('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'usuario', 'soporte']), obtenerPresentacionPorId);

module.exports = router;
