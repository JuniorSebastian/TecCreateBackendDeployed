// backend/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const pool = require('../database');
const { getMaintenanceGateInfo } = require('../services/maintenanceService');
const router = express.Router();

// Inicio login con Google
// Construimos manualmente la URL de autorización de Google para asegurar
// que `redirect_uri` sea exactamente la variable de entorno esperada
// (sin parámetros extra ni modificaciones).
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Google OAuth no está configurado correctamente.' });
  }

  const encodedClientId = encodeURIComponent(clientId);
  const encodedRedirect = encodeURIComponent(redirectUri);
  // Solo los parámetros obligatorios solicitados por el usuario
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodedClientId}&redirect_uri=${encodedRedirect}&response_type=code&scope=openid%20email%20profile`;
  return res.redirect(authUrl);
});

// Callback de Google
router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
      // El usuario rechazó o Google devolvió error
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('missing_code')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Google OAuth env vars missing');
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('oauth_not_configured')}`);
    }

    // 1) Intercambiar code por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const text = await tokenResponse.text();
      console.error('Error exchanging code for tokens:', tokenResponse.status, text);
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('token_exchange_failed')}`);
    }

    const tokenJson = await tokenResponse.json();
    const idToken = tokenJson.id_token;
    const accessToken = tokenJson.access_token;

    if (!idToken) {
      console.error('No id_token returned from Google token exchange', tokenJson);
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('no_id_token')}`);
    }

    // 2) Verificar id_token usando tokeninfo endpoint
    const infoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!infoResponse.ok) {
      const text = await infoResponse.text();
      console.error('id_token validation failed:', infoResponse.status, text);
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('invalid_id_token')}`);
    }

    const profile = await infoResponse.json();

    // profile contains: email, email_verified, name, picture, aud, iss, exp, etc.
    const email = (profile.email || '').toLowerCase();
    const nombre = profile.name || profile.given_name || '';
    const foto = profile.picture || null;

    if (!email) {
      console.error('No email in id_token payload', profile);
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('no_email')}`);
    }

    // 3) Domain restriction
    if (!email.endsWith('@tecsup.edu.pe')) {
      console.warn('Rejected non-institutional email login attempt:', email);
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('email_not_allowed')}`);
    }

    // 4) Upsert user in DB and check suspension
    try {
      await pool.query(`
        INSERT INTO usuarios (nombre, email, foto)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, foto = EXCLUDED.foto
      `, [nombre, email, foto]);

      const userResult = await pool.query(
        `SELECT id, nombre, email, foto, rol, estado FROM usuarios WHERE email = $1`,
        [email]
      );

      if (!userResult.rows.length) {
        console.error('User inserted but cannot be retrieved:', email);
        return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('user_fetch_failed')}`);
      }

      const user = userResult.rows[0];

      if (user.estado === 'suspendido') {
        // Crear token limitado para apelaciones
        const tokenSuspendido = jwt.sign({ id: user.id, nombre: user.nombre, email: user.email, foto: user.foto, rol: user.rol, estado: user.estado }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${tokenSuspendido}&user=${encodeURIComponent(JSON.stringify({ id: user.id, nombre: user.nombre, email: user.email }))}&redirect=/cuenta-suspendida&suspendido=1`);
      }

      // 5) Maintenance gate (optional)
      try {
        const mantenimiento = await getMaintenanceGateInfo();
        if (mantenimiento.activo && (user.rol || 'usuario').toLowerCase() === 'usuario') {
          return res.redirect(`${process.env.CLIENT_URL}/mantenimiento?activo=1&mensaje=${encodeURIComponent(mantenimiento.mensaje || 'Mantenimiento activo')}`);
        }
      } catch (mErr) {
        console.error('Error checking maintenance gate:', mErr);
        // no bloquear login por fallo en la comprobación; continuar
      }

      // 6) Crear JWT y redirigir al frontend
      const token = jwt.sign({ id: user.id, nombre: user.nombre, email: user.email, foto: user.foto, rol: (user.rol || 'usuario').toLowerCase(), estado: user.estado || 'activo' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

      const roleRedirects = { admin: '/admin', soporte: '/soporte', usuario: '/perfil' };
      const redirectPath = roleRedirects[(user.rol || 'usuario').toLowerCase()] || roleRedirects.usuario;

      const redirectUrl = `${process.env.CLIENT_URL}/oauth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: user.id, nombre: user.nombre, email: user.email }))}&redirect=${encodeURIComponent(redirectPath)}`;
      return res.redirect(redirectUrl);
    } catch (dbErr) {
      console.error('Database error during OAuth callback processing:', dbErr);
      return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('db_error')}`);
    }
  } catch (ex) {
    console.error('Unexpected error in /auth/google/callback:', ex);
    return res.redirect(`${process.env.CLIENT_URL}/login-error?error=${encodeURIComponent('unexpected_error')}`);
  }
});

module.exports = router;
