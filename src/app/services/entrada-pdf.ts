import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

@Injectable({
  providedIn: 'root'
})
export class EntradaPdfService {

  async generarQr(codigo: string) {
    return await QRCode.toDataURL(codigo);
  }

  async descargar(datos: any) {
    const qr = await this.generarQr(datos.codigo);
    const doc = new jsPDF();

    doc.setFontSize(24);
    doc.text('CINE.', 20, 25);
    doc.setFontSize(12);
    doc.text('Entrada digital', 20, 33);
    doc.line(20, 38, 190, 38);

    doc.setFontSize(18);
    doc.text(datos.pelicula, 20, 52);

    doc.setFontSize(12);
    doc.text('Sala: ' + datos.sala, 20, 64);
    doc.text('Función: ' + this.formatearFecha(new Date(datos.inicio)), 20, 72);
    doc.text('Butacas: ' + datos.butacas.map((b: any) => b.fila + b.numero).join(', '), 20, 80);
    doc.text('Total pagado: $' + datos.total, 20, 88);

    if (datos.tieneCandy) {
      doc.text('Incluye candy: retiralo en el mostrador con este código.', 20, 96);
    }

    doc.addImage(qr, 'PNG', 65, 110, 80, 80);

    doc.setFontSize(16);
    doc.text('Código: ' + datos.codigo, 105, 200, { align: 'center' });

    doc.save('entrada-' + datos.codigo + '.pdf');
  }

  private formatearFecha(fecha: Date) {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    return dia + '/' + mes + '/' + anio + ' ' + hora + ':' + minutos;
  }
}