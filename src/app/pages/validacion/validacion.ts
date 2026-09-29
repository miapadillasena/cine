import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ValidacionService } from '../../services/validacion';
import { CandyService } from '../../services/candy';
import { LogsService } from '../../services/logs';

@Component({
  selector: 'app-validacion',
  imports: [FormsModule, DatePipe],
  templateUrl: './validacion.html',
  styleUrl: './validacion.css'
})
export class Validacion implements OnInit {
  private validacionService = inject(ValidacionService);
  private candyService = inject(CandyService);
  private logsService = inject(LogsService);

  codigo = signal('');
  compra = signal<any>(null);
  canje = signal<any>(null);
  mensaje = signal('');
  productos = signal<any[]>([]);
  combos = signal<any[]>([]);

  async ngOnInit() {
    this.productos.set(await this.candyService.obtenerProductos());
    this.combos.set(await this.candyService.obtenerCombos());
  }

  async buscar() {
    this.compra.set(null);
    this.canje.set(null);
    this.mensaje.set('');

    const codigo = this.codigo().trim().toUpperCase();
    if (codigo === '') {
      this.mensaje.set('Ingresá un código.');
      return;
    }

    if (codigo.startsWith('C-')) {
      const canje = await this.validacionService.buscarCanje(codigo);
      if (canje) {
        this.canje.set(canje);
      } else {
        this.mensaje.set('No se encontró ningún canje con ese código.');
      }
    } else {
      const compra = await this.validacionService.buscarCompra(codigo);
      if (compra) {
        this.compra.set(compra);
      } else {
        this.mensaje.set('No se encontró ninguna compra con ese código.');
      }
    }
  }

  nombreItem(item: any) {
    if (item.combo_id) {
      const combo = this.combos().find(c => c.id === item.combo_id);
      return combo ? combo.nombre : 'Combo';
    }
    const producto = this.productos().find(p => p.id === item.producto_id);
    return producto ? producto.nombre : 'Producto';
  }

  async validarEntrada() {
    const error = await this.validacionService.validarEntrada(this.compra().id);
    if (error) {
      this.mensaje.set('No se pudo validar la entrada.');
      return;
    }
    await this.logsService.registrar('Validó la entrada de la compra ' + this.compra().codigo);
    this.compra.set(await this.validacionService.buscarCompra(this.compra().codigo));
    this.mensaje.set('Entrada validada.');
  }

  async entregarCandy() {
    const error = await this.validacionService.entregarCandy(this.compra().id);
    if (error) {
      this.mensaje.set('No se pudo marcar el candy como entregado.');
      return;
    }
    await this.logsService.registrar('Entregó el candy de la compra ' + this.compra().codigo);
    this.compra.set(await this.validacionService.buscarCompra(this.compra().codigo));
    this.mensaje.set('Candy entregado.');
  }

  async entregarCanje() {
    const error = await this.validacionService.marcarCanjeUsado(this.canje().id);
    if (error) {
      this.mensaje.set('No se pudo marcar el canje como entregado.');
      return;
    }
    await this.logsService.registrar('Entregó el canje ' + this.canje().codigo);
    this.canje.set(await this.validacionService.buscarCanje(this.canje().codigo));
    this.mensaje.set('Premio entregado.');
  }
}