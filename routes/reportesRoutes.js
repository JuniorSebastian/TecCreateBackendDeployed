const express = require('express');
const multer = require('multer');
const parseFormData = multer().none();
const {
  verificarToken,
  verificarEstado,
  verificarRol,
  intentarAdjuntarUsuario,
} = require('../middlewares/authMiddleware');
const {
  crearReporteSoporte,
  listarReportesSoporte,
  actualizarEstadoReporte,
  obtenerCategoriasReportes,
  obtenerEstadosReportes,
  eliminarReporteSoporte,
} = require('../controllers/reportesController');

const router = express.Router();

router.get('/categorias', obtenerCategoriasReportes);
router.get('/estados', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), obtenerEstadosReportes);
router.post('/', intentarAdjuntarUsuario, parseFormData, crearReporteSoporte);
router.get('/', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), listarReportesSoporte);
router.patch('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), actualizarEstadoReporte);
router.delete('/:id', verificarToken, verificarEstado, verificarRol(['admin']), eliminarReporteSoporte);

module.exports = router;
