import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ReportesService } from '../../../services/reportes';
import { CandyService } from '../../../services/candy';

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
}