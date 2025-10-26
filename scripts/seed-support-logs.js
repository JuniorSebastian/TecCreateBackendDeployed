#!/usr/bin/env node
/**
 * Crea entradas de prueba en logs_sistema y muestra las más recientes.
 * Ejecuta: node scripts/seed-support-logs.js
 */

const soporteService = require('../services/soporteService');
const pool = require('../database');

const soporteEmail = process.env.SOPORTE_LOG_EMAIL || 'rodrigo.diaz.i@tecsup.edu.pe';

async function crearLogDemo(index) {
  const timestamp = new Date().toISOString();
  const mensaje = `Log de prueba ${index} generado ${timestamp}`;
  return soporteService.createSupportLog({
    tipo: index % 2 === 0 ? 'info' : 'advertencia',
    origen: index % 3 === 0 ? 'backend' : 'panel_soporte',
    mensaje,
    usuarioEmail: soporteEmail,
  });
}

async function main() {
  console.log('> Generando logs de prueba...');
  console.log(`> Usando correo de soporte: ${soporteEmail || 'NULL'}`);
  const resultados = await Promise.all([
    crearLogDemo(1),
    crearLogDemo(2),
    crearLogDemo(3),
  ]);

  resultados.forEach((log) => {
    console.log(`OK  Log #${log.id} (${log.tipo}) creado desde ${log.origen}`);
  });

  console.log('\n> Últimos logs registrados:');
  const recientes = await soporteService.getSupportLogs({ limit: 10 });
  console.table(recientes.map((log) => ({
    id: log.id,
    tipo: log.tipo,
    origen: log.origen,
    mensaje: log.mensaje,
    usuario: log.usuario_email,
    fecha: log.fecha,
  })));
}

main()
  .catch((error) => {
  console.error('Error al generar logs de prueba:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end().catch(() => {});
  });
