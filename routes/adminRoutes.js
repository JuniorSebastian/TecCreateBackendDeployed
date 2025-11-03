// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken, verificarEstado, verificarRol } = require('../middlewares/authMiddleware');
const { obtenerDashboardResumen } = require('../controllers/adminController');
const {
	listarUsuarios,
	obtenerUsuarioDetalle,
	listarPresentacionesDeUsuario,
	actualizarRolUsuario,
	actualizarEstadoUsuario,
	eliminarUsuario,
	obtenerCatalogosUsuarios,
} = require('../controllers/usuariosAdminController');

const asyncHandler = require('../lib/asyncHandler');

router.get('/usuarios/catalogos', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(obtenerCatalogosUsuarios));
router.get('/usuarios', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(listarUsuarios));
router.get('/usuarios/:id', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(obtenerUsuarioDetalle));
router.get('/usuarios/:id/presentaciones', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(listarPresentacionesDeUsuario));
router.patch('/usuarios/:id/rol', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(actualizarRolUsuario));
router.patch('/usuarios/:id/estado', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), asyncHandler(actualizarEstadoUsuario));
router.delete('/usuarios/:id', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(eliminarUsuario));
router.get('/dashboard/resumen', verificarToken, verificarEstado, verificarRol(['admin']), asyncHandler(obtenerDashboardResumen));

module.exports = router;
