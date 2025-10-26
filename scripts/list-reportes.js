require('dotenv').config();
const pool = require('../database');
const { listSupportReports } = require('../services/reportesService');

(async () => {
  try {
    const reports = await listSupportReports({});
    console.log(JSON.stringify(reports, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
})();
