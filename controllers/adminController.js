// controllers/adminController.js
const { getDashboardSummary } = require('../services/dashboardService');

exports.obtenerDashboardResumen = async (req, res) => {
  try {
    const resumen = await getDashboardSummary();
    res.json(resumen);
  } catch (error) {
    console.error('❌ Error al obtener el resumen del dashboard:', error);
    res.status(500).json({ error: 'Error al obtener el dashboard' });
  }
};
