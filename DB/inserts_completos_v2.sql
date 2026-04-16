-- Contraseña todos: admin123

SET search_path TO math, public;
BEGIN;

-- ROLES
INSERT INTO roles (codigo,nombre,descripcion) VALUES
('ADMIN','Administrador','Acceso total al sistema'),
('ESTUDIANTE','Estudiante','Aspirante que usa la plataforma'),
('TUTOR','Tutor/Instructor','Creador y gestor de contenido académico'),
('REVISOR','Revisor/Moderador','Valida contenido y modera el foro');

-- USUARIOS (contraseña: admin123)
INSERT INTO usuarios (rol_id,nombres,apellidos,correo,password_hash,activo) VALUES
(1,'Kenny','Salazar','kenny.salazar@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(1,'Marco','Lopez','marco.lopez@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(1,'Ivan','Palacios','ivan.palacios@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(2,'Ana','Morales','ana.morales@correo.com','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(2,'Luis','Perez','luis.perez@correo.com','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(2,'Andrea','Castillo','andrea.castillo@correo.com','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(2,'Carlos','Hernandez','carlos.hernandez@correo.com','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(2,'Sofia','Ramirez','sofia.ramirez@correo.com','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(3,'Escarlett','Castillo','escarlett.castillo@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(3,'Brandon','Hernandez','brandon.hernandez@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(3,'Mario','Gomez','mario.gomez@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(3,'Paola','Diaz','paola.diaz@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(4,'Walter','Reyes','walter.reyes@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(4,'Lucia','Mendez','lucia.mendez@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE),
(4,'David','Ortega','david.ortega@ingeniamath.gt','$2y$12$tM./sUe1VKcdt4gAUr12cu8U4gfbRiPPRtLoYj6f3n9UlxrUTse6u',TRUE);

INSERT INTO perfiles_estudiante (usuario_id,horas_disponibles_semana,racha_actual_dias,fecha_objetivo_examen)
SELECT id,CASE WHEN id=4 THEN 12 WHEN id=5 THEN 10 WHEN id=6 THEN 8 WHEN id=7 THEN 6 ELSE 14 END,
       CASE WHEN id=4 THEN 4 WHEN id=5 THEN 6 WHEN id=6 THEN 1 WHEN id=7 THEN 0 ELSE 3 END,
       '2026-10-15' FROM usuarios WHERE rol_id=(SELECT id FROM roles WHERE codigo='ESTUDIANTE');

INSERT INTO tutor_estudiante (tutor_id,estudiante_id,activo)
VALUES
((SELECT id FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt'),
 (SELECT id FROM usuarios WHERE correo='ana.morales@correo.com'),TRUE),
((SELECT id FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt'),
 (SELECT id FROM usuarios WHERE correo='luis.perez@correo.com'),TRUE),
((SELECT id FROM usuarios WHERE correo='brandon.hernandez@ingeniamath.gt'),
 (SELECT id FROM usuarios WHERE correo='andrea.castillo@correo.com'),TRUE),
((SELECT id FROM usuarios WHERE correo='brandon.hernandez@ingeniamath.gt'),
 (SELECT id FROM usuarios WHERE correo='carlos.hernandez@correo.com'),TRUE),
((SELECT id FROM usuarios WHERE correo='mario.gomez@ingeniamath.gt'),
 (SELECT id FROM usuarios WHERE correo='sofia.ramirez@correo.com'),TRUE);

-- MÓDULOS
INSERT INTO modulos_tematicos (nombre,descripcion,orden) VALUES
('Números Reales','Contenido de números reales y operaciones relacionadas',1),
('Fundamentos de Álgebra','Bases algebraicas para el examen de admisión',2),
('Ecuaciones e Inecuaciones','Resolución de ecuaciones e inecuaciones',3),
('Funciones y Gráficas','Funciones, dominio, rango y representación gráfica',4),
('Geometría Analítica','Recta, circunferencia, parábola y elementos analíticos',5),
('Geometría','Teoremas, áreas, perímetros y volúmenes',6),
('Trigonometría','Funciones trigonométricas y resolución de triángulos',7);

-- SUBTEMAS
INSERT INTO subtemas (modulo_id,nombre,descripcion,orden_complejidad) VALUES
((SELECT id FROM modulos_tematicos WHERE orden=1),'Valor absoluto','Subtema Valor absoluto del módulo 1',1),
((SELECT id FROM modulos_tematicos WHERE orden=1),'Racionalización','Subtema Racionalización del módulo 1',2),
((SELECT id FROM modulos_tematicos WHERE orden=1),'Proporcionalidad','Subtema Proporcionalidad del módulo 1',3),
((SELECT id FROM modulos_tematicos WHERE orden=1),'Porcentajes','Subtema Porcentajes del módulo 1',4),
((SELECT id FROM modulos_tematicos WHERE orden=1),'MCD y MCM','Subtema MCD y MCM del módulo 1',5),
((SELECT id FROM modulos_tematicos WHERE orden=2),'Productos notables','Subtema Productos notables del módulo 2',1),
((SELECT id FROM modulos_tematicos WHERE orden=2),'Factorización','Subtema Factorización del módulo 2',2),
((SELECT id FROM modulos_tematicos WHERE orden=2),'Fracciones algebraicas','Subtema Fracciones algebraicas del módulo 2',3),
((SELECT id FROM modulos_tematicos WHERE orden=2),'Teorema del residuo','Subtema Teorema del residuo del módulo 2',4),
((SELECT id FROM modulos_tematicos WHERE orden=3),'Ecuaciones de primer grado','Subtema Ecuaciones de primer grado del módulo 3',1),
((SELECT id FROM modulos_tematicos WHERE orden=3),'Ecuaciones cuadráticas','Subtema Ecuaciones cuadráticas del módulo 3',2),
((SELECT id FROM modulos_tematicos WHERE orden=3),'Reducibles a cuadráticas','Subtema Reducibles a cuadráticas del módulo 3',3),
((SELECT id FROM modulos_tematicos WHERE orden=3),'Inecuaciones','Subtema Inecuaciones del módulo 3',4),
((SELECT id FROM modulos_tematicos WHERE orden=4),'Dominio y rango','Subtema Dominio y rango del módulo 4',1),
((SELECT id FROM modulos_tematicos WHERE orden=4),'Función lineal','Subtema Función lineal del módulo 4',2),
((SELECT id FROM modulos_tematicos WHERE orden=4),'Función cuadrática','Subtema Función cuadrática del módulo 4',3),
((SELECT id FROM modulos_tematicos WHERE orden=4),'Composición de funciones','Subtema Composición de funciones del módulo 4',4),
((SELECT id FROM modulos_tematicos WHERE orden=5),'Ecuación de la recta','Subtema Ecuación de la recta del módulo 5',1),
((SELECT id FROM modulos_tematicos WHERE orden=5),'Distancia y punto medio','Subtema Distancia y punto medio del módulo 5',2),
((SELECT id FROM modulos_tematicos WHERE orden=5),'Circunferencia','Subtema Circunferencia del módulo 5',3),
((SELECT id FROM modulos_tematicos WHERE orden=5),'Parábola','Subtema Parábola del módulo 5',4),
((SELECT id FROM modulos_tematicos WHERE orden=6),'Teorema de Pitágoras','Subtema Teorema de Pitágoras del módulo 6',1),
((SELECT id FROM modulos_tematicos WHERE orden=6),'Semejanza de triángulos','Subtema Semejanza de triángulos del módulo 6',2),
((SELECT id FROM modulos_tematicos WHERE orden=6),'Áreas y perímetros','Subtema Áreas y perímetros del módulo 6',3),
((SELECT id FROM modulos_tematicos WHERE orden=6),'Volúmenes','Subtema Volúmenes del módulo 6',4),
((SELECT id FROM modulos_tematicos WHERE orden=7),'Conversión grados-radianes','Subtema Conversión grados-radianes del módulo 7',1),
((SELECT id FROM modulos_tematicos WHERE orden=7),'Funciones trigonométricas','Subtema Funciones trigonométricas del módulo 7',2),
((SELECT id FROM modulos_tematicos WHERE orden=7),'Resolución de triángulos','Subtema Resolución de triángulos del módulo 7',3);

INSERT INTO prerrequisitos_subtema (subtema_id,subtema_prerrequisito_id) VALUES
((SELECT id FROM subtemas WHERE nombre='Ecuación de la recta'),   (SELECT id FROM subtemas WHERE nombre='Productos notables')),
((SELECT id FROM subtemas WHERE nombre='Distancia y punto medio'),(SELECT id FROM subtemas WHERE nombre='Factorización')),
((SELECT id FROM subtemas WHERE nombre='Circunferencia'),         (SELECT id FROM subtemas WHERE nombre='Ecuaciones de primer grado')),
((SELECT id FROM subtemas WHERE nombre='Parábola'),               (SELECT id FROM subtemas WHERE nombre='Ecuaciones cuadráticas')),
((SELECT id FROM subtemas WHERE nombre='Volúmenes'),              (SELECT id FROM subtemas WHERE nombre='Teorema de Pitágoras')),
((SELECT id FROM subtemas WHERE nombre='Conversión grados-radianes'),(SELECT id FROM subtemas WHERE nombre='Teorema de Pitágoras')),
((SELECT id FROM subtemas WHERE nombre='Funciones trigonométricas'),(SELECT id FROM subtemas WHERE nombre='Semejanza de triángulos'));


-- 70 EJERCICIOS CON LaTeX

DO $$
DECLARE
  t1 BIGINT; t2 BIGINT; t3 BIGINT; t4 BIGINT;
  r1 BIGINT; r2 BIGINT; r3 BIGINT;
  m1 BIGINT; m2 BIGINT; m3 BIGINT; m4 BIGINT; m5 BIGINT; m6 BIGINT; m7 BIGINT;
  s1 BIGINT; s2 BIGINT; s3 BIGINT; s4 BIGINT; s5 BIGINT;
  s6 BIGINT; s7 BIGINT; s8 BIGINT; s9 BIGINT;
  s10 BIGINT; s11 BIGINT; s12 BIGINT; s13 BIGINT;
  s14 BIGINT; s15 BIGINT; s16 BIGINT; s17 BIGINT;
  s18 BIGINT; s19 BIGINT; s20 BIGINT; s21 BIGINT;
  s22 BIGINT; s23 BIGINT; s24 BIGINT; s25 BIGINT;
  s26 BIGINT; s27 BIGINT; s28 BIGINT;
  ej BIGINT;
BEGIN
  SELECT id INTO t1 FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt';
  SELECT id INTO t2 FROM usuarios WHERE correo='brandon.hernandez@ingeniamath.gt';
  SELECT id INTO t3 FROM usuarios WHERE correo='mario.gomez@ingeniamath.gt';
  SELECT id INTO t4 FROM usuarios WHERE correo='paola.diaz@ingeniamath.gt';
  SELECT id INTO r1 FROM usuarios WHERE correo='walter.reyes@ingeniamath.gt';
  SELECT id INTO r2 FROM usuarios WHERE correo='lucia.mendez@ingeniamath.gt';
  SELECT id INTO r3 FROM usuarios WHERE correo='david.ortega@ingeniamath.gt';
  SELECT id INTO m1 FROM modulos_tematicos WHERE orden=1;
  SELECT id INTO m2 FROM modulos_tematicos WHERE orden=2;
  SELECT id INTO m3 FROM modulos_tematicos WHERE orden=3;
  SELECT id INTO m4 FROM modulos_tematicos WHERE orden=4;
  SELECT id INTO m5 FROM modulos_tematicos WHERE orden=5;
  SELECT id INTO m6 FROM modulos_tematicos WHERE orden=6;
  SELECT id INTO m7 FROM modulos_tematicos WHERE orden=7;
  SELECT id INTO s1  FROM subtemas WHERE nombre='Valor absoluto';
  SELECT id INTO s2  FROM subtemas WHERE nombre='Racionalización';
  SELECT id INTO s3  FROM subtemas WHERE nombre='Proporcionalidad';
  SELECT id INTO s4  FROM subtemas WHERE nombre='Porcentajes';
  SELECT id INTO s5  FROM subtemas WHERE nombre='MCD y MCM';
  SELECT id INTO s6  FROM subtemas WHERE nombre='Productos notables';
  SELECT id INTO s7  FROM subtemas WHERE nombre='Factorización';
  SELECT id INTO s8  FROM subtemas WHERE nombre='Fracciones algebraicas';
  SELECT id INTO s9  FROM subtemas WHERE nombre='Teorema del residuo';
  SELECT id INTO s10 FROM subtemas WHERE nombre='Ecuaciones de primer grado';
  SELECT id INTO s11 FROM subtemas WHERE nombre='Ecuaciones cuadráticas';
  SELECT id INTO s12 FROM subtemas WHERE nombre='Reducibles a cuadráticas';
  SELECT id INTO s13 FROM subtemas WHERE nombre='Inecuaciones';
  SELECT id INTO s14 FROM subtemas WHERE nombre='Dominio y rango';
  SELECT id INTO s15 FROM subtemas WHERE nombre='Función lineal';
  SELECT id INTO s16 FROM subtemas WHERE nombre='Función cuadrática';
  SELECT id INTO s17 FROM subtemas WHERE nombre='Composición de funciones';
  SELECT id INTO s18 FROM subtemas WHERE nombre='Ecuación de la recta';
  SELECT id INTO s19 FROM subtemas WHERE nombre='Distancia y punto medio';
  SELECT id INTO s20 FROM subtemas WHERE nombre='Circunferencia';
  SELECT id INTO s21 FROM subtemas WHERE nombre='Parábola';
  SELECT id INTO s22 FROM subtemas WHERE nombre='Teorema de Pitágoras';
  SELECT id INTO s23 FROM subtemas WHERE nombre='Semejanza de triángulos';
  SELECT id INTO s24 FROM subtemas WHERE nombre='Áreas y perímetros';
  SELECT id INTO s25 FROM subtemas WHERE nombre='Volúmenes';
  SELECT id INTO s26 FROM subtemas WHERE nombre='Conversión grados-radianes';
  SELECT id INTO s27 FROM subtemas WHERE nombre='Funciones trigonométricas';
  SELECT id INTO s28 FROM subtemas WHERE nombre='Resolución de triángulos';

  -- ===== MÓDULO 1: NÚMEROS REALES =====
  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s1,t1,r1,'BASICO','OPCION_MULTIPLE','Calcula: $|-8| + |3| - |-2|$',NULL,'$|-8|=8$, $|3|=3$, $|-2|=2$. Resultado: $8+3-2=9$.','$|x|$ es la distancia al origen. Siempre $|x|\geq0$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$9$',true),(ej,2,'$13$',false),(ej,3,'$-3$',false),(ej,4,'$3$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s1,t1,r1,'BASICO','VERDADERO_FALSO','El valor absoluto de cualquier número real siempre es estrictamente mayor que cero. ¿Verdadero o Falso?','Falso','FALSO: $|0|=0$. La propiedad correcta es $|x|\geq0$.','$|x|=0$ si y solo si $x=0$.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s1,t1,r1,'INTERMEDIO','OPCION_MULTIPLE','Resuelve: $|2x-4|=10$',NULL,'Caso 1: $x=7$. Caso 2: $x=-3$.','$|ax+b|=c$ genera dos ecuaciones.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x=7$ y $x=-3$',true),(ej,2,'$x=7$ solamente',false),(ej,3,'$x=3$ y $x=-7$',false),(ej,4,'$x=-3$ solamente',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s2,t1,r2,'BASICO','OPCION_MULTIPLE','Racionaliza: $\dfrac{5}{\sqrt{5}}$',NULL,'$\dfrac{5\sqrt{5}}{5}=\sqrt{5}$.','Multiplicar por $\frac{\sqrt{5}}{\sqrt{5}}$.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\sqrt{5}$',true),(ej,2,'$5\sqrt{5}$',false),(ej,3,'$\frac{\sqrt{5}}{5}$',false),(ej,4,'$\frac{5}{\sqrt{25}}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s2,t1,r2,'INTERMEDIO','OPCION_MULTIPLE','Racionaliza: $\dfrac{3}{2-\sqrt{3}}$',NULL,'$(2+\sqrt{3})$: $\frac{3(2+\sqrt{3})}{1}=6+3\sqrt{3}$.','Multiplicar por conjugado.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$6+3\sqrt{3}$',true),(ej,2,'$6-3\sqrt{3}$',false),(ej,3,'$\frac{3}{4-3}$',false),(ej,4,'$3(2-\sqrt{3})$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s3,t2,r1,'INTERMEDIO','OPCION_MULTIPLE','Si 5 obreros construyen un muro en 12 días, ¿cuántos días tardarán 6 obreros?',NULL,'$5\times12=6\times x \Rightarrow x=10$.','Proporción inversa: $a_1 b_1=a_2 b_2$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'10 días',true),(ej,2,'14 días',false),(ej,3,'8 días',false),(ej,4,'15 días',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s4,t2,r1,'BASICO','RESPUESTA_NUMERICA','En una clase de 40 estudiantes, el 35% aprobó. ¿Cuántos aprobaron?','14','$40\times0.35=14$.','$p\%$ de $n$: $\frac{p}{100}\times n$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s4,t2,r1,'INTERMEDIO','OPCION_MULTIPLE','Artículo cuesta Q150. Descuento 20% luego impuesto 10%. ¿Precio final?',NULL,'$150\times0.80=120$. $120\times1.10=Q132$.','Porcentajes sucesivos no se suman.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'Q132',true),(ej,2,'Q135',false),(ej,3,'Q120',false),(ej,4,'Q145',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s5,t2,r2,'BASICO','RESPUESTA_NUMERICA','Calcula el MCD de 24 y 36.','12','$24=2^3\cdot3$, $36=2^2\cdot3^2$. MCD$=2^2\cdot3=12$.','MCD: factores comunes con menor exponente.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m1,s5,t2,r2,'INTERMEDIO','OPCION_MULTIPLE','Calcula el MCM de 12, 18 y 24.',NULL,'MCM$=2^3\cdot3^2=72$.','MCM: factores con mayor exponente.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'72',true),(ej,2,'36',false),(ej,3,'48',false),(ej,4,'144',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  -- ===== MÓDULO 2: ÁLGEBRA =====
  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s6,t1,r1,'BASICO','OPCION_MULTIPLE','Expande: $(x+5)^2$',NULL,'$x^2+10x+25$.','$(a+b)^2=a^2+2ab+b^2$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x^2+10x+25$',true),(ej,2,'$x^2+25$',false),(ej,3,'$x^2+5x+25$',false),(ej,4,'$x^2+10x+10$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s6,t1,r1,'BASICO','OPCION_MULTIPLE','Expande: $(3x+4)(3x-4)$',NULL,'$9x^2-16$.','$(a+b)(a-b)=a^2-b^2$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$9x^2-16$',true),(ej,2,'$9x^2+16$',false),(ej,3,'$3x^2-16$',false),(ej,4,'$9x^2-8x-16$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s7,t2,r2,'BASICO','OPCION_MULTIPLE','Factoriza: $x^2-7x+12$',NULL,'$(x-3)(x-4)$.','Buscar $m\cdot n=12$ y $m+n=-7$.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(x-3)(x-4)$',true),(ej,2,'$(x+3)(x+4)$',false),(ej,3,'$(x-6)(x-2)$',false),(ej,4,'$(x+3)(x-4)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s7,t2,r2,'INTERMEDIO','OPCION_MULTIPLE','Factoriza: $2x^3-8x$',NULL,'$2x(x+2)(x-2)$.','Extraer factor común, luego diferencia de cuadrados.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$2x(x+2)(x-2)$',true),(ej,2,'$2x(x^2-4)$',false),(ej,3,'$x(2x+4)(2x-4)$',false),(ej,4,'$2(x^3-4x)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s8,t3,r3,'BASICO','OPCION_MULTIPLE','Simplifica: $\dfrac{x^2-9}{x+3}$',NULL,'$x-3$ (con $x\neq-3$).','Factorizar: $(x+3)(x-3)$, cancelar.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x-3$',true),(ej,2,'$x+3$',false),(ej,3,'$x^2-3$',false),(ej,4,'$\frac{x-3}{x+3}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s8,t3,r3,'INTERMEDIO','OPCION_MULTIPLE','Suma: $\dfrac{2}{x+1}+\dfrac{3}{x-1}$',NULL,'$\dfrac{5x+1}{x^2-1}$.','MCM$(x+1)(x-1)$.',6,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\frac{5x+1}{x^2-1}$',true),(ej,2,'$\frac{5}{x^2-1}$',false),(ej,3,'$\frac{5x-1}{x^2-1}$',false),(ej,4,'$\frac{5x+1}{x^2+1}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s9,t4,r1,'BASICO','OPCION_MULTIPLE','Residuo de $p(x)=x^3-2x+1$ al dividir entre $(x-1)$.',NULL,'$p(1)=0$.','Teorema del residuo: $p(a)$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'0',true),(ej,2,'1',false),(ej,3,'-2',false),(ej,4,'2',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s9,t4,r1,'INTERMEDIO','OPCION_MULTIPLE','$p(x)=2x^3+ax^2-5x+3$, residuo al dividir entre $(x+1)$ es 7. ¿$a$?',NULL,'$p(-1)=7\Rightarrow a=1$.','$p(-1)=7$ por teorema del residuo.',6,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$a=1$',true),(ej,2,'$a=-1$',false),(ej,3,'$a=2$',false),(ej,4,'$a=0$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s6,t1,r2,'AVANZADO','OPCION_MULTIPLE','Expande: $(2x-3y)^3$',NULL,'$8x^3-36x^2y+54xy^2-27y^3$.','$(a-b)^3=a^3-3a^2b+3ab^2-b^3$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$8x^3-36x^2y+54xy^2-27y^3$',true),(ej,2,'$8x^3-27y^3$',false),(ej,3,'$8x^3+36x^2y+54xy^2+27y^3$',false),(ej,4,'$8x^3-12x^2y+6xy^2-27y^3$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m2,s7,t2,r3,'AVANZADO','OPCION_MULTIPLE','Factoriza $x^3+2x^2-5x-6$, sabiendo que $x=-1$ es raíz.',NULL,'$(x+1)(x+3)(x-2)$.','Si $r$ es raíz, $(x-r)$ es factor.',8,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(x+1)(x+3)(x-2)$',true),(ej,2,'$(x-1)(x+3)(x-2)$',false),(ej,3,'$(x+1)(x-3)(x+2)$',false),(ej,4,'$(x+1)(x^2-5x-6)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  -- ===== MÓDULO 3: ECUACIONES =====
  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s10,t1,r1,'BASICO','RESPUESTA_NUMERICA','Resuelve: $3x-7=2x+5$','12','$x=12$.','Agrupar términos semejantes.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s10,t1,r1,'BASICO','OPCION_MULTIPLE','La suma de tres números consecutivos es 72. ¿Cuál es el mayor?',NULL,'$n=23$, mayor=$25$.','$n+(n+1)+(n+2)=72$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'25',true),(ej,2,'24',false),(ej,3,'23',false),(ej,4,'26',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s11,t2,r2,'INTERMEDIO','OPCION_MULTIPLE','Resuelve: $x^2-5x+6=0$',NULL,'$x=2$ y $x=3$.','$(x-2)(x-3)=0$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x=2$ y $x=3$',true),(ej,2,'$x=-2$ y $x=-3$',false),(ej,3,'$x=5$ y $x=1$',false),(ej,4,'$x=6$ y $x=1$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s11,t2,r2,'INTERMEDIO','OPCION_MULTIPLE','Fórmula general: $2x^2+3x-2=0$',NULL,'$x=\frac{1}{2}$ y $x=-2$.','$\Delta=25$, $x=\frac{-3\pm5}{4}$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x=\frac{1}{2}$ y $x=-2$',true),(ej,2,'$x=2$ y $x=-\frac{1}{2}$',false),(ej,3,'$x=1$ y $x=-2$',false),(ej,4,'$x=\frac{1}{2}$ y $x=2$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s13,t3,r3,'BASICO','OPCION_MULTIPLE','Resuelve: $2x-3>7$',NULL,'$x>5$.','$2x>10\Rightarrow x>5$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x>5$',true),(ej,2,'$x<5$',false),(ej,3,'$x>2$',false),(ej,4,'$x\geq5$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s12,t3,r1,'INTERMEDIO','OPCION_MULTIPLE','Resuelve: $x^4-5x^2+4=0$',NULL,'$x=\pm1$ y $x=\pm2$.','$u=x^2$: $(u-1)(u-4)=0$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x=\pm1$ y $x=\pm2$',true),(ej,2,'$x=1$ y $x=4$',false),(ej,3,'$x=\pm\sqrt{5}$',false),(ej,4,'$x=1$ y $x=2$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s13,t4,r2,'AVANZADO','OPCION_MULTIPLE','Resuelve: $x^2-x-6<0$',NULL,'$-2<x<3$.','$(x-3)(x+2)<0$, negativo entre raíces.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$-2<x<3$',true),(ej,2,'$x<-2$ o $x>3$',false),(ej,3,'$x>3$',false),(ej,4,'$-3<x<2$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s11,t1,r1,'AVANZADO','OPCION_MULTIPLE','Para que $x^2-kx+9=0$ tenga raíces iguales, ¿$k$?',NULL,'$k=\pm6$.','$\Delta=0$: $k^2-36=0$.',6,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$k=\pm6$',true),(ej,2,'$k=6$ solamente',false),(ej,3,'$k=\pm3$',false),(ej,4,'$k=9$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s10,t2,r3,'INTERMEDIO','OPCION_MULTIPLE','Sistema: $2x+y=7$, $x-y=2$',NULL,'$(3,1)$.','Suma ecuaciones: $3x=9$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(3,1)$',true),(ej,2,'$(1,3)$',false),(ej,3,'$(2,3)$',false),(ej,4,'$(3,2)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m3,s13,t3,r2,'INTERMEDIO','OPCION_MULTIPLE','Resuelve: $-3x+2\leq11$',NULL,'$x\geq-3$.','Al dividir por negativo, se invierte desigualdad.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$x\geq-3$',true),(ej,2,'$x\leq-3$',false),(ej,3,'$x\geq3$',false),(ej,4,'$x\leq3$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  -- ===== MÓDULO 4: FUNCIONES =====
  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s14,t3,r3,'BASICO','OPCION_MULTIPLE','Evalúa $f(x)=3x^2-2x+1$ en $x=-2$.',NULL,'17.','$3(4)+4+1=17$.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'17',true),(ej,2,'9',false),(ej,3,'5',false),(ej,4,'-17',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s14,t3,r3,'INTERMEDIO','OPCION_MULTIPLE','¿Dominio de $f(x)=\sqrt{x-3}$?',NULL,'$[3,+\infty)$.','$x-3\geq0\Rightarrow x\geq3$.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$[3,+\infty)$',true),(ej,2,'$(-\infty,3]$',false),(ej,3,'$\mathbb{R}$',false),(ej,4,'$(3,+\infty)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s14,t3,r3,'INTERMEDIO','OPCION_MULTIPLE','¿Dominio de $f(x)=\dfrac{1}{x^2-4}$?',NULL,'$\mathbb{R}\setminus\{-2,2\}$.','$x^2-4\neq0\Rightarrow x\neq\pm2$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\mathbb{R}\setminus\{-2,2\}$',true),(ej,2,'$\mathbb{R}\setminus\{4\}$',false),(ej,3,'$\mathbb{R}$',false),(ej,4,'$\mathbb{R}\setminus\{2\}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s15,t4,r1,'BASICO','OPCION_MULTIPLE','¿Corte con eje $x$ de $f(x)=2x-6$?',NULL,'$(3,0)$.','$2x-6=0\Rightarrow x=3$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(3,0)$',true),(ej,2,'$(0,-6)$',false),(ej,3,'$(6,0)$',false),(ej,4,'$(0,3)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s15,t4,r1,'INTERMEDIO','OPCION_MULTIPLE','$y=2x+3$ y $y=2x-5$: ¿relación entre ellas?',NULL,'Paralelas.','Misma pendiente $m=2$, diferente intercepto.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'Paralelas',true),(ej,2,'Perpendiculares',false),(ej,3,'Se intersectan',false),(ej,4,'Son la misma recta',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s16,t4,r2,'INTERMEDIO','OPCION_MULTIPLE','Vértice de $f(x)=x^2-4x+3$.',NULL,'$(2,-1)$.','$x_v=2$, $y_v=-1$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(2,-1)$',true),(ej,2,'$(-2,1)$',false),(ej,3,'$(2,3)$',false),(ej,4,'$(4,-1)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s17,t3,r3,'INTERMEDIO','OPCION_MULTIPLE','$f(x)=2x+1$, $g(x)=x^2$. Calcula $(f\circ g)(3)$.',NULL,'19.','$f(9)=19$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'19',true),(ej,2,'49',false),(ej,3,'7',false),(ej,4,'13',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s16,t3,r2,'AVANZADO','OPCION_MULTIPLE','Rango de $f(x)=-2x^2+8x-3$.',NULL,'$(-\infty,5]$.','$a=-2$, $y_v=5$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(-\infty,5]$',true),(ej,2,'$[5,+\infty)$',false),(ej,3,'$\mathbb{R}$',false),(ej,4,'$(-\infty,2]$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s17,t4,r3,'AVANZADO','OPCION_MULTIPLE','$f(x)=\sqrt{x}$, $g(x)=x-4$. ¿Dominio de $(f\circ g)$?',NULL,'$[4,+\infty)$.','$x-4\geq0$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$[4,+\infty)$',true),(ej,2,'$[0,+\infty)$',false),(ej,3,'$\mathbb{R}$',false),(ej,4,'$(-\infty,4]$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m4,s15,t4,r2,'AVANZADO','OPCION_MULTIPLE','Recta paralela a $y=4x+1$ que pasa por $(-1,3)$.',NULL,'$y=4x+7$.','$m=4$, punto-pendiente.',6,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$y=4x+7$',true),(ej,2,'$y=4x-1$',false),(ej,3,'$y=-\frac{1}{4}x+7$',false),(ej,4,'$y=4x+3$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  -- ===== MÓDULO 5: GEOMETRÍA ANALÍTICA =====
  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s18,t1,r1,'BASICO','OPCION_MULTIPLE','Pendiente de $3x-2y+8=0$.',NULL,'$\frac{3}{2}$.','$y=\frac{3}{2}x+4$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\frac{3}{2}$',true),(ej,2,'$-\frac{3}{2}$',false),(ej,3,'3',false),(ej,4,'$\frac{2}{3}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s18,t1,r1,'INTERMEDIO','OPCION_MULTIPLE','Ecuación de la recta por $A(2,1)$ y $B(4,7)$.',NULL,'$y=3x-5$.','$m=3$, punto-pendiente.',6,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$y=3x-5$',true),(ej,2,'$y=3x+5$',false),(ej,3,'$y=2x-3$',false),(ej,4,'$y=3x-1$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s19,t2,r2,'BASICO','OPCION_MULTIPLE','Distancia entre $P(1,2)$ y $Q(4,6)$.',NULL,'5.','$\sqrt{9+16}=5$.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'5',true),(ej,2,'$\sqrt{7}$',false),(ej,3,'7',false),(ej,4,'25',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s19,t2,r2,'BASICO','OPCION_MULTIPLE','Punto medio entre $A(-2,4)$ y $B(6,0)$.',NULL,'$(2,2)$.','$(\frac{-2+6}{2},\frac{4+0}{2})$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(2,2)$',true),(ej,2,'$(4,4)$',false),(ej,3,'$(1,2)$',false),(ej,4,'$(2,4)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s20,t3,r3,'INTERMEDIO','OPCION_MULTIPLE','Circunferencia con centro $(3,-2)$ y radio 5.',NULL,'$(x-3)^2+(y+2)^2=25$.','$(x-h)^2+(y-k)^2=r^2$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(x-3)^2+(y+2)^2=25$',true),(ej,2,'$(x+3)^2+(y-2)^2=25$',false),(ej,3,'$(x-3)^2+(y+2)^2=5$',false),(ej,4,'$(x-3)^2+(y-2)^2=25$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s18,t1,r1,'AVANZADO','OPCION_MULTIPLE','Perpendicular a $y=3x+2$ por $(6,1)$.',NULL,'$y=-\frac{1}{3}x+3$.','$m_\perp=-\frac{1}{3}$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$y=-\frac{1}{3}x+3$',true),(ej,2,'$y=3x-17$',false),(ej,3,'$y=-\frac{1}{3}x+1$',false),(ej,4,'$y=\frac{1}{3}x+3$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s20,t3,r3,'AVANZADO','OPCION_MULTIPLE','Centro y radio: $x^2+y^2-6x+4y-3=0$',NULL,'Centro $(3,-2)$, radio $4$.','Completar cuadrado: $(x-3)^2+(y+2)^2=16$.',8,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'Centro $(3,-2)$, radio $4$',true),(ej,2,'Centro $(-3,2)$, radio $4$',false),(ej,3,'Centro $(3,-2)$, radio $16$',false),(ej,4,'Centro $(6,-4)$, radio $4$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s21,t1,r1,'INTERMEDIO','OPCION_MULTIPLE','Vértice de $y^2=8x$.',NULL,'$(0,0)$.','$y^2=4px$, vértice en origen.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(0,0)$',true),(ej,2,'$(2,0)$',false),(ej,3,'$(0,2)$',false),(ej,4,'$(8,0)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s19,t2,r2,'INTERMEDIO','VERDADERO_FALSO','El punto $(2,3)$ pertenece a $y=2x-1$. ¿Verdadero o Falso?','Verdadero','$y=2(2)-1=3$. VERDADERO.','Sustituir coordenadas y verificar.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m5,s21,t4,r3,'AVANZADO','OPCION_MULTIPLE','Foco de $x^2=12y$.',NULL,'$(0,3)$.','$4p=12\Rightarrow p=3$.',6,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$(0,3)$',true),(ej,2,'$(3,0)$',false),(ej,3,'$(0,12)$',false),(ej,4,'$(0,-3)$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  -- ===== MÓDULO 6: GEOMETRÍA =====
  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s22,t4,r3,'BASICO','RESPUESTA_NUMERICA','Catetos 6 cm y 8 cm. ¿Hipotenusa?','10','$\sqrt{36+64}=10$.','$c^2=a^2+b^2$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s22,t4,r3,'INTERMEDIO','OPCION_MULTIPLE','Hipotenusa 13 cm, cateto 5 cm. ¿Otro cateto?',NULL,'12 cm.','$b=\sqrt{169-25}=12$.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'12 cm',true),(ej,2,'8 cm',false),(ej,3,'$\sqrt{194}$ cm',false),(ej,4,'10 cm',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s24,t1,r1,'BASICO','RESPUESTA_NUMERICA','Rectángulo base 12 cm y altura 7 cm. ¿Área?','84','$A=12\times7=84$.','$A=b\times h$.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s24,t1,r1,'INTERMEDIO','OPCION_MULTIPLE','Triángulo base 10 cm y altura 8 cm. ¿Área?',NULL,'40 cm².','$A=\frac{10\times8}{2}=40$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'40 cm²',true),(ej,2,'80 cm²',false),(ej,3,'18 cm²',false),(ej,4,'20 cm²',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s23,t2,r2,'INTERMEDIO','OPCION_MULTIPLE','Triángulos semejantes: lados 6 y 10. Segundo tiene lado 15 correspondiente al 10. ¿El correspondiente al 6?',NULL,'9.','Razón $\frac{15}{10}=\frac{3}{2}$, lado$=9$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'9',true),(ej,2,'4',false),(ej,3,'12',false),(ej,4,'8',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s25,t3,r3,'BASICO','RESPUESTA_NUMERICA','Volumen de cubo con arista 4 cm.','64','$V=4^3=64$.','$V=a^3$.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s25,t3,r3,'INTERMEDIO','OPCION_MULTIPLE','Cilindro radio 3 cm, altura 10 cm. ¿Volumen?',NULL,'$90\pi$ cm³.','$V=\pi r^2h=90\pi$.',4,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$90\pi$ cm³',true),(ej,2,'$30\pi$ cm³',false),(ej,3,'$9\pi$ cm³',false),(ej,4,'$60\pi$ cm³',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s22,t4,r1,'AVANZADO','OPCION_MULTIPLE','Escalera de 10 m, base a 6 m de pared. ¿Altura?',NULL,'8 m.','$h^2+36=100\Rightarrow h=8$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'8 m',true),(ej,2,'4 m',false),(ej,3,'$\sqrt{136}$ m',false),(ej,4,'7 m',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s24,t1,r2,'AVANZADO','OPCION_MULTIPLE','Trapecio bases 8 y 14 cm, altura 6 cm. ¿Área?',NULL,'66 cm².','$A=\frac{(8+14)\times6}{2}=66$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'66 cm²',true),(ej,2,'132 cm²',false),(ej,3,'48 cm²',false),(ej,4,'84 cm²',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m6,s25,t3,r3,'AVANZADO','OPCION_MULTIPLE','Esfera radio 6 cm. ¿Volumen en $\pi$?',NULL,'$288\pi$ cm³.','$V=\frac{4}{3}\pi(216)=288\pi$.',6,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$288\pi$ cm³',true),(ej,2,'$144\pi$ cm³',false),(ej,3,'$72\pi$ cm³',false),(ej,4,'$864\pi$ cm³',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  -- ===== MÓDULO 7: TRIGONOMETRÍA =====
  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s26,t4,r1,'BASICO','OPCION_MULTIPLE','Convierte $180°$ a radianes.',NULL,'$\pi$.','$180\times\frac{\pi}{180}=\pi$.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\pi$',true),(ej,2,'$2\pi$',false),(ej,3,'$\frac{\pi}{2}$',false),(ej,4,'$\frac{\pi}{4}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s26,t4,r1,'BASICO','OPCION_MULTIPLE','Convierte $\frac{3\pi}{4}$ a grados.',NULL,'135°.','$\frac{3\pi}{4}\times\frac{180}{\pi}=135$.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'135°',true),(ej,2,'120°',false),(ej,3,'150°',false),(ej,4,'270°',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s27,t1,r2,'BASICO','OPCION_MULTIPLE','Calcula $\tan(45°)$.',NULL,'1.','$\frac{\sin45°}{\cos45°}=1$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'1',true),(ej,2,'$\sqrt{2}$',false),(ej,3,'$\frac{1}{2}$',false),(ej,4,'$\frac{\sqrt{3}}{2}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s27,t1,r2,'INTERMEDIO','OPCION_MULTIPLE','$\sin\theta=\frac{3}{5}$ en 1er cuadrante. ¿$\cos\theta$?',NULL,'$\frac{4}{5}$.','$\cos^2\theta=1-\frac{9}{25}=\frac{16}{25}$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\frac{4}{5}$',true),(ej,2,'$\frac{3}{4}$',false),(ej,3,'$\frac{5}{3}$',false),(ej,4,'$\frac{1}{5}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s28,t2,r3,'INTERMEDIO','OPCION_MULTIPLE','Triángulo rect. $\theta=30°$, hipotenusa 20 cm. ¿Cateto opuesto?',NULL,'10 cm.','$\sin30°=\frac{c}{20}\Rightarrow c=10$.',5,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'10 cm',true),(ej,2,'$10\sqrt{3}$ cm',false),(ej,3,'$10\sqrt{2}$ cm',false),(ej,4,'5 cm',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s27,t4,r1,'AVANZADO','OPCION_MULTIPLE','Simplifica: $\dfrac{\sin^2\theta+\cos^2\theta}{\tan\theta\cdot\cos\theta}$',NULL,'$\csc\theta$.','Numerador$=1$, denominador$=\sin\theta$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\csc\theta$',true),(ej,2,'$\sec\theta$',false),(ej,3,'$\tan\theta$',false),(ej,4,'$\sin\theta$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s26,t4,r2,'INTERMEDIO','OPCION_MULTIPLE','Convierte $270°$ a radianes.',NULL,'$\frac{3\pi}{2}$.','$270\times\frac{\pi}{180}=\frac{3\pi}{2}$.',3,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\frac{3\pi}{2}$',true),(ej,2,'$\frac{2\pi}{3}$',false),(ej,3,'$3\pi$',false),(ej,4,'$\frac{3\pi}{4}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s28,t2,r3,'INTERMEDIO','OPCION_MULTIPLE','Triángulo 30-60-90, lado opuesto a 60° = 10. ¿Hipotenusa?',NULL,'$\frac{20\sqrt{3}}{3}$.','$\sin60°=\frac{10}{c}\Rightarrow c=\frac{20}{\sqrt{3}}$.',7,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\frac{20\sqrt{3}}{3}$',true),(ej,2,'20',false),(ej,3,'$10\sqrt{3}$',false),(ej,4,'$\frac{10\sqrt{3}}{3}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r3,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s27,t1,r1,'BASICO','VERDADERO_FALSO','Para todo $\theta$: $\sin^2\theta+\cos^2\theta=1$. ¿Verdadero o Falso?','Verdadero','VERDADERO. Identidad pitagórica fundamental.','Se deriva del teorema de Pitágoras en el círculo unitario.',2,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r1,'PUBLICADO',NULL,NOW());

  INSERT INTO ejercicios (modulo_id,subtema_id,tutor_id,revisor_id,nivel_dificultad,tipo_ejercicio,enunciado,respuesta_correcta_texto,solucion_paso_a_paso,explicacion_conceptual,tiempo_estimado_minutos,estado,advertencia_duplicado,fecha_creacion,fecha_revision,fecha_publicacion)
  VALUES (m7,s28,t4,r2,'AVANZADO','OPCION_MULTIPLE','Triángulo $a=7$, $b=8$, $c=9$. Calcula $\cos(C)$.',NULL,'$\frac{2}{7}$.','$\cos C=\frac{49+64-81}{112}=\frac{32}{112}=\frac{2}{7}$.',8,'PUBLICADO',false,NOW(),NOW(),NOW()) RETURNING id INTO ej;
  INSERT INTO opciones_ejercicio (ejercicio_id,orden_opcion,texto_opcion,es_correcta) VALUES (ej,1,'$\frac{2}{7}$',true),(ej,2,'$\frac{7}{2}$',false),(ej,3,'$\frac{4}{7}$',false),(ej,4,'$\frac{1}{4}$',false);
  INSERT INTO revisiones_ejercicio (ejercicio_id,revisor_id,accion,notas,fecha_evento) VALUES (ej,r2,'PUBLICADO',NULL,NOW());

END $$;

-- ============================================================
-- TEST DIAGNÓSTICO
-- ============================================================
INSERT INTO tests_diagnostico (nombre,descripcion,activo,creado_por)
VALUES ('Diagnóstico Inicial USAC','Test de nivelación con preguntas de los 7 módulos',TRUE,
        (SELECT id FROM usuarios WHERE correo='kenny.salazar@ingeniamath.gt'));

INSERT INTO test_diagnostico_preguntas (test_diagnostico_id, ejercicio_id, orden_pregunta)
SELECT
    t.id,
    x.id,
    ROW_NUMBER() OVER (ORDER BY x.modulo_id, x.id)
FROM tests_diagnostico t
JOIN (
    SELECT id, modulo_id
    FROM (
        SELECT
            id,
            modulo_id,
            ROW_NUMBER() OVER (PARTITION BY modulo_id ORDER BY id) AS rn
        FROM ejercicios
        WHERE estado = 'PUBLICADO'
    ) q
    WHERE rn <= 2
) x ON TRUE
WHERE t.nombre = 'Diagnóstico Inicial USAC';
-- ============================================================
-- INTENTOS DE DIAGNÓSTICO
-- ============================================================
INSERT INTO intentos_diagnostico (test_diagnostico_id,estudiante_id,estado,puntaje_total,fecha_inicio,fecha_fin)
VALUES
((SELECT id FROM tests_diagnostico LIMIT 1),
 (SELECT id FROM usuarios WHERE correo='ana.morales@correo.com'),
 'FINALIZADO',57.14,NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days'+INTERVAL '30 minutes'),
((SELECT id FROM tests_diagnostico LIMIT 1),
 (SELECT id FROM usuarios WHERE correo='luis.perez@correo.com'),
 'FINALIZADO',71.43,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'+INTERVAL '25 minutes');

-- Resultados por módulo
INSERT INTO resultados_diagnostico_modulo (intento_diagnostico_id,modulo_id,puntaje_porcentaje,clasificacion)
SELECT i.id, m.id,
  CASE WHEN m.orden IN (2,4) THEN 100.00 WHEN m.orden=7 THEN 0.00 ELSE 50.00 END,
  CASE WHEN m.orden IN (2,4) THEN 'DOMINADO' WHEN m.orden=7 THEN 'DEFICIENTE' ELSE 'EN_DESARROLLO' END
FROM intentos_diagnostico i, modulos_tematicos m
WHERE i.estudiante_id=(SELECT id FROM usuarios WHERE correo='ana.morales@correo.com');

INSERT INTO resultados_diagnostico_modulo (intento_diagnostico_id,modulo_id,puntaje_porcentaje,clasificacion)
SELECT i.id, m.id,
  CASE WHEN m.orden IN (1,2,3,5) THEN 100.00 WHEN m.orden IN (4,6) THEN 50.00 ELSE 50.00 END,
  CASE WHEN m.orden IN (1,2,3,5) THEN 'DOMINADO' ELSE 'EN_DESARROLLO' END
FROM intentos_diagnostico i, modulos_tematicos m
WHERE i.estudiante_id=(SELECT id FROM usuarios WHERE correo='luis.perez@correo.com');

-- ============================================================
-- RUTAS DE APRENDIZAJE
-- ============================================================
INSERT INTO rutas_aprendizaje (estudiante_id,intento_diagnostico_id,activa)
VALUES
((SELECT id FROM usuarios WHERE correo='ana.morales@correo.com'),
 (SELECT id FROM intentos_diagnostico WHERE estudiante_id=(SELECT id FROM usuarios WHERE correo='ana.morales@correo.com')),TRUE),
((SELECT id FROM usuarios WHERE correo='luis.perez@correo.com'),
 (SELECT id FROM intentos_diagnostico WHERE estudiante_id=(SELECT id FROM usuarios WHERE correo='luis.perez@correo.com')),TRUE);

INSERT INTO ruta_aprendizaje_detalle (ruta_id,modulo_id,subtema_id,prioridad_modulo,prioridad_subtema,origen,estado)
SELECT r.id, s.modulo_id, s.id, 1, s.orden_complejidad, 'DIRECTO', 'PENDIENTE'
FROM rutas_aprendizaje r
JOIN usuarios u ON r.estudiante_id=u.id
JOIN modulos_tematicos m ON m.orden=7
JOIN subtemas s ON s.modulo_id=m.id
WHERE u.correo='ana.morales@correo.com';

INSERT INTO ruta_aprendizaje_detalle (ruta_id,modulo_id,subtema_id,prioridad_modulo,prioridad_subtema,origen,estado)
SELECT r.id, s.modulo_id, s.id, 1, s.orden_complejidad, 'DIRECTO', 'PENDIENTE'
FROM rutas_aprendizaje r
JOIN usuarios u ON r.estudiante_id=u.id
JOIN modulos_tematicos m ON m.orden=4
JOIN subtemas s ON s.modulo_id=m.id
WHERE u.correo='luis.perez@correo.com';

-- ============================================================
-- CONFIGURACIÓN Y SIMULACROS
-- ============================================================
INSERT INTO configuraciones_simulacro (nombre,duracion_minutos,cantidad_preguntas,puntaje_minimo_aprobacion,activa,creado_por)
VALUES ('Simulacro Estándar USAC',90,14,61.00,TRUE,
        (SELECT id FROM usuarios WHERE correo='kenny.salazar@ingeniamath.gt'));

INSERT INTO configuracion_simulacro_modulo (configuracion_simulacro_id,modulo_id,cantidad_preguntas)
SELECT c.id, m.id, 2 FROM configuraciones_simulacro c, modulos_tematicos m
WHERE c.nombre='Simulacro Estándar USAC';

-- 3 simulacros
INSERT INTO simulacros (configuracion_simulacro_id,estudiante_id,estado,puntaje_total,puntaje_minimo_referencia,aprueba_referencia,duracion_minutos_real,fecha_inicio,fecha_fin)
VALUES
((SELECT id FROM configuraciones_simulacro LIMIT 1),
 (SELECT id FROM usuarios WHERE correo='ana.morales@correo.com'),
 'FINALIZADO',57.14,61.00,false,45,NOW()-INTERVAL '9 days',NOW()-INTERVAL '9 days'+INTERVAL '45 minutes'),
((SELECT id FROM configuraciones_simulacro LIMIT 1),
 (SELECT id FROM usuarios WHERE correo='ana.morales@correo.com'),
 'FINALIZADO',71.43,61.00,true,52,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days'+INTERVAL '52 minutes'),
((SELECT id FROM configuraciones_simulacro LIMIT 1),
 (SELECT id FROM usuarios WHERE correo='luis.perez@correo.com'),
 'FINALIZADO',64.29,61.00,true,48,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days'+INTERVAL '48 minutes');

-- Preguntas de simulacros (2 por módulo)
INSERT INTO simulacro_preguntas (simulacro_id,ejercicio_id,orden_pregunta,es_correcta)
SELECT s.id, e.id,
       ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY e.modulo_id, e.id),
       (ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY e.modulo_id, e.id) % 3 != 0)
FROM simulacros s,
     (SELECT id, modulo_id FROM (
       SELECT id, modulo_id, ROW_NUMBER() OVER (PARTITION BY modulo_id ORDER BY id) rn
       FROM ejercicios WHERE estado='PUBLICADO'
     ) x WHERE rn <= 2) e;

-- Resultados por módulo de simulacros
INSERT INTO simulacro_resultados_modulo (simulacro_id,modulo_id,total_preguntas,total_correctas,puntaje_porcentaje)
SELECT sim.id, m.id, 2,
       CASE WHEN m.orden <= 5 THEN 2 ELSE 1 END,
       CASE WHEN m.orden <= 5 THEN 100.00 ELSE 50.00 END
FROM simulacros sim, modulos_tematicos m;

-- ============================================================
-- RECURSOS EDUCATIVOS (14: 1 PDF + 1 video por módulo)
-- ============================================================
INSERT INTO recursos_educativos (modulo_id,subtema_id,tutor_id,revisor_id,tipo_recurso,titulo,descripcion,url_recurso,estado,fecha_publicacion)
SELECT m.id, s.id,
  (SELECT id FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt'),
  (SELECT id FROM usuarios WHERE correo='walter.reyes@ingeniamath.gt'),
  tipo, titulo, desc_, url, 'PUBLICADO', NOW()
FROM modulos_tematicos m
JOIN (VALUES
  (1,'VIDEO','Valor absoluto explicado','Propiedades y ejercicios de valor absoluto','https://youtube.com/watch?v=valabs'),
  (1,'PDF','Guía de porcentajes','Resumen de porcentajes y proporcionalidad','https://drive.google.com/porcentajes'),
  (2,'VIDEO','Productos notables','Los 5 productos notables más importantes','https://youtube.com/watch?v=prodnotables'),
  (2,'PDF','Técnicas de factorización','Formulario con todos los métodos','https://drive.google.com/factorizacion'),
  (3,'VIDEO','Ecuaciones cuadráticas','Tres métodos de resolución','https://youtube.com/watch?v=cuadraticas'),
  (3,'PDF','Guía de ecuaciones','Ecuaciones lineales y cuadráticas','https://drive.google.com/ecuaciones'),
  (4,'VIDEO','Dominio y rango','Cómo encontrar dominio y rango','https://youtube.com/watch?v=domrango'),
  (4,'PDF','Guía de funciones','Función lineal, cuadrática y composición','https://drive.google.com/funciones'),
  (5,'VIDEO','Geometría analítica','Recta, distancia y circunferencia','https://youtube.com/watch?v=geoanalítica'),
  (5,'PDF','Formulario de geometría analítica','Fórmulas de distancia, punto medio y cónicas','https://drive.google.com/geoana'),
  (6,'VIDEO','Teorema de Pitágoras','Demostración y aplicaciones','https://youtube.com/watch?v=pitagoras'),
  (6,'PDF','Áreas y volúmenes','Formulario de figuras geométricas','https://drive.google.com/areasyvolumenes'),
  (7,'VIDEO','Funciones trigonométricas','Seno, coseno y tangente','https://youtube.com/watch?v=trigfunciones'),
  (7,'PDF','Tabla trigonométrica','Valores exactos para ángulos especiales','https://drive.google.com/tablatrig')
) AS data(mod_orden, tipo, titulo, desc_, url) ON m.orden = data.mod_orden
JOIN subtemas s ON s.modulo_id = m.id AND s.orden_complejidad = 1;

-- ============================================================
-- FLASHCARDS (10 en 5 módulos)
-- ============================================================
INSERT INTO flashcards (modulo_id,subtema_id,titulo,frente,reverso,creado_por)
VALUES
((SELECT id FROM modulos_tematicos WHERE orden=1),(SELECT id FROM subtemas WHERE nombre='Valor absoluto'),
 'Definición de Valor Absoluto','¿Qué es $|x|$?','Distancia de $x$ al origen: $|x|=x$ si $x\geq0$; $-x$ si $x<0$.',
 (SELECT id FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=1),(SELECT id FROM subtemas WHERE nombre='MCD y MCM'),
 'MCD vs MCM','¿Diferencia entre MCD y MCM?','MCD: mayor divisor común. MCM: menor múltiplo común.',
 (SELECT id FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=2),(SELECT id FROM subtemas WHERE nombre='Productos notables'),
 'Cuadrado del binomio','¿Fórmula de $(a+b)^2$?','$(a+b)^2=a^2+2ab+b^2$. Nunca olvidar $2ab$.',
 (SELECT id FROM usuarios WHERE correo='brandon.hernandez@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=2),(SELECT id FROM subtemas WHERE nombre='Factorización'),
 'Diferencia de cuadrados','¿Cómo factorizar $a^2-b^2$?','$a^2-b^2=(a+b)(a-b)$.',
 (SELECT id FROM usuarios WHERE correo='brandon.hernandez@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=3),(SELECT id FROM subtemas WHERE nombre='Ecuaciones cuadráticas'),
 'Fórmula cuadrática','¿Fórmula general para $ax^2+bx+c=0$?','$x=\dfrac{-b\pm\sqrt{b^2-4ac}}{2a}$.',
 (SELECT id FROM usuarios WHERE correo='mario.gomez@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=3),(SELECT id FROM subtemas WHERE nombre='Inecuaciones'),
 'Regla de inecuaciones','¿Qué ocurre al multiplicar por negativo?','El signo de la desigualdad se INVIERTE.',
 (SELECT id FROM usuarios WHERE correo='mario.gomez@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=4),(SELECT id FROM subtemas WHERE nombre='Dominio y rango'),
 'Dominio de fracción','¿Dominio de $f(x)=\frac{1}{x-a}$?','$\mathbb{R}\setminus\{a\}$: excluir $x=a$.',
 (SELECT id FROM usuarios WHERE correo='paola.diaz@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=7),(SELECT id FROM subtemas WHERE nombre='Conversión grados-radianes'),
 'Conversión de ángulos','¿Grados a radianes?','Multiplicar por $\dfrac{\pi}{180}$.',
 (SELECT id FROM usuarios WHERE correo='paola.diaz@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=7),(SELECT id FROM subtemas WHERE nombre='Funciones trigonométricas'),
 'Identidad pitagórica','¿Identidad trig. fundamental?','$\sin^2\theta+\cos^2\theta=1$.',
 (SELECT id FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt')),
((SELECT id FROM modulos_tematicos WHERE orden=6),(SELECT id FROM subtemas WHERE nombre='Teorema de Pitágoras'),
 'Teorema de Pitágoras','¿Enunciado del teorema?','$c^2=a^2+b^2$, $c$ es hipotenusa, $a$ y $b$ son catetos.',
 (SELECT id FROM usuarios WHERE correo='brandon.hernandez@ingeniamath.gt'));

-- ============================================================
-- FORO
-- ============================================================
INSERT INTO hilos_foro (estudiante_id,modulo_id,subtema_id,titulo,contenido,estado)
VALUES
((SELECT id FROM usuarios WHERE correo='ana.morales@correo.com'),
 (SELECT id FROM modulos_tematicos WHERE orden=2),
 (SELECT id FROM subtemas WHERE nombre='Productos notables'),
 'Duda sobre productos notables','No entiendo cuándo usar diferencia de cuadrados.','RESUELTO'),
((SELECT id FROM usuarios WHERE correo='luis.perez@correo.com'),
 (SELECT id FROM modulos_tematicos WHERE orden=7),
 (SELECT id FROM subtemas WHERE nombre='Funciones trigonométricas'),
 'Problema con funciones trigonométricas','Me confundo con seno y coseno en la circunferencia unitaria.','ABIERTO');

INSERT INTO respuestas_foro (hilo_id,usuario_id,contenido,es_solucion_aceptada)
VALUES
((SELECT id FROM hilos_foro WHERE titulo='Duda sobre productos notables'),
 (SELECT id FROM usuarios WHERE correo='escarlett.castillo@ingeniamath.gt'),
 '$a^2-b^2=(a-b)(a+b)$. Requiere dos cuadrados perfectos restados.',TRUE),
((SELECT id FROM hilos_foro WHERE titulo='Problema con funciones trigonométricas'),
 (SELECT id FROM usuarios WHERE correo='brandon.hernandez@ingeniamath.gt'),
 'El coseno es la coordenada $x$ y el seno es la coordenada $y$ en el círculo unitario.',FALSE);

UPDATE hilos_foro SET respuesta_aceptada_id=(
  SELECT id FROM respuestas_foro WHERE hilo_id=(SELECT id FROM hilos_foro WHERE titulo='Duda sobre productos notables') LIMIT 1
) WHERE titulo='Duda sobre productos notables';

-- AUDITORÍA
INSERT INTO auditoria_actividad (usuario_id,entidad,entidad_id,accion,detalle) VALUES
((SELECT id FROM usuarios WHERE correo='ana.morales@correo.com'),'usuarios',1,'LOGIN','{"detalle":"Inicio de sesión"}'::jsonb),
((SELECT id FROM usuarios WHERE correo='luis.perez@correo.com'),'usuarios',2,'LOGIN','{"detalle":"Inicio de sesión"}'::jsonb),
((SELECT id FROM usuarios WHERE correo='kenny.salazar@ingeniamath.gt'),'simulacros',1,'CREAR','{"detalle":"Configuración creada"}'::jsonb);

COMMIT;
