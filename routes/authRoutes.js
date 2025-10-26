// backend/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Inicio login con Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

// Callback de Google
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { failureMessage: true }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      if (info?.code === 'MAINTENANCE_ACTIVE') {
        const mensaje = info?.maintenance?.mensaje || 'La aplicación está en mantenimiento temporalmente.';
        return res.redirect(`${process.env.CLIENT_URL}/mantenimiento?activo=1&mensaje=${encodeURIComponent(mensaje)}`);
      }

      const reason = (info?.message || 'unauthorized').toLowerCase();
      if (reason.includes('suspendido')) {
        // Usuario suspendido: crear token limitado para que pueda enviar reportes
        const suspendidoUser = info.user; // passport.js devuelve el usuario en info
        const tokenSuspendido = jwt.sign(suspendidoUser, process.env.JWT_SECRET, {
          expiresIn: '7d', // Token más largo para que pueda apelar
        });
        return res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${tokenSuspendido}&user=${encodeURIComponent(JSON.stringify(suspendidoUser))}&redirect=/cuenta-suspendida&suspendido=1`);
      }
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent(reason)}`);
    }

    req.user = user;

    // Crear token JWT
    const token = jwt.sign(req.user, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const roleRedirects = {
      admin: '/admin',
      soporte: '/soporte',
      usuario: '/perfil',
    };

    const redirectPath = roleRedirects[req.user.rol] || roleRedirects.usuario;

    // Redirigir al frontend con token y datos de usuario
    const redirectUrl = `${process.env.CLIENT_URL}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}&redirect=${encodeURIComponent(redirectPath)}`;
    return res.redirect(redirectUrl);
  })(req, res, next);
});

module.exports = router;
