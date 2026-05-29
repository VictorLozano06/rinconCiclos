ALTER TABLE convocatoria
  DROP FOREIGN KEY fk_convocatoria_profesor_redacta,
  DROP FOREIGN KEY fk_convocatoria_profesor_inicia,
  MODIFY idProfesorRedactaActa INT UNSIGNED NOT NULL,
  MODIFY idProfesorIniciaReunion INT UNSIGNED NULL;

ALTER TABLE ordenDia
  DROP FOREIGN KEY fk_orden_dia_profesor,
  MODIFY idProfesorDinamiza INT UNSIGNED NOT NULL;

ALTER TABLE participanteParticipa
  DROP FOREIGN KEY fk_participante_participa_participante;

ALTER TABLE participanteParticipa
  ADD COLUMN tipoParticipante ENUM('profesor', 'grupo') NULL AFTER idParticipanteParticipa,
  MODIFY idParticipanteParticipa INT UNSIGNED NOT NULL;

UPDATE participanteParticipa pp
LEFT JOIN profesor p ON p.idProfesor = pp.idParticipanteParticipa
SET pp.tipoParticipante = 'profesor'
WHERE p.idProfesor IS NOT NULL;

UPDATE participanteParticipa pp
LEFT JOIN grupo g ON g.idGrupo = pp.idParticipanteParticipa
SET pp.tipoParticipante = 'grupo'
WHERE g.idGrupo IS NOT NULL
  AND pp.tipoParticipante IS NULL;

ALTER TABLE participanteParticipa
  MODIFY tipoParticipante ENUM('profesor', 'grupo') NOT NULL,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (idConvocatoria, numOrden, tipoParticipante, idParticipanteParticipa),
  ADD INDEX idx_participante_tipo_id (tipoParticipante, idParticipanteParticipa);
