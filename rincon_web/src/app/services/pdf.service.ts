import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActaHistorial } from './actas.service';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() {}

  generarPdfActa(acta: ActaHistorial): void {
    const doc = new jsPDF();
    
    // Preparar strings
    const strAsistentes = (acta.listaAsistentes && acta.listaAsistentes.length > 0) 
      ? acta.listaAsistentes.join('\n') 
      : 'Sin asistentes';

    const strAusentes = (acta.listaAusentes && acta.listaAusentes.length > 0) 
      ? acta.listaAusentes.join('\n') 
      : 'Ninguno';

    // Construimos la lista de asuntos tratados
    let strOrdenDia = '';
    acta.informacion.forEach(info => {
      strOrdenDia += `• ${info.titulo_OrdenDia}\n`;
    });
    if (acta.ruegosPregunta && acta.ruegosPregunta.length > 0) {
      strOrdenDia += `• Ruegos y preguntas.\n`;
    }
    strOrdenDia = strOrdenDia.trim();

    // Filas del cuerpo
    const bodyRows: any[] = [];

    // Fila 0
    bodyRows.push([
      { 
        content: 'ACTA DE LA REUNIÓN\nEQUIPO PEDAGÓGICO DE CICLOS FORMATIVOS', 
        colSpan: 4, 
        styles: { halign: 'center', fontStyle: 'bold', fontSize: 11, fillColor: [255, 255, 255], textColor: 0 } 
      }
    ]);

    // Fila 1: Grupo
    bodyRows.push([
      { content: 'GRUPO:', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
      { content: `Coordinación Pedagógica CICLOS FORMATIVOS - Curso ${acta.anioInicio}/${acta.anioFin}`, colSpan: 3, styles: { fontStyle: 'bold' } }
    ]);

    // Fila 2: Día y Hora
    bodyRows.push([
      { content: 'DÍA Y\nHORA:', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
      { content: `${acta.fechaConvocatoria} a las ${acta.horaConvocatoria} h`, colSpan: 3 }
    ]);

    // Fila 3: Lugar
    bodyRows.push([
      { content: 'LUGAR:', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
      { content: `${acta.lugar}`, colSpan: 3, styles: { fontStyle: 'bold' } }
    ]);

    // Fila 4: Cabeceras Asistentes / Convoca
    bodyRows.push([
      { content: 'ASISTENTES', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } },
      { content: 'CONVOCA', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } }
    ]);

    // Fila 5: Nombres Asistentes / Convoca
    bodyRows.push([
      { content: strAsistentes, colSpan: 2 },
      { content: acta.nombreConvoca || 'Coordinación', colSpan: 2 }
    ]);

    // Fila 6: Cabeceras Ausentes / Realiza el Acta
    bodyRows.push([
      { content: 'AUSENTES', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } },
      { content: 'REALIZA EL ACTA', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } }
    ]);

    // Fila 7: Nombres Ausentes / Realiza el Acta
    bodyRows.push([
      { content: strAusentes, colSpan: 2 },
      { content: acta.nombreRedacta || 'Coordinación', colSpan: 2 }
    ]);

    // Fila 8: Cabecera ORDEN DEL DÍA
    bodyRows.push([
      { content: 'ORDEN DEL DÍA', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } }
    ]);

    // Fila 9: Lista orden del día
    bodyRows.push([
      { content: strOrdenDia, colSpan: 4 }
    ]);

    // Fila 10: Cabecera ACTA DE LA REUNIÓN
    bodyRows.push([
      { content: 'ACTA DE LA REUNIÓN', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } }
    ]);

    // Recorremos los acuerdos para listarlos
    acta.informacion.forEach(info => {
      const texto = `${info.titulo_OrdenDia}\n${info.informacion.trim() || 'Sin información registrada.'}`;
      bodyRows.push([
        { content: texto, colSpan: 4 }
      ]);
    });

    // Ruegos y preguntas
    if (acta.ruegosPregunta && acta.ruegosPregunta.length > 0) {
      // Cabecera Ruegos
      bodyRows.push([
        { content: 'Ruegos y preguntas', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [255, 255, 255] } }
      ]);
      const strRuegos = acta.ruegosPregunta.map(r => `- ${r}`).join('\n');
      bodyRows.push([
        { content: strRuegos, colSpan: 4 }
      ]);
    }

    // Dibujar la tabla
    autoTable(doc, {
      startY: 15,
      body: bodyRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 65 },
        2: { cellWidth: 25 },
        3: { cellWidth: 65 }
      },
      // FIXME: Estilos de la tabla y formato de celdas. Pendiente revisar renderizado de negritas si falla.
      didDrawCell: (data) => {
      }
    });

    // Guardar PDF
    doc.save(`Acta_${acta.idConvocatoria}_${acta.fecha.replace(/\//g, '-')}.pdf`);
  }
}
