import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActaHistorial } from './actas.service';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generarActaWord(acta: ActaHistorial): void {
    const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Acta Oficial</title>
    <style>
      body { font-family: 'Arial', sans-serif; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; }
      th { background-color: #2980b9; color: white; }
    </style>
    </head><body>
      <h1 style="text-align: center;">Acta de la reunión del equipo docente del grupo ${acta.grupoNombre}</h1>
      <h3 style="text-align: center; color: #555;">Convocatoria #${acta.idConvocatoria}</h3>
      <hr>
      <p><b>Fecha de la reunión:</b> ${acta.fechaConvocatoria} de ${acta.horaConvocatoria}h a ${acta.horaFin}h</p>
      <p><b>Lugar:</b> ${acta.lugar}</p>
      <p><b>Curso Académico:</b> ${acta.anioInicio}/${acta.anioFin}</p>
      <p><b>Asistencia:</b> ${acta.asistentes} de ${acta.totalConvocados} convocados</p>
      
      <h3>1. Asistentes</h3>
      <ul>
        ${acta.listaAsistentes.map(a => `<li>${a}</li>`).join('')}
      </ul>
      ${acta.listaAusentes.length > 0 ? `<h4>Ausentes</h4><ul>${acta.listaAusentes.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
      
      <h3>2. Desarrollo de la Reunión y Acuerdos</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%">#</th>
            <th style="width: 30%">Punto</th>
            <th style="width: 65%">Acuerdos / Desarrollo</th>
          </tr>
        </thead>
        <tbody>
          ${acta.informacion.map(info => `
            <tr>
              <td>${info.numInformacion}</td>
              <td>${info.titulo_OrdenDia}</td>
              <td>${info.informacion}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${acta.ruegosPregunta && acta.ruegosPregunta.length > 0 ? `
        <h3>3. Ruegos y Preguntas</h3>
        <ul>
          ${acta.ruegosPregunta.map(r => `<li>${r}</li>`).join('')}
        </ul>
      ` : ''}
      
      <br><br><br>
      <table style="border: none;">
        <tr style="border: none;">
          <td style="border: none;"><b>Redacta el Acta:</b><br>${acta.nombreRedacta || 'No especificado'}</td>
          <td style="border: none;"><b>Convoca / Vº Bº:</b><br>${acta.nombreConvoca || 'No especificado'}</td>
        </tr>
      </table>
      <br>
      <p style="color: gray; font-size: 10px; text-align: center;">Acta cerrada oficialmente el ${acta.fecha}</p>
    </body></html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Acta_${acta.idConvocatoria}_${acta.fecha.replace(/\//g, '-')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
