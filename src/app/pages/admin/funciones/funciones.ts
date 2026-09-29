import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FuncionesService } from '../../../services/funciones';
import { PeliculasService } from '../../../services/peliculas';
import { LogsService } from '../../../services/logs';

@Component({
  selector: 'app-funciones',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './funciones.html',
  styleUrl: './funciones.css'
})
export class Funciones implements OnInit {
  form: FormGroup;
  funciones = signal<any[]>([]);
  peliculas = signal<any[]>([]);
  diasElegidos = signal<number[]>([]);
  guardando = signal(false);
  mensaje = signal('');
  error = signal('');

  dias = [
    { numero: 1, nombre: 'Lun' },
    { numero: 2, nombre: 'Mar' },
    { numero: 3, nombre: 'Mié' },
    { numero: 4, nombre: 'Jue' },
    { numero: 5, nombre: 'Vie' },
    { numero: 6, nombre: 'Sáb' },
    { numero: 0, nombre: 'Dom' }
  ];

  constructor(
    private fb: FormBuilder,
    private funcionesService: FuncionesService,
    private peliculasService: PeliculasService,
    private logsService: LogsService
  ) {
    this.form = this.fb.group({
      pelicula_id: ['', Validators.required],
      formato: ['2D', Validators.required],
      idioma: ['Castellano', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      hora: ['', [Validators.required, Validators.pattern('^([01][0-9]|2[0-3]):[0-5][0-9]$')]],
      desde: ['', [Validators.required, Validators.pattern('^[0-9]{2}/[0-9]{2}/[0-9]{4}$')]],
      hasta: ['', Validators.pattern('^[0-9]{2}/[0-9]{2}/[0-9]{4}$')]
    });
  }

  async ngOnInit() {
    this.peliculas.set(await this.peliculasService.obtenerPeliculas());
    await this.cargarFunciones();
  }

  async cargarFunciones() {
    this.funciones.set(await this.funcionesService.obtenerFunciones());
  }

  toggleDia(numero: number) {
    if (this.diasElegidos().includes(numero)) {
      this.diasElegidos.update(lista => lista.filter(d => d !== numero));
    } else {
      this.diasElegidos.update(lista => [...lista, numero]);
    }
  }

  armarFecha(fecha: string, hora: string) {
    const f = fecha.split('/');
    const h = hora.split(':');
    return new Date(Number(f[2]), Number(f[1]) - 1, Number(f[0]), Number(h[0]), Number(h[1]));
  }

    formatearFecha(fecha: Date) {
    return String(fecha.getDate()).padStart(2, '0') + '/' +
      String(fecha.getMonth() + 1).padStart(2, '0') + '/' +
      fecha.getFullYear() + ' ' +
      String(fecha.getHours()).padStart(2, '0') + ':' +
      String(fecha.getMinutes()).padStart(2, '0');
  }

  async guardar() {
    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');

    const valores = this.form.value;
    const pelicula = this.peliculas().find(p => p.id === Number(valores.pelicula_id));
    const desde = this.armarFecha(valores.desde, valores.hora);

    if (desde < new Date()) {
      this.error.set('La fecha de inicio ya pasó.');
      this.guardando.set(false);
      return;
    }

    const fechas: Date[] = [];

    if (!valores.hasta) {
      fechas.push(desde);
    } else {
      if (this.diasElegidos().length === 0) {
        this.error.set('Elegí al menos un día de la semana.');
        this.guardando.set(false);
        return;
      }
      const hasta = this.armarFecha(valores.hasta, valores.hora);
      const dia = new Date(desde);
      while (dia <= hasta) {
        if (this.diasElegidos().includes(dia.getDay())) {
          fechas.push(new Date(dia));
        }
        dia.setDate(dia.getDate() + 1);
      }
    }

    let creadas = 0;
    const sinSala: string[] = [];

    for (const inicio of fechas) {
      const fin = new Date(inicio.getTime() + pelicula.duracion * 60000);
      const sala = await this.funcionesService.buscarSalaLibre(inicio, fin);

      if (sala) {
        const { error } = await this.funcionesService.crearFuncion({
          pelicula_id: pelicula.id,
          sala_id: sala.id,
          inicio: inicio.toISOString(),
          fin: fin.toISOString(),
          formato: valores.formato,
          idioma: valores.idioma,
          precio: valores.precio
        });
        if (!error) {
          creadas++;
            await this.logsService.registrar(
            'Creó función de "' + pelicula.nombre + '" el ' + this.formatearFecha(inicio) + ' en ' + sala.nombre
          );
        }
      } else {
        sinSala.push(inicio.toLocaleDateString('es-AR'));
      }
    }

    this.guardando.set(false);
    this.mensaje.set('Se crearon ' + creadas + ' funciones.');
    if (sinSala.length > 0) {
      this.error.set('Sin sala libre para: ' + sinSala.join(', '));
    }

    this.form.reset({ formato: '2D', idioma: 'Castellano', pelicula_id: '' });
    this.diasElegidos.set([]);
    await this.cargarFunciones();
  }

  async eliminar(funcion: any) {
    if (!confirm('¿Borrar la función de "' + funcion.peliculas.nombre + '"?')) return;

    const { error } = await this.funcionesService.eliminarFuncion(funcion.id);
    if (error) {
      this.error.set('No se puede borrar: la función ya tiene entradas vendidas.');
    } else {
      await this.logsService.registrar('Borró función de "' + funcion.peliculas.nombre + '"');
      await this.cargarFunciones();
    }
  }
}