BEGIN;

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    foto TEXT,
    rol VARCHAR(20) DEFAULT 'usuario',
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin','usuario','soporte'));

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_estado_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_estado_check CHECK (estado IN ('activo','inactivo','suspendido'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unique ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre ON usuarios(nombre);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_registro ON usuarios(fecha_registro DESC);

CREATE TABLE IF NOT EXISTS presentaciones (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT,
    email VARCHAR(255) NOT NULL REFERENCES usuarios(email) ON DELETE CASCADE,
    plantilla VARCHAR(100),
    fuente VARCHAR(255),
    idioma VARCHAR(10) DEFAULT 'es',
    numero_slides INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_presentaciones_email ON presentaciones(email);
CREATE INDEX IF NOT EXISTS idx_presentaciones_email_fecha ON presentaciones(email, fecha_creacion DESC);

CREATE TABLE IF NOT EXISTS imagenes_presentacion (
    id SERIAL PRIMARY KEY,
    presentacion_id INTEGER NOT NULL REFERENCES presentaciones(id) ON DELETE CASCADE,
    url_imagen TEXT NOT NULL,
    numero_slide INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_imagenes_presentacion_id ON imagenes_presentacion(presentacion_id);

CREATE TABLE IF NOT EXISTS reportes_soporte (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(255) REFERENCES usuarios(email) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    resumen VARCHAR(255),
    mensaje TEXT NOT NULL,
    estado VARCHAR(30) DEFAULT 'pendiente',
    atendido_por VARCHAR(255) REFERENCES usuarios(email) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reportes_categoria ON reportes_soporte(categoria);
CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_soporte(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_creado_en ON reportes_soporte(creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_reportes_atendido_por ON reportes_soporte(atendido_por);

CREATE OR REPLACE FUNCTION actualizar_fecha_reporte() RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_fecha_reporte ON reportes_soporte;
CREATE TRIGGER trg_actualizar_fecha_reporte
BEFORE UPDATE ON reportes_soporte
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_reporte();

ALTER TABLE reportes_soporte
  ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS eliminado_por VARCHAR(255) REFERENCES usuarios(email) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS resuelto_en TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_reportes_eliminado ON reportes_soporte(eliminado);
CREATE INDEX IF NOT EXISTS idx_reportes_resuelto_en ON reportes_soporte(resuelto_en);

CREATE TABLE IF NOT EXISTS comentarios_reporte (
    id SERIAL PRIMARY KEY,
    reporte_id INTEGER NOT NULL REFERENCES reportes_soporte(id) ON DELETE CASCADE,
    autor_email VARCHAR(255) REFERENCES usuarios(email) ON DELETE SET NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(20) DEFAULT 'interno',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comentarios_reporte_id ON comentarios_reporte(reporte_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_autor ON comentarios_reporte(autor_email);

CREATE TABLE IF NOT EXISTS modo_mantenimiento (
    id SERIAL PRIMARY KEY,
    activo BOOLEAN DEFAULT FALSE,
    mensaje TEXT DEFAULT 'La aplicación está en mantenimiento temporalmente.',
    activado_por VARCHAR(255) REFERENCES usuarios(email) ON DELETE SET NULL,
    fecha_activacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mantenimiento_fecha ON modo_mantenimiento(fecha_activacion DESC);

CREATE TABLE IF NOT EXISTS logs_sistema (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    origen VARCHAR(100),
    mensaje TEXT NOT NULL,
    usuario_email VARCHAR(255) REFERENCES usuarios(email) ON DELETE SET NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_tipo_fecha ON logs_sistema(tipo, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_logs_origen ON logs_sistema(origen);

CREATE TABLE IF NOT EXISTS historial_acciones_soporte (
    id SERIAL PRIMARY KEY,
    soporte_email VARCHAR(255) REFERENCES usuarios(email) ON DELETE SET NULL,
    accion VARCHAR(255) NOT NULL,
    detalle TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_soporte_fecha ON historial_acciones_soporte(soporte_email, fecha DESC);

CREATE TABLE IF NOT EXISTS notificaciones_soporte (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones_soporte(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido ON notificaciones_soporte(leido);

COMMIT;
