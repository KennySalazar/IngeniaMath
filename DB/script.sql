DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'adminMath'
    ) THEN
        CREATE ROLE "adminMath" LOGIN PASSWORD 'admin123';
    END IF;
END
$$;

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'ingeniaMathDB'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS "ingeniaMathDB";

CREATE DATABASE "ingeniaMathDB"
    WITH
    OWNER = "adminMath"
    TEMPLATE = template1
    ENCODING = 'UTF8';

\connect "ingeniaMathDB"

CREATE EXTENSION IF NOT EXISTS citext;

DROP SCHEMA IF EXISTS math CASCADE;
CREATE SCHEMA math AUTHORIZATION "adminMath";

SET search_path TO math, public;
CREATE TABLE   roles (
    id              BIGINT PRIMARY KEY,
    codigo          VARCHAR(30) NOT NULL UNIQUE,
    nombre          VARCHAR(80) NOT NULL UNIQUE,
    descripcion     TEXT
);

CREATE TABLE   usuarios (
    id                  BIGINT PRIMARY KEY,
    rol_id              BIGINT NOT NULL REFERENCES roles(id),
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    correo              CITEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    foto_perfil_url     TEXT,
    telefono            VARCHAR(30),
    biografia           TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_login_at     TIMESTAMPTZ,
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   perfiles_estudiante (
    usuario_id                  BIGINT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    horas_disponibles_semana    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (horas_disponibles_semana >= 0),
    racha_actual_dias           INTEGER NOT NULL DEFAULT 0 CHECK (racha_actual_dias >= 0),
    fecha_objetivo_examen       DATE,
    fecha_creacion              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   tutor_estudiante (
    id                  BIGSERIAL PRIMARY KEY,
    tutor_id            BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estudiante_id       BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_asignacion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tutor_estudiante UNIQUE (tutor_id, estudiante_id)
);

CREATE TABLE   modulos_tematicos (
    id              BIGINT PRIMARY KEY,
    nombre          VARCHAR(120) NOT NULL UNIQUE,
    descripcion     TEXT,
    orden           INTEGER NOT NULL UNIQUE
);

CREATE TABLE   subtemas (
    id                      BIGINT PRIMARY KEY,
    modulo_id               BIGINT NOT NULL REFERENCES modulos_tematicos(id) ON DELETE CASCADE,
    nombre                  VARCHAR(150) NOT NULL,
    descripcion             TEXT,
    orden_complejidad       INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT uq_subtema_modulo UNIQUE (modulo_id, nombre)
);

CREATE TABLE   prerrequisitos_subtema (
    subtema_id                   BIGINT NOT NULL REFERENCES subtemas(id) ON DELETE CASCADE,
    subtema_prerrequisito_id     BIGINT NOT NULL REFERENCES subtemas(id) ON DELETE CASCADE,
    PRIMARY KEY (subtema_id, subtema_prerrequisito_id),
    CONSTRAINT chk_prerrequisito_distinto CHECK (subtema_id <> subtema_prerrequisito_id)
);

CREATE TABLE   ejercicios (
    id                          BIGINT PRIMARY KEY,
    modulo_id                   BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    subtema_id                  BIGINT NOT NULL REFERENCES subtemas(id),
    tutor_id                    BIGINT NOT NULL REFERENCES usuarios(id),
    revisor_id                  BIGINT REFERENCES usuarios(id),
    nivel_dificultad            VARCHAR(20) NOT NULL CHECK (nivel_dificultad IN ('BASICO','INTERMEDIO','AVANZADO','EXAMEN_REAL')),
    tipo_ejercicio              VARCHAR(30) NOT NULL CHECK (tipo_ejercicio IN ('OPCION_MULTIPLE','VERDADERO_FALSO','RESPUESTA_NUMERICA','COMPLETAR_ESPACIOS')),
    enunciado                   TEXT NOT NULL,
    imagen_apoyo_url            TEXT,
    respuesta_correcta_texto    TEXT,
    solucion_paso_a_paso        TEXT NOT NULL,
    explicacion_conceptual      TEXT,
    tiempo_estimado_minutos     INTEGER NOT NULL CHECK (tiempo_estimado_minutos > 0),
    estado                      VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR','EN_REVISION','APROBADO','PUBLICADO','DESHABILITADO')),
    advertencia_duplicado       BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_revision              TIMESTAMPTZ,
    fecha_publicacion           TIMESTAMPTZ
);

CREATE TABLE   opciones_ejercicio (
    id                  BIGINT PRIMARY KEY,
    ejercicio_id        BIGINT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    orden_opcion        INTEGER NOT NULL,
    texto_opcion        TEXT NOT NULL,
    es_correcta         BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_opcion_orden UNIQUE (ejercicio_id, orden_opcion)
);

CREATE TABLE   ejercicios_relacionados (
    ejercicio_id                BIGINT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    ejercicio_relacionado_id    BIGINT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    PRIMARY KEY (ejercicio_id, ejercicio_relacionado_id),
    CONSTRAINT chk_ej_rel_distintos CHECK (ejercicio_id <> ejercicio_relacionado_id)
);

CREATE TABLE   revisiones_ejercicio (
    id                  BIGSERIAL PRIMARY KEY,
    ejercicio_id        BIGINT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    revisor_id          BIGINT NOT NULL REFERENCES usuarios(id),
    accion              VARCHAR(20) NOT NULL CHECK (accion IN ('ENVIADO_REVISION','APROBADO','RECHAZADO','OBSERVADO','PUBLICADO','DESHABILITADO')),
    notas               TEXT,
    fecha_evento        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   tests_diagnostico (
    id                  BIGINT PRIMARY KEY,
    nombre              VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por          BIGINT REFERENCES usuarios(id),
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   test_diagnostico_preguntas (
    id                  BIGSERIAL PRIMARY KEY,
    test_diagnostico_id BIGINT NOT NULL REFERENCES tests_diagnostico(id) ON DELETE CASCADE,
    ejercicio_id        BIGINT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    orden_pregunta      INTEGER NOT NULL,
    CONSTRAINT uq_test_pregunta_orden UNIQUE (test_diagnostico_id, orden_pregunta),
    CONSTRAINT uq_test_pregunta_ej UNIQUE (test_diagnostico_id, ejercicio_id)
);

CREATE TABLE   intentos_diagnostico (
    id                  BIGINT PRIMARY KEY,
    test_diagnostico_id BIGINT NOT NULL REFERENCES tests_diagnostico(id),
    estudiante_id       BIGINT NOT NULL REFERENCES usuarios(id),
    estado              VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO' CHECK (estado IN ('EN_PROCESO','FINALIZADO','CANCELADO')),
    puntaje_total       NUMERIC(5,2) CHECK (puntaje_total BETWEEN 0 AND 100),
    fecha_inicio        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin           TIMESTAMPTZ
);

CREATE TABLE   respuestas_diagnostico (
    id                      BIGSERIAL PRIMARY KEY,
    intento_diagnostico_id  BIGINT NOT NULL REFERENCES intentos_diagnostico(id) ON DELETE CASCADE,
    ejercicio_id            BIGINT NOT NULL REFERENCES ejercicios(id),
    opcion_id               BIGINT REFERENCES opciones_ejercicio(id),
    es_correcta             BOOLEAN NOT NULL,
    fecha_respuesta         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resp_diag UNIQUE (intento_diagnostico_id, ejercicio_id)
);

CREATE TABLE   resultados_diagnostico_modulo (
    id                      BIGSERIAL PRIMARY KEY,
    intento_diagnostico_id  BIGINT NOT NULL REFERENCES intentos_diagnostico(id) ON DELETE CASCADE,
    modulo_id               BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    puntaje_porcentaje      NUMERIC(5,2) NOT NULL CHECK (puntaje_porcentaje BETWEEN 0 AND 100),
    clasificacion           VARCHAR(20) NOT NULL CHECK (clasificacion IN ('DOMINADO','EN_DESARROLLO','DEFICIENTE')),
    CONSTRAINT uq_diag_modulo UNIQUE (intento_diagnostico_id, modulo_id)
);

CREATE TABLE   rutas_aprendizaje (
    id                      BIGINT PRIMARY KEY,
    estudiante_id           BIGINT NOT NULL REFERENCES usuarios(id),
    intento_diagnostico_id  BIGINT REFERENCES intentos_diagnostico(id),
    activa                  BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_generacion        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   ruta_aprendizaje_detalle (
    id                  BIGSERIAL PRIMARY KEY,
    ruta_id             BIGINT NOT NULL REFERENCES rutas_aprendizaje(id) ON DELETE CASCADE,
    modulo_id           BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    subtema_id          BIGINT NOT NULL REFERENCES subtemas(id),
    prioridad_modulo    INTEGER NOT NULL,
    prioridad_subtema   INTEGER NOT NULL,
    origen              VARCHAR(20) NOT NULL DEFAULT 'DIRECTO' CHECK (origen IN ('DIRECTO','PRERREQUISITO','REFUERZO')),
    estado              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','EN_PROCESO','COMPLETADO')),
    fecha_completado    TIMESTAMPTZ
);

CREATE TABLE   sesiones_practica (
    id                          BIGINT PRIMARY KEY,
    estudiante_id               BIGINT NOT NULL REFERENCES usuarios(id),
    modo                        VARCHAR(10) NOT NULL CHECK (modo IN ('LIBRE','GUIADA')),
    modulo_id                   BIGINT REFERENCES modulos_tematicos(id),
    subtema_id                  BIGINT REFERENCES subtemas(id),
    nivel_dificultad            VARCHAR(20) CHECK (nivel_dificultad IN ('BASICO','INTERMEDIO','AVANZADO','EXAMEN_REAL')),
    ruta_id                     BIGINT REFERENCES rutas_aprendizaje(id),
    total_ejercicios            INTEGER NOT NULL DEFAULT 0 CHECK (total_ejercicios >= 0),
    total_correctos             INTEGER NOT NULL DEFAULT 0 CHECK (total_correctos >= 0),
    porcentaje_aciertos         NUMERIC(5,2) CHECK (porcentaje_aciertos BETWEEN 0 AND 100),
    tiempo_total_minutos        INTEGER CHECK (tiempo_total_minutos >= 0),
    fecha_inicio                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin                   TIMESTAMPTZ
);

CREATE TABLE   respuestas_practica (
    id                      BIGSERIAL PRIMARY KEY,
    sesion_practica_id      BIGINT NOT NULL REFERENCES sesiones_practica(id) ON DELETE CASCADE,
    ejercicio_id            BIGINT NOT NULL REFERENCES ejercicios(id),
    opcion_id               BIGINT REFERENCES opciones_ejercicio(id),
    es_correcta             BOOLEAN NOT NULL,
    marcado_guardado        BOOLEAN NOT NULL DEFAULT FALSE,
    tiempo_segundos         INTEGER CHECK (tiempo_segundos >= 0),
    fecha_respuesta         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_resp_practica UNIQUE (sesion_practica_id, ejercicio_id)
);

CREATE TABLE   ejercicios_guardados (
    estudiante_id           BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ejercicio_id            BIGINT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    fecha_guardado          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (estudiante_id, ejercicio_id)
);

CREATE TABLE   configuraciones_simulacro (
    id                          BIGINT PRIMARY KEY,
    nombre                      VARCHAR(100) NOT NULL,
    duracion_minutos            INTEGER NOT NULL DEFAULT 90 CHECK (duracion_minutos > 0),
    cantidad_preguntas          INTEGER NOT NULL CHECK (cantidad_preguntas > 0),
    puntaje_minimo_aprobacion   NUMERIC(5,2) NOT NULL DEFAULT 61.00 CHECK (puntaje_minimo_aprobacion BETWEEN 0 AND 100),
    activa                      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por                  BIGINT REFERENCES usuarios(id),
    fecha_creacion              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   configuracion_simulacro_modulo (
    id                          BIGSERIAL PRIMARY KEY,
    configuracion_simulacro_id  BIGINT NOT NULL REFERENCES configuraciones_simulacro(id) ON DELETE CASCADE,
    modulo_id                   BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    cantidad_preguntas          INTEGER NOT NULL CHECK (cantidad_preguntas >= 0),
    CONSTRAINT uq_config_modulo UNIQUE (configuracion_simulacro_id, modulo_id)
);

CREATE TABLE   simulacros (
    id                          BIGINT PRIMARY KEY,
    configuracion_simulacro_id  BIGINT NOT NULL REFERENCES configuraciones_simulacro(id),
    estudiante_id               BIGINT NOT NULL REFERENCES usuarios(id),
    estado                      VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO' CHECK (estado IN ('EN_PROCESO','FINALIZADO','EXPIRADO','CANCELADO')),
    puntaje_total               NUMERIC(5,2) CHECK (puntaje_total BETWEEN 0 AND 100),
    puntaje_minimo_referencia   NUMERIC(5,2) NOT NULL DEFAULT 61.00 CHECK (puntaje_minimo_referencia BETWEEN 0 AND 100),
    aprueba_referencia          BOOLEAN,
    duracion_minutos_real       INTEGER CHECK (duracion_minutos_real >= 0),
    fecha_inicio                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_fin                   TIMESTAMPTZ
);

CREATE TABLE   simulacro_preguntas (
    id                  BIGSERIAL PRIMARY KEY,
    simulacro_id        BIGINT NOT NULL REFERENCES simulacros(id) ON DELETE CASCADE,
    ejercicio_id        BIGINT NOT NULL REFERENCES ejercicios(id),
    orden_pregunta      INTEGER NOT NULL,
    es_correcta         BOOLEAN,
    CONSTRAINT uq_simulacro_orden UNIQUE (simulacro_id, orden_pregunta)
);

CREATE TABLE   simulacro_resultados_modulo (
    id                      BIGSERIAL PRIMARY KEY,
    simulacro_id            BIGINT NOT NULL REFERENCES simulacros(id) ON DELETE CASCADE,
    modulo_id               BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    total_preguntas         INTEGER NOT NULL DEFAULT 0 CHECK (total_preguntas >= 0),
    total_correctas         INTEGER NOT NULL DEFAULT 0 CHECK (total_correctas >= 0),
    puntaje_porcentaje      NUMERIC(5,2) NOT NULL CHECK (puntaje_porcentaje BETWEEN 0 AND 100),
    CONSTRAINT uq_sim_result_mod UNIQUE (simulacro_id, modulo_id)
);

CREATE TABLE   recursos_educativos (
    id                      BIGINT PRIMARY KEY,
    modulo_id               BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    subtema_id              BIGINT REFERENCES subtemas(id),
    tutor_id                BIGINT NOT NULL REFERENCES usuarios(id),
    revisor_id              BIGINT REFERENCES usuarios(id),
    tipo_recurso            VARCHAR(20) NOT NULL CHECK (tipo_recurso IN ('VIDEO','PDF','FLASHCARD','SIMULADOR','ENLACE')),
    titulo                  VARCHAR(200) NOT NULL,
    descripcion             TEXT,
    url_recurso             TEXT,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR','EN_REVISION','APROBADO','PUBLICADO','DESHABILITADO')),
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_publicacion       TIMESTAMPTZ
);

CREATE TABLE   flashcards (
    id                      BIGINT PRIMARY KEY,
    modulo_id               BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    subtema_id              BIGINT REFERENCES subtemas(id),
    titulo                  VARCHAR(150) NOT NULL,
    frente                  TEXT NOT NULL,
    reverso                 TEXT NOT NULL,
    creado_por              BIGINT NOT NULL REFERENCES usuarios(id),
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   recurso_por_ejercicio (
    ejercicio_id            BIGINT NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    recurso_id              BIGINT NOT NULL REFERENCES recursos_educativos(id) ON DELETE CASCADE,
    PRIMARY KEY (ejercicio_id, recurso_id)
);

CREATE TABLE   hilos_foro (
    id                      BIGINT PRIMARY KEY,
    estudiante_id           BIGINT NOT NULL REFERENCES usuarios(id),
    modulo_id               BIGINT NOT NULL REFERENCES modulos_tematicos(id),
    subtema_id              BIGINT REFERENCES subtemas(id),
    titulo                  VARCHAR(200) NOT NULL,
    contenido               TEXT NOT NULL,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO','RESUELTO','CERRADO','ELIMINADO')),
    respuesta_aceptada_id   BIGINT,
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   respuestas_foro (
    id                      BIGINT PRIMARY KEY,
    hilo_id                 BIGINT NOT NULL REFERENCES hilos_foro(id) ON DELETE CASCADE,
    usuario_id              BIGINT NOT NULL REFERENCES usuarios(id),
    contenido               TEXT NOT NULL,
    es_solucion_aceptada    BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hilos_foro
    ADD CONSTRAINT fk_hilo_respuesta_aceptada
    FOREIGN KEY (respuesta_aceptada_id) REFERENCES respuestas_foro(id);

CREATE TABLE   auditoria_actividad (
    id                      BIGSERIAL PRIMARY KEY,
    usuario_id              BIGINT REFERENCES usuarios(id),
    entidad                 VARCHAR(50) NOT NULL,
    entidad_id              BIGINT,
    accion                  VARCHAR(50) NOT NULL,
    detalle                 JSONB,
    fecha_evento            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE   tokens_recuperacion_password (
    id                      BIGSERIAL PRIMARY KEY,
    usuario_id              BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token                   VARCHAR(255) NOT NULL UNIQUE,
    usado                   BOOLEAN NOT NULL DEFAULT FALSE,
    expira_at               TIMESTAMPTZ NOT NULL,
    fecha_creacion          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE planes_estudio_semanal (
    id                  BIGSERIAL PRIMARY KEY,
    estudiante_id       BIGINT NOT NULL REFERENCES math.usuarios(id) ON DELETE CASCADE,
    ruta_id             BIGINT NOT NULL REFERENCES math.rutas_aprendizaje(id) ON DELETE CASCADE,
    semana_inicio       DATE NOT NULL,
    fecha_generacion    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plan_semana UNIQUE (estudiante_id, semana_inicio)
);

CREATE TABLE plan_estudio_dia (
    id                  BIGSERIAL PRIMARY KEY,
    plan_id             BIGINT NOT NULL REFERENCES math.planes_estudio_semanal(id) ON DELETE CASCADE,
    dia_semana          INTEGER NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Lunes
    subtema_id          BIGINT NOT NULL REFERENCES math.subtemas(id),
    ejercicios_recomendados INTEGER NOT NULL DEFAULT 5,
    tiempo_estimado_minutos INTEGER NOT NULL DEFAULT 30
);

CREATE INDEX   idx_usuarios_rol              ON usuarios(rol_id);
CREATE INDEX   idx_subtema_modulo            ON subtemas(modulo_id);
CREATE INDEX   idx_ejercicio_mod_sub         ON ejercicios(modulo_id, subtema_id);
CREATE INDEX   idx_ejercicio_estado          ON ejercicios(estado);
CREATE INDEX   idx_recurso_mod_sub           ON recursos_educativos(modulo_id, subtema_id);
CREATE INDEX   idx_ruta_estudiante           ON rutas_aprendizaje(estudiante_id);
CREATE INDEX   idx_simulacro_estudiante      ON simulacros(estudiante_id);
CREATE INDEX   idx_hilo_modulo               ON hilos_foro(modulo_id, subtema_id);
CREATE INDEX   idx_resp_practica_est_fecha   ON respuestas_practica(sesion_practica_id, es_correcta, fecha_respuesta);


-- PRIVILEGIOS

-- Acceso a la base de datos
GRANT CONNECT ON DATABASE "ingeniaMathDB" TO "adminMath";

-- Acceso al esquema
GRANT USAGE, CREATE ON SCHEMA math TO "adminMath";

-- Acceso a objetos existentes
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA math TO "adminMath";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA math TO "adminMath";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA math TO "adminMath";

-- Privilegios 
ALTER DEFAULT PRIVILEGES IN SCHEMA math
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "adminMath";

ALTER DEFAULT PRIVILEGES IN SCHEMA math
  GRANT ALL ON SEQUENCES TO "adminMath";

ALTER DEFAULT PRIVILEGES IN SCHEMA math
  GRANT EXECUTE ON FUNCTIONS TO "adminMath";

ALTER ROLE "adminMath" IN DATABASE "ingeniaMathDB" SET search_path = math, public;


