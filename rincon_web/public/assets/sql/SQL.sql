-- participantes

CREATE TABLE participantes (
    idParticipante SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(150)      NOT NULL,
    CONSTRAINT PK_participantes PRIMARY KEY (idParticipante)
);

-- grupo  (jerarquia de participantes)

CREATE TABLE grupo (
    idGrupo SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    CONSTRAINT PK_grupo PRIMARY KEY (idGrupo),
    CONSTRAINT FK_grupoParticipante FOREIGN KEY (idGrupo) REFERENCES participantes (idParticipante)
); 

-- profesor  (jerarquia de participantes)

CREATE TABLE profesor (
    idProfesor SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    CONSTRAINT PK_profesor PRIMARY KEY (idProfesor),
    CONSTRAINT FK_profesorParticipante FOREIGN KEY (idProfesor) REFERENCES participantes (idParticipante)
); 

-- lugar

CREATE TABLE lugar (
    idLugar SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre  VARCHAR(150)      NOT NULL,
    CONSTRAINT PK_lugar PRIMARY KEY (idLugar)
); 

-- cursoAcademico

CREATE TABLE cursoAcademico (
    idCurso   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    anioInicio YEAR               NOT NULL,
    anioFin    YEAR               NOT NULL,
    CONSTRAINT PK_cursoAcademico PRIMARY KEY (idCurso)
); 

-- cicloFormativo

CREATE TABLE cicloFormativo (
    idCiclo SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre  VARCHAR(150)      NOT NULL,
    familia VARCHAR(150)      NOT NULL,
    CONSTRAINT PK_cicloFormativo PRIMARY KEY (idCiclo)
); 


-- categoria

CREATE TABLE categoria (
    idCategoria      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre           VARCHAR(150)      NOT NULL,
    predeterminada   BIT(1)            NOT NULL DEFAULT 0,
    idCategoriaPadre SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_categoria PRIMARY KEY (idCategoria),
    CONSTRAINT FK_categoria_padre FOREIGN KEY (idCategoriaPadre)
        REFERENCES categoria (idCategoria)
); 

-- recurso

CREATE TABLE recurso (
    idCategoria      SMALLINT UNSIGNED NOT NULL,
    numRecurso       SMALLINT UNSIGNED NOT NULL,
    nombre           VARCHAR(100)      NOT NULL,
    descripcion      VARCHAR(250),
    fechaPublicacion DATE              NOT NULL,
    idCurso          SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_recurso PRIMARY KEY (idCategoria, numRecurso),
    CONSTRAINT FK_recurso_categoria FOREIGN KEY (idCategoria)
        REFERENCES categoria (idCategoria),
    CONSTRAINT FK_recurso_curso FOREIGN KEY (idCurso)
        REFERENCES cursoAcademico (idCurso)
); 

-- recursoUrl

CREATE TABLE recursoUrl (
    idCategoria SMALLINT UNSIGNED NOT NULL,
    numRecurso  SMALLINT UNSIGNED NOT NULL,
    url         VARCHAR(500)      NOT NULL,
    CONSTRAINT PK_recursoUrl PRIMARY KEY (idCategoria, numRecurso, url),
    CONSTRAINT FK_recursoUrl_recurso FOREIGN KEY (idCategoria, numRecurso)
        REFERENCES recurso (idCategoria, numRecurso)
); 


-- recursoArchivo

CREATE TABLE recursoArchivo (
    idCategoria SMALLINT UNSIGNED NOT NULL,
    numRecurso  SMALLINT UNSIGNED NOT NULL,
    archivo     VARCHAR(500)      NOT NULL,
    CONSTRAINT PK_recursoArchivo PRIMARY KEY (idCategoria, numRecurso, archivo),
    CONSTRAINT FK_recursoArchivo_recurso FOREIGN KEY (idCategoria, numRecurso)
        REFERENCES recurso (idCategoria, numRecurso)
); 

-- cicloRecurso

CREATE TABLE cicloRecurso (
    idCiclo     SMALLINT UNSIGNED NOT NULL,
    idCategoria SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_cicloRecurso PRIMARY KEY (idCiclo, idCategoria),
    CONSTRAINT FK_cicloRecurso_ciclo FOREIGN KEY (idCiclo)
        REFERENCES cicloFormativo (idCiclo),
    CONSTRAINT FK_cicloRecurso_recurso FOREIGN KEY (idCategoria)
        REFERENCES categoria (idCategoria)
); 

-- convocatoria

