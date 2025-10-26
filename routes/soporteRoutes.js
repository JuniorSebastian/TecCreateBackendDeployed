const express = require('express');
const {
  verificarToken,
  verificarEstado,
  verificarRol,
} = require('../middlewares/authMiddleware');
const soporteController = require('../controllers/soporteController');

const router = express.Router();
const requiereSoporte = [verificarToken, verificarEstado, verificarRol(['admin', 'soporte'])];

router.get('/mantenimiento', requiereSoporte, soporteController.obtenerEstadoMantenimiento);
router.patch('/mantenimiento', requiereSoporte, soporteController.actualizarModoMantenimiento);

router.get('/usuarios', requiereSoporte, soporteController.listarUsuarios);
router.get('/usuarios/:id/presentaciones', requiereSoporte, soporteController.listarPresentacionesDeUsuario);
router.get('/usuarios/:id/presentaciones/:presentacionId', requiereSoporte, soporteController.obtenerPresentacionDeUsuario);
router.get('/usuarios/:email', requiereSoporte, soporteController.obtenerUsuarioPorEmail);

router.get('/reportes', requiereSoporte, soporteController.listarReportes);
router.patch('/reportes/:id', requiereSoporte, soporteController.actualizarReporte);
router.delete('/reportes/:id', requiereSoporte, soporteController.eliminarReporte);
router.get('/reportes/:id/comentarios', requiereSoporte, soporteController.listarComentariosReporte);
router.post('/reportes/:id/comentarios', requiereSoporte, soporteController.crearComentarioReporte);
router.get('/reportes/metricas', requiereSoporte, soporteController.obtenerMetricasReportes);
router.get('/reportes/exportar', requiereSoporte, soporteController.exportarReportes);

router.get('/historial/mantenimientos', requiereSoporte, soporteController.listarHistorialMantenimientos);
router.get('/historial/reportes', requiereSoporte, soporteController.listarHistorialReportes);

router.get('/logs', requiereSoporte, soporteController.listarLogsSistema);
router.post('/logs', requiereSoporte, soporteController.crearLogSistema);

router.get('/notificaciones', requiereSoporte, soporteController.listarNotificaciones);
router.patch('/notificaciones/:id/leido', requiereSoporte, soporteController.marcarNotificacionLeida);
router.post('/notificaciones', requiereSoporte, soporteController.crearNotificacion);

module.exports = router;
