const express = require('express');
const {
  verificarToken,
  verificarEstado,
  verificarRol,
} = require('../middlewares/authMiddleware');
const soporteController = require('../controllers/soporteController');
const asyncHandler = require('../lib/asyncHandler');

const router = express.Router();
const requiereSoporte = [verificarToken, verificarEstado, verificarRol(['admin', 'soporte'])];

router.get('/mantenimiento', requiereSoporte, asyncHandler(soporteController.obtenerEstadoMantenimiento));
router.patch('/mantenimiento', requiereSoporte, asyncHandler(soporteController.actualizarModoMantenimiento));

router.get('/usuarios', requiereSoporte, asyncHandler(soporteController.listarUsuarios));
router.get('/usuarios/:id/presentaciones', requiereSoporte, asyncHandler(soporteController.listarPresentacionesDeUsuario));
router.get('/usuarios/:id/presentaciones/:presentacionId', requiereSoporte, asyncHandler(soporteController.obtenerPresentacionDeUsuario));
router.get('/usuarios/:email', requiereSoporte, asyncHandler(soporteController.obtenerUsuarioPorEmail));

router.get('/reportes', requiereSoporte, asyncHandler(soporteController.listarReportes));
router.patch('/reportes/:id', requiereSoporte, asyncHandler(soporteController.actualizarReporte));
router.delete('/reportes/:id', requiereSoporte, asyncHandler(soporteController.eliminarReporte));
router.get('/reportes/:id/comentarios', requiereSoporte, asyncHandler(soporteController.listarComentariosReporte));
router.post('/reportes/:id/comentarios', requiereSoporte, asyncHandler(soporteController.crearComentarioReporte));
router.get('/reportes/metricas', requiereSoporte, asyncHandler(soporteController.obtenerMetricasReportes));
router.get('/reportes/exportar', requiereSoporte, asyncHandler(soporteController.exportarReportes));

router.get('/historial/mantenimientos', requiereSoporte, asyncHandler(soporteController.listarHistorialMantenimientos));
router.get('/historial/reportes', requiereSoporte, asyncHandler(soporteController.listarHistorialReportes));

router.get('/logs', requiereSoporte, asyncHandler(soporteController.listarLogsSistema));
router.post('/logs', requiereSoporte, asyncHandler(soporteController.crearLogSistema));

router.get('/notificaciones', requiereSoporte, asyncHandler(soporteController.listarNotificaciones));
router.patch('/notificaciones/:id/leido', requiereSoporte, asyncHandler(soporteController.marcarNotificacionLeida));
router.post('/notificaciones', requiereSoporte, asyncHandler(soporteController.crearNotificacion));

module.exports = router;
