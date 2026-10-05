import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ReportesService } from '../../../services/reportes';
import { CandyService } from '../../../services/candy';
import { jsPDF } from 'jspdf'; 


@Component({
  selector: 'app-reportes',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  compras = signal<any[]>([]);
  entradas = signal<any[]>([]);
  ventasCandy = signal<any[]>([]);
  productos = signal<any[]>([]);
  combos = signal<any[]>([]);
  logs = signal<any[]>([]);
  dias = signal(7);
  periodoPeliculas = signal(7);

  facturacion = computed(() => {
    const desde = Date.now() - this.dias() * 24 * 60 * 60000;
    const porDia: any = {};

    for (const compra of this.compras()) {
      const fecha = new Date(compra.created_at);
      if (fecha.getTime() < desde) continue;

      const clave = this.claveDia(fecha);
      if (!porDia[clave]) {
        porDia[clave] = { fecha: clave, compras: 0, entradas: 0, total: 0 };
      }
      porDia[clave].compras++;
      porDia[clave].entradas += (compra.butacas || []).length;
      porDia[clave].total += Number(compra.total);
    }

    return (Object.values(porDia) as any[]).sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  totales = computed(() => {
    let compras = 0;
    let entradas = 0;
    let total = 0;
    for (const dia of this.facturacion()) {
      compras += dia.compras;
      entradas += dia.entradas;
      total += dia.total;
    }
    return { compras: compras, entradas: entradas, total: total };
  });

  peliculasMasVistas = computed(() => {
    const desde = Date.now() - this.periodoPeliculas() * 24 * 60 * 60000;
    const conteo: any = {};

    for (const entrada of this.entradas()) {
      if (!entrada.compras) continue;
      if (new Date(entrada.compras.created_at).getTime() < desde) continue;

      const nombre = entrada.funciones.peliculas.nombre;
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    }

    return Object.keys(conteo)
      .map(nombre => ({ nombre: nombre, cantidad: conteo[nombre] }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  maximoPeliculas = computed(() => {
    const lista = this.peliculasMasVistas();
    return lista.length > 0 ? lista[0].cantidad : 1;
  });

  productosMasVendidos = computed(() => {
    const conteo: any = {};

    for (const venta of this.ventasCandy()) {
      if (!venta.compras || venta.compras.estado !== 'pagada') continue;

      if (venta.producto_id) {
        conteo[venta.producto_id] = (conteo[venta.producto_id] || 0) + venta.cantidad;
      } else {
        const combo = this.combos().find(c => c.id === venta.combo_id);
        if (combo) {
          conteo[combo.pochoclo_id] = (conteo[combo.pochoclo_id] || 0) + venta.cantidad;
          conteo[combo.bebida_id] = (conteo[combo.bebida_id] || 0) + venta.cantidad;
        }
      }
    }

    return this.productos()
      .map(p => ({ nombre: p.nombre, cantidad: conteo[p.id] || 0 }))
      .filter(p => p.cantidad > 0)
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  maximoProductos = computed(() => {
    const lista = this.productosMasVendidos();
    return lista.length > 0 ? lista[0].cantidad : 1;
  });

  constructor(private reportesService: ReportesService, private candyService: CandyService) {}

  async ngOnInit() {
    this.compras.set(await this.reportesService.obtenerCompras());
    this.entradas.set(await this.reportesService.obtenerEntradas());
    this.ventasCandy.set(await this.reportesService.obtenerVentasCandy());
    this.productos.set(await this.candyService.obtenerProductos());
    this.combos.set(await this.candyService.obtenerCombos());
    this.logs.set(await this.reportesService.obtenerLogs());
  }

  claveDia(fecha: Date) {
    return fecha.getFullYear() + '-' + String(fecha.getMonth() + 1).padStart(2, '0') + '-' + String(fecha.getDate()).padStart(2, '0');
  }

    fechaTexto(clave: string) {
    const partes = clave.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  exportarPdf() {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.text('CINE. - Reporte', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text('Generado el ' + this.fechaTexto(this.claveDia(new Date())), 20, y);
    y += 14;

    doc.setFontSize(14);
    doc.text('Facturación (últimos ' + this.dias() + ' días)', 20, y);
    y += 8;
    doc.setFontSize(11);
    doc.text('Facturado: $' + this.totales().total, 20, y);
    doc.text('Entradas: ' + this.totales().entradas, 90, y);
    doc.text('Compras: ' + this.totales().compras, 150, y);
    y += 10;

    doc.text('Día', 20, y);
    doc.text('Compras', 70, y);
    doc.text('Entradas', 110, y);
    doc.text('Facturado', 150, y);
    y += 2;
    doc.line(20, y, 190, y);
    y += 6;

    for (const dia of this.facturacion()) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(this.fechaTexto(dia.fecha), 20, y);
      doc.text(String(dia.compras), 70, y);
      doc.text(String(dia.entradas), 110, y);
      doc.text('$' + dia.total, 150, y);
      y += 7;
    }
    if (this.facturacion().length === 0) {
      doc.text('No hay ventas en este período.', 20, y);
      y += 7;
    }

    y += 8;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text('Películas más vistas (' + (this.periodoPeliculas() === 7 ? 'última semana' : 'último mes') + ')', 20, y);
    y += 8;
    doc.setFontSize(11);

    const peliculas = this.peliculasMasVistas();
    for (let i = 0; i < peliculas.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text((i + 1) + '. ' + peliculas[i].nombre, 20, y);
      doc.text(peliculas[i].cantidad + ' entradas', 150, y);
      y += 7;
    }
    if (peliculas.length === 0) {
      doc.text('Sin entradas vendidas en este período.', 20, y);
      y += 7;
    }

    y += 8;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text('Productos más vendidos', 20, y);
    y += 8;
    doc.setFontSize(11);

    const productos = this.productosMasVendidos();
    for (let i = 0; i < productos.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text((i + 1) + '. ' + productos[i].nombre, 20, y);
      doc.text(productos[i].cantidad + ' unidades', 150, y);
      y += 7;
    }
    if (productos.length === 0) {
      doc.text('Todavía no se vendieron productos.', 20, y);
    }

    doc.save('reporte-' + this.claveDia(new Date()) + '.pdf');
  }
}