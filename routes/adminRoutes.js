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

router.get('/usuarios/catalogos', verificarToken, verificarEstado, verificarRol(['admin']), obtenerCatalogosUsuarios);
router.get('/usuarios', verificarToken, verificarEstado, verificarRol(['admin']), listarUsuarios);
router.get('/usuarios/:id', verificarToken, verificarEstado, verificarRol(['admin']), obtenerUsuarioDetalle);
router.get('/usuarios/:id/presentaciones', verificarToken, verificarEstado, verificarRol(['admin']), listarPresentacionesDeUsuario);
router.patch('/usuarios/:id/rol', verificarToken, verificarEstado, verificarRol(['admin']), actualizarRolUsuario);
router.patch('/usuarios/:id/estado', verificarToken, verificarEstado, verificarRol(['admin', 'soporte']), actualizarEstadoUsuario);
router.delete('/usuarios/:id', verificarToken, verificarEstado, verificarRol(['admin']), eliminarUsuario);
router.get('/dashboard/resumen', verificarToken, verificarEstado, verificarRol(['admin']), obtenerDashboardResumen);

module.exports = router;
