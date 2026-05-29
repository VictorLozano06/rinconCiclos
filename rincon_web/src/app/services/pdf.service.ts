import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActaHistorial } from './actas.service';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generarActaPdf(acta: ActaHistorial): void {
    const doc = new jsPDF();
    
    // Título Principal
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Acta Oficial - Convocatoria #${acta.idConvocatoria}`, 14, 20);

    // Metadatos
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de la reunión: ${acta.fechaConvocatoria} a las ${acta.horaConvocatoria}h`, 14, 30);
    doc.text(`Lugar: ${acta.lugar}`, 14, 36);
    doc.text(`Curso Académico: ${acta.anioInicio}/${acta.anioFin}`, 14, 42);
    doc.text(`Asistencia: ${acta.asistentes} de ${acta.totalConvocados} convocados`, 14, 48);

    // Listas de Asistencia
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Asistentes", 14, 60);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPos = 66;
    acta.listaAsistentes.forEach(asistente => {
      doc.text(`• ${asistente}`, 14, yPos);
      yPos += 5;
    });

    if (acta.listaAusentes.length > 0) {
      yPos += 5;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Ausentes", 14, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      acta.listaAusentes.forEach(ausente => {
        doc.text(`• ${ausente}`, 14, yPos);
        yPos += 5;
      });
    }

    // Orden del día / Información
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. Desarrollo de la Reunión y Acuerdos", 14, yPos);
    yPos += 8;

    const tableData = acta.informacion.map(info => [
      info.numInformacion.toString(),
      info.titulo_OrdenDia,
      info.informacion
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Punto', 'Acuerdos / Desarrollo']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 'auto' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Ruegos y Preguntas
    if (acta.ruegosPregunta && acta.ruegosPregunta.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("3. Ruegos y Preguntas", 14, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      acta.ruegosPregunta.forEach(ruego => {
        const lines = doc.splitTextToSize(`• ${ruego}`, 180);
        doc.text(lines, 14, yPos);
        yPos += (lines.length * 5) + 2;
      });
    }

    // Firmas
    yPos += 20;
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Firmado:", 14, yPos);
    
    doc.setFont("helvetica", "bold");
    doc.text("Redacta el Acta:", 14, yPos + 10);
    doc.setFont("helvetica", "normal");
    doc.text(acta.nombreRedacta || 'No especificado', 14, yPos + 15);

    doc.setFont("helvetica", "bold");
    doc.text("Convoca / Vº Bº:", 100, yPos + 10);
    doc.setFont("helvetica", "normal");
    doc.text(acta.nombreConvoca || 'No especificado', 100, yPos + 15);

    // Pie de página con fecha de cierre
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Acta cerrada oficialmente el ${acta.fecha} - Página ${i} de ${pageCount}`, 14, 290);
    }

    // Guardar el documento
    doc.save(`Acta_${acta.idConvocatoria}_${acta.fecha.replace(/\//g, '-')}.pdf`);
  }
}