CREATE TABLE convocatoria (
    idConvocatoria        SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    fecha                 DATETIME          NOT NULL,
    idLugar               SMALLINT UNSIGNED NOT NULL,
    idCurso               SMALLINT UNSIGNED NOT NULL,
    idProfesorRedactaActa   SMALLINT UNSIGNED NOT NULL,
    idProfesorIniciaReunion SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_convocatoria PRIMARY KEY (idConvocatoria),
    CONSTRAINT FK_convocatoria_lugar FOREIGN KEY (idLugar)
        REFERENCES lugar (idLugar),
    CONSTRAINT FK_convocatoria_curso FOREIGN KEY (idCurso)
        REFERENCES cursoAcademico (idCurso),
    CONSTRAINT FK_convocatoria_redacta FOREIGN KEY (idProfesorRedactaActa)
        REFERENCES profesor (idProfesor),
    CONSTRAINT FK_convocatoria_inicia FOREIGN KEY (idProfesorIniciaReunion)
        REFERENCES profesor (idProfesor)
); 

-- participanteParticipa

CREATE TABLE participanteParticipa (
    idConvocatoria        SMALLINT UNSIGNED NOT NULL,
    numOrden              SMALLINT UNSIGNED NOT NULL,
    idParticipanteParticipa SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_participanteParticipa PRIMARY KEY (idConvocatoria, numOrden, idParticipanteParticipa),
    CONSTRAINT FK_partParticipa_conv FOREIGN KEY (idConvocatoria)
        REFERENCES convocatoria (idConvocatoria),
    CONSTRAINT FK_partParticipa_part FOREIGN KEY (idParticipanteParticipa)
        REFERENCES participantes (idParticipante)
); 

-- ordenDia

CREATE TABLE ordenDia (
    idConvocatoria    SMALLINT UNSIGNED NOT NULL,
    numOrden          SMALLINT UNSIGNED NOT NULL,
    minutos           SMALLINT UNSIGNED,
    descripcion       VARCHAR(250),
    objetivo          VARCHAR(250)      NOT NULL,
    idLugar           SMALLINT UNSIGNED NOT NULL,
    idProfesorDinamiza SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_ordenDia PRIMARY KEY (idConvocatoria, numOrden),
    CONSTRAINT FK_ordenDia_conv FOREIGN KEY (idConvocatoria)
        REFERENCES convocatoria (idConvocatoria),
    CONSTRAINT FK_ordenDia_lugar FOREIGN KEY (idLugar)
        REFERENCES lugar (idLugar),
    CONSTRAINT FK_ordenDia_profesor FOREIGN KEY (idProfesorDinamiza)
        REFERENCES profesor (idProfesor)
); 


-- bocc

CREATE TABLE bocc (
    idBocc SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    fecha  DATE              NOT NULL,
    CONSTRAINT PK_bocc PRIMARY KEY (idBocc)
); 

-- apartadoBocc

CREATE TABLE apartadoBocc (
    idBocc      SMALLINT UNSIGNED NOT NULL,
    numApartado SMALLINT UNSIGNED NOT NULL,
    titulo      VARCHAR(255)      NOT NULL,
    informacion VARCHAR(250)      NOT NULL,
    CONSTRAINT PK_apartadoBocc PRIMARY KEY (idBocc, numApartado),
    CONSTRAINT FK_apartadoBocc_bocc FOREIGN KEY (idBocc)
        REFERENCES bocc (idBocc)
);


-- ruegosPreguntasBocc

CREATE TABLE ruegosPreguntasBocc (
    idBocc          SMALLINT UNSIGNED NOT NULL,
    ruegosPreguntas VARCHAR(250)      NOT NULL,
    CONSTRAINT PK_ruegosPregBocc PRIMARY KEY (idBocc, ruegosPreguntas(100)),
    CONSTRAINT FK_ruegosPregBocc_bocc FOREIGN KEY (idBocc)
        REFERENCES bocc (idBocc)
); 


-- boccDirigido

CREATE TABLE boccDirigido (
    idBoccDirigido SMALLINT UNSIGNED NOT NULL,
    idParticipante SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_boccDirigido PRIMARY KEY (idBoccDirigido, idParticipante),
    CONSTRAINT FK_boccDirigido_bocc FOREIGN KEY (idBoccDirigido)
        REFERENCES bocc (idBocc),
    CONSTRAINT FK_boccDirigido_part FOREIGN KEY (idParticipante)
        REFERENCES participantes (idParticipante)
); 


-- acta

CREATE TABLE acta (
    idActa         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    fecha          DATE              NOT NULL,
    idConvocatoria SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_acta PRIMARY KEY (idActa),
    CONSTRAINT FK_acta_conv FOREIGN KEY (idConvocatoria)
        REFERENCES convocatoria (idConvocatoria)
); 


-- profesor_asiste

