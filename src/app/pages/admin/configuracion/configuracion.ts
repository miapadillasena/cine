import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ConfiguracionService } from '../../../services/configuracion';
import { ComprasService } from '../../../services/compras';
import { CandyService } from '../../../services/candy';
import { LogsService } from '../../../services/logs';

@Component({
  selector: 'app-configuracion',
  imports: [ReactiveFormsModule, FormsModule , DatePipe],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class Configuracion implements OnInit {
  formConfig: FormGroup;
  formCupon: FormGroup;
  formRecompensa: FormGroup;
  configActual: any = null;
  cupones = signal<any[]>([]);
  recompensas = signal<any[]>([]);
  productos = signal<any[]>([]);
  salas = signal<any[]>([]);
  nuevaSala = signal('');
  mensaje = signal('');
  error = signal('');

  constructor(
    private fb: FormBuilder,
    private configuracionService: ConfiguracionService,
    private comprasService: ComprasService,
    private candyService: CandyService,
    private logsService: LogsService
  ) {
    this.formConfig = this.fb.group({
      porcentaje_primera_compra: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      recargo_vip: ['', [Validators.required, Validators.min(0)]]
    });

    this.formCupon = this.fb.group({
      codigo: ['', Validators.required],
      porcentaje: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      vigente_hasta: ['', Validators.pattern('^[0-9]{2}/[0-9]{2}/[0-9]{4}$')]
    });

    this.formRecompensa = this.fb.group({
      nombre: ['', Validators.required],
      puntos: ['', [Validators.required, Validators.min(1)]],
      producto_id: ['']
    });
  }

  async ngOnInit() {
    this.configActual = await this.comprasService.obtenerConfiguracion();
    this.formConfig.patchValue(this.configActual);
    this.productos.set(await this.candyService.obtenerProductos());
    await this.cargarListas();
  }

  async cargarListas() {
    this.cupones.set(await this.configuracionService.obtenerCupones());
    this.recompensas.set(await this.configuracionService.obtenerRecompensas());
    this.salas.set(await this.configuracionService.obtenerSalas());
  }

  limpiarMensajes() {
    this.mensaje.set('');
    this.error.set('');
  }

  async guardarConfiguracion() {
    this.limpiarMensajes();
    const valores = this.formConfig.value;

    const { error } = await this.configuracionService.guardarConfiguracion({
      porcentaje_primera_compra: valores.porcentaje_primera_compra,
      recargo_vip: valores.recargo_vip
    });

    if (error) {
      this.error.set('No se pudo guardar la configuración.');
      return;
    }

    if (Number(valores.porcentaje_primera_compra) !== Number(this.configActual.porcentaje_primera_compra)) {
      await this.logsService.registrar(
        'Cambió el descuento de primera compra de ' + this.configActual.porcentaje_primera_compra + '% a ' + valores.porcentaje_primera_compra + '%'
      );
    }
    if (Number(valores.recargo_vip) !== Number(this.configActual.recargo_vip)) {
      await this.logsService.registrar(
        'Cambió el recargo VIP de $' + this.configActual.recargo_vip + ' a $' + valores.recargo_vip
      );
    }

    this.configActual = { ...valores };
    this.mensaje.set('Configuración guardada.');
  }

  async crearCupon() {
    this.limpiarMensajes();
    const valores = this.formCupon.value;

    let vigencia = null;
    if (valores.vigente_hasta) {
      const partes = valores.vigente_hasta.split('/');
      vigencia = partes[2] + '-' + partes[1] + '-' + partes[0];
    }

    const { error } = await this.configuracionService.crearCupon({
      codigo: valores.codigo.trim().toUpperCase(),
      porcentaje: valores.porcentaje,
      vigente_hasta: vigencia
    });

    if (error) {
      this.error.set('No se pudo crear el cupón. ¿Ya existe ese código?');
    } else {
      this.formCupon.reset();
      await this.cargarListas();
    }
  }

  async eliminarCupon(cupon: any) {
    if (!confirm('¿Borrar el cupón ' + cupon.codigo + '?')) return;
    this.limpiarMensajes();

    const { error } = await this.configuracionService.eliminarCupon(cupon.id);
    if (error) {
      this.error.set('No se puede borrar: el cupón ya se usó en compras.');
    } else {
      await this.cargarListas();
    }
  }

  async crearRecompensa() {
    this.limpiarMensajes();
    const valores = this.formRecompensa.value;

    const { error } = await this.configuracionService.crearRecompensa({
      nombre: valores.nombre,
      puntos: valores.puntos,
      producto_id: valores.producto_id ? Number(valores.producto_id) : null
    });

    if (error) {
      this.error.set('No se pudo crear la recompensa.');
    } else {
      this.formRecompensa.reset({ producto_id: '' });
      await this.cargarListas();
    }
  }

  async eliminarRecompensa(recompensa: any) {
    if (!confirm('¿Borrar la recompensa "' + recompensa.nombre + '"?')) return;
    this.limpiarMensajes();

    const { error } = await this.configuracionService.eliminarRecompensa(recompensa.id);
    if (error) {
      this.error.set('No se puede borrar: la recompensa ya tiene canjes.');
    } else {
      await this.cargarListas();
    }
  }

  async agregarSala() {
    this.limpiarMensajes();
    const nombre = this.nuevaSala().trim();
    if (!nombre) return;

    const { error } = await this.configuracionService.crearSala(nombre);
    if (error) {
      this.error.set('No se pudo crear la sala.');
    } else {
      this.nuevaSala.set('');
      await this.cargarListas();
    }
  }

  async eliminarSala(sala: any) {
    if (!confirm('¿Borrar "' + sala.nombre + '"?')) return;
    this.limpiarMensajes();

    const { error } = await this.configuracionService.eliminarSala(sala.id);
    if (error) {
      this.error.set('No se puede borrar: la sala tiene funciones cargadas.');
    } else {
      await this.cargarListas();
    }
  }
}