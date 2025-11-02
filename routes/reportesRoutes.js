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

const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/categorias', asyncHandler(obtenerCategoriasReportes));
router.get('/estados', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), asyncHandler(obtenerEstadosReportes));
router.post('/', intentarAdjuntarUsuario, parseFormData, asyncHandler(crearReporteSoporte));
router.get('/', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), asyncHandler(listarReportesSoporte));
router.patch('/:id', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), asyncHandler(actualizarEstadoReporte));
router.delete('/:id', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(eliminarReporteSoporte));

module.exports = router;