CREATE TABLE profesor_asiste (
    idProfesor SMALLINT UNSIGNED NOT NULL,
    idActa     SMALLINT UNSIGNED NOT NULL,
    CONSTRAINT PK_profesor_asiste PRIMARY KEY (idProfesor, idActa),
    CONSTRAINT FK_profAsiste_prof FOREIGN KEY (idProfesor)
        REFERENCES profesor (idProfesor),
    CONSTRAINT FK_profAsiste_acta FOREIGN KEY (idActa)
        REFERENCES acta (idActa)
); 

-- informacion

CREATE TABLE informacion (
    idActa         SMALLINT UNSIGNED NOT NULL,
    numInformacion SMALLINT UNSIGNED NOT NULL,
    titulo_OrdenDia VARCHAR(255)      NOT NULL,
    informacion    VARCHAR(250),
    CONSTRAINT PK_informacion PRIMARY KEY (idActa, numInformacion),
    CONSTRAINT FK_informacion_acta FOREIGN KEY (idActa)
        REFERENCES acta (idActa)
); 


-- ruegosPreguntasActa

CREATE TABLE ruegosPreguntasActa (
    idPreguntaActa SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    idActa         SMALLINT UNSIGNED NOT NULL,
    ruegoPregunta  VARCHAR(250)      NOT NULL,
    CONSTRAINT PK_ruegosPregActa PRIMARY KEY (idPreguntaActa),
    CONSTRAINT FK_ruegosPregActa_acta FOREIGN KEY (idActa)
        REFERENCES acta (idActa)
);

-- ====================================================
-- INSERTS DE PRUEBA Y CONFIGURACIÓN INICIAL
-- ====================================================

-- 1. Insertar participantes (Profesores)
INSERT INTO participantes (idParticipante, nombre) VALUES 
(1, 'Alejandro G.'), 
(2, 'Beatriz M. (Coordinadora)');

-- 2. Insertar profesores
INSERT INTO profesor (idProfesor) VALUES 
(1), 
(2);

-- 3. Insertar lugares
INSERT INTO lugar (idLugar, nombre) VALUES 
(1, 'Aula 101'), 
(2, 'Sala de Juntas'), 
(3, 'Salón de Actos');

-- 4. Insertar curso académico
INSERT INTO cursoAcademico (idCurso, anioInicio, anioFin) VALUES 
(1, 2025, 2026);

-- 5. Insertar ciclos formativos
INSERT INTO cicloFormativo (idCiclo, nombre, familia) VALUES 
(1, 'Desarrollo de Aplicaciones Web (DAW)', 'Informática y Comunicaciones'), 
(2, 'Desarrollo de Aplicaciones Multiplataforma (DAM)', 'Informática y Comunicaciones');

-- 6. Insertar categorías y subcategorías jerárquicas
SET FOREIGN_KEY_CHECKS = 0;

-- Categoría Raíz (id: 1, se apunta a sí misma debido al NOT NULL y FK check)
INSERT INTO categoria (idCategoria, nombre, predeterminada, idCategoriaPadre) VALUES 
(1, 'Raiz', 1, 1);

-- Categorías Principales (padre: 1)
INSERT INTO categoria (idCategoria, nombre, predeterminada, idCategoriaPadre) VALUES 
(2, 'Inicio', 1, 1),
(3, 'Reuniones de Equipo', 1, 1),
(4, 'Tutorías', 1, 1),
(5, 'Evaluaciones', 1, 1),
(6, 'Otros', 1, 1);

-- Subcategorías de Reuniones de Equipo (padre: 3)
INSERT INTO categoria (idCategoria, nombre, predeterminada, idCategoriaPadre) VALUES 
(7, 'Convocatorias', 1, 3),
(8, 'Actas', 1, 3),
(9, 'BOCC', 1, 3),
(10, 'Calendario de reuniones', 1, 3);

-- Subcategorías de Tutorías (padre: 4)
INSERT INTO categoria (idCategoria, nombre, predeterminada, idCategoriaPadre) VALUES 
(11, '1º CCFF', 1, 4),
(12, '2º CCFF', 1, 4),
(13, 'PAT', 1, 4),
(14, 'Individualizadas', 1, 4);

-- Subcategorías de Evaluaciones (padre: 5)
INSERT INTO categoria (idCategoria, nombre, predeterminada, idCategoriaPadre) VALUES 
(15, 'Equipo Educativo', 1, 5),
(16, '1ª Evaluación', 1, 5),
(17, '2ª Evaluación', 1, 5),
(18, 'Extraordinaria', 1, 5);

-- Subcategorías de Otros (padre: 6)
INSERT INTO categoria (idCategoria, nombre, predeterminada, idCategoriaPadre) VALUES 
(19, 'DUAL', 1, 6),
(20, 'Semanas Especiales', 1, 6),
(21, 'Enlaces PAU', 1, 6);

SET FOREIGN_KEY_CHECKS = 1;
