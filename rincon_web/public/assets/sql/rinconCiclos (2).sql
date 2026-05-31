CREATE TABLE participantes (
  idParticipante SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  PRIMARY KEY (idParticipante)
);

CREATE TABLE grupo (
  idGrupo SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (idGrupo),
  CONSTRAINT fk_grupo_participante FOREIGN KEY (idGrupo) REFERENCES participantes(idParticipante) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE profesor (
  idProfesor SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (idProfesor),
  CONSTRAINT fk_profesor_participante FOREIGN KEY (idProfesor) REFERENCES participantes(idParticipante) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE lugar (
  idLugar TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  PRIMARY KEY (idLugar)
);

CREATE TABLE cursoAcademico (
  idCurso TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  anioInicio YEAR NOT NULL,
  anioFin YEAR NOT NULL,
  PRIMARY KEY (idCurso),
  CONSTRAINT chk_curso_anios CHECK (anioFin >= anioInicio)
);

CREATE TABLE cicloFormativo (
  idCiclo TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  familia VARCHAR(150) NOT NULL,
  PRIMARY KEY (idCiclo)
);

CREATE TABLE categoria (
  idCategoria TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  predeterminada BIT(1) NOT NULL DEFAULT 0,
  idCategoriaPadre TINYINT UNSIGNED NULL,
  PRIMARY KEY (idCategoria),
  CONSTRAINT fk_categoria_padre FOREIGN KEY (idCategoriaPadre) REFERENCES categoria(idCategoria) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE recurso (
  idCategoria TINYINT UNSIGNED NOT NULL,
  numRecurso TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(150) NULL,
  fechaPublicacion DATE NOT NULL,
  idCurso TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (idCategoria, numRecurso),
  CONSTRAINT fk_recurso_categoria FOREIGN KEY (idCategoria) REFERENCES categoria(idCategoria) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_recurso_curso FOREIGN KEY (idCurso) REFERENCES cursoAcademico(idCurso)
);

CREATE TABLE recursoUrl (
  idCategoria TINYINT UNSIGNED NOT NULL,
  numRecurso TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  url VARCHAR(500) NOT NULL,
  PRIMARY KEY (idCategoria, numRecurso, url),
  CONSTRAINT fk_recurso_url_recurso FOREIGN KEY (idCategoria, numRecurso) REFERENCES recurso(idCategoria, numRecurso) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE recursoArchivo (
  idCategoria TINYINT UNSIGNED NOT NULL,
  numRecurso TINYINT UNSIGNED NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  archivo VARCHAR(500) NOT NULL,
  PRIMARY KEY (idCategoria, numRecurso, archivo),
  CONSTRAINT fk_recurso_archivo_recurso FOREIGN KEY (idCategoria, numRecurso) REFERENCES recurso(idCategoria, numRecurso) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE cicloRecurso (
  idCiclo TINYINT UNSIGNED NOT NULL,
  idCategoria TINYINT UNSIGNED NOT NULL,
  numRecurso TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (idCiclo, idCategoria, numRecurso),
  CONSTRAINT fk_ciclo_recurso_ciclo FOREIGN KEY (idCiclo) REFERENCES cicloFormativo(idCiclo),
  CONSTRAINT fk_ciclo_recurso_recurso FOREIGN KEY (idCategoria, numRecurso) REFERENCES recurso(idCategoria, numRecurso)
);

CREATE TABLE convocatoria (
  idConvocatoria SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fecha DATETIME NOT NULL,
  idLugar TINYINT UNSIGNED NOT NULL,
  idCurso TINYINT UNSIGNED NOT NULL,
  cancelada CHAR(1) NOT NULL DEFAULT 'a',
  idProfesorRedactaActa SMALLINT UNSIGNED NOT NULL,
  idProfesorIniciaReunion SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT chk_cancelada CHECK (cancelada IN ('a', 'p', 'b')),
  PRIMARY KEY (idConvocatoria),
  CONSTRAINT fk_convocatoria_lugar FOREIGN KEY (idLugar) REFERENCES lugar(idLugar),
  CONSTRAINT fk_convocatoria_curso FOREIGN KEY (idCurso) REFERENCES cursoAcademico(idCurso),
  CONSTRAINT fk_convocatoria_profesor_redacta FOREIGN KEY (idProfesorRedactaActa) REFERENCES profesor(idProfesor),
  CONSTRAINT fk_convocatoria_profesor_inicia FOREIGN KEY (idProfesorIniciaReunion) REFERENCES profesor(idProfesor)
);

CREATE TABLE ordenDia (
  idConvocatoria SMALLINT UNSIGNED NOT NULL,
  numOrden TINYINT UNSIGNED NOT NULL,
  minutos TINYINT UNSIGNED NULL,
  descripcion VARCHAR(250) NULL,
  objetivo VARCHAR(250) NOT NULL,
  idLugar TINYINT UNSIGNED NOT NULL,
  idProfesorDinamiza SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (idConvocatoria, numOrden),
  CONSTRAINT fk_orden_dia_convocatoria FOREIGN KEY (idConvocatoria) REFERENCES convocatoria(idConvocatoria) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_orden_dia_lugar FOREIGN KEY (idLugar) REFERENCES lugar(idLugar),
  CONSTRAINT fk_orden_dia_profesor FOREIGN KEY (idProfesorDinamiza) REFERENCES profesor(idProfesor),
  UNIQUE KEY uk_orden_dia_lugar_profesor (idConvocatoria, numOrden, idLugar, idProfesorDinamiza)
);

CREATE TABLE participanteParticipa (
  idConvocatoria SMALLINT UNSIGNED NOT NULL,
  numOrden TINYINT UNSIGNED NOT NULL,
  idParticipanteParticipa SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (idConvocatoria, numOrden, idParticipanteParticipa),
  CONSTRAINT fk_participante_participa_orden_dia FOREIGN KEY (idConvocatoria, numOrden) REFERENCES ordenDia(idConvocatoria, numOrden),
  CONSTRAINT fk_participante_participa_participante FOREIGN KEY (idParticipanteParticipa) REFERENCES participantes(idParticipante)
);

CREATE TABLE bocc (
  idBocc SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fecha DATE NOT NULL,
  PRIMARY KEY (idBocc)
);

CREATE TABLE apartadoBocc (
  idBocc SMALLINT UNSIGNED NOT NULL,
  numApartado TINYINT UNSIGNED NOT NULL,
  titulo VARCHAR(250) NOT NULL,
  informacion VARCHAR(250) NOT NULL,
  PRIMARY KEY (idBocc, numApartado),
  CONSTRAINT fk_apartado_bocc_bocc FOREIGN KEY (idBocc) REFERENCES bocc(idBocc)
);

CREATE TABLE ruegosPreguntasBocc (
  idBocc SMALLINT UNSIGNED NOT NULL,
  ruegosPreguntas VARCHAR(250) NOT NULL,
  PRIMARY KEY (idBocc, ruegosPreguntas),
  CONSTRAINT fk_ruegos_preguntas_bocc FOREIGN KEY (idBocc) REFERENCES bocc(idBocc)
);

CREATE TABLE boccDirigido (
  idBoccDirigido SMALLINT UNSIGNED NOT NULL,
  idParticipante SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (idBoccDirigido, idParticipante),
  CONSTRAINT fk_bocc_dirigido_bocc FOREIGN KEY (idBoccDirigido) REFERENCES bocc(idBocc),
  CONSTRAINT fk_bocc_dirigido_participante FOREIGN KEY (idParticipante) REFERENCES participantes(idParticipante)
);

CREATE TABLE acta (
  idActa SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  fecha DATE NOT NULL,
  idConvocatoria SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (idActa),
  CONSTRAINT fk_acta_convocatoria FOREIGN KEY (idConvocatoria) REFERENCES convocatoria(idConvocatoria) ON UPDATE CASCADE
);

CREATE TABLE profesor_asiste (
  idActa SMALLINT UNSIGNED NOT NULL,
  idProfesor SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (idActa, idProfesor),
  CONSTRAINT fk_profesor_asiste_acta FOREIGN KEY (idActa) REFERENCES acta(idActa),
  CONSTRAINT fk_profesor_asiste_profesor FOREIGN KEY (idProfesor) REFERENCES profesor(idProfesor)
);

CREATE TABLE informacion (
  idActa SMALLINT UNSIGNED NOT NULL,
  numInformacion TINYINT UNSIGNED NOT NULL,
  titulo_OrdenDia VARCHAR(250) NOT NULL,
  informacion VARCHAR(250) NOT NULL,
  PRIMARY KEY (idActa, numInformacion),
  CONSTRAINT fk_informacion_acta FOREIGN KEY (idActa) REFERENCES acta(idActa) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE ruegosPreguntasActa (
  idPreguntaActa SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  idActa SMALLINT UNSIGNED NOT NULL,
  ruegosPregunta VARCHAR(250) NOT NULL,
  PRIMARY KEY (idPreguntaActa),
  CONSTRAINT fk_ruegos_preguntas_acta FOREIGN KEY (idActa) REFERENCES acta(idActa)
);