function soloAdmin(req, res, next) {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: Solo admins' });
  }
  next();
}

module.exports = soloAdmin;
