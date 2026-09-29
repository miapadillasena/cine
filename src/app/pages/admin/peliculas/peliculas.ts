import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PeliculasService } from '../../../services/peliculas';
import { DuracionPipe } from '../../../pipes/duracion.pipe';

@Component({
  selector: 'app-peliculas',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DuracionPipe],
  templateUrl: './peliculas.html',
  styleUrl: './peliculas.css'
})
export class Peliculas implements OnInit {
  form: FormGroup;
  peliculas = signal<any[]>([]);
  generos = signal<any[]>([]);
  generosElegidos = signal<number[]>([]);
  editandoId = signal<number | null>(null);
  imagenActual = signal('');
  archivo: File | null = null;
  guardando = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private peliculasService: PeliculasService) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      sinopsis: ['', Validators.required],
      duracion: ['', [Validators.required, Validators.min(1)]],
      restriccion: ['ATP', Validators.required], // ATP es lo mas comun
      en_cartelera: [false],
      fecha_estreno: ['', Validators.pattern('^[0-9]{2}/[0-9]{2}/[0-9]{4}$')],
      precio_preventa: ['', Validators.min(0)]
    });
  }

  async ngOnInit() {
    this.generos.set(await this.peliculasService.obtenerGeneros());
    await this.cargarPeliculas();
  }

  async cargarPeliculas() {
    this.peliculas.set(await this.peliculasService.obtenerPeliculas());
  }

  toggleGenero(id: number) {
    if (this.generosElegidos().includes(id)) {
      this.generosElegidos.update(lista => lista.filter(g => g !== id));
    } else {
      this.generosElegidos.update(lista => [...lista, id]);
    }
  }

  seleccionarArchivo(event: any) {
    this.archivo = event.target.files[0];
  }

  async guardar() {
    this.guardando.set(true);
    this.error.set('');

    let imagenUrl = this.imagenActual();
    if (this.archivo) {
      const url = await this.peliculasService.subirImagen(this.archivo);
      if (!url) {
        this.error.set('No se pudo subir la imagen.');
        this.guardando.set(false);
        return;
      }
      imagenUrl = url;
    }

    const valores = this.form.value;
    const pelicula = {
      nombre: valores.nombre,
      sinopsis: valores.sinopsis,
      duracion: valores.duracion,
      restriccion: valores.restriccion,
      en_cartelera: valores.en_cartelera,
      fecha_estreno: this.aFechaBase(valores.fecha_estreno),
      precio_preventa: valores.precio_preventa || null,
      imagen_url: imagenUrl
    };

    let resultado;
    const id = this.editandoId();
    if (id) {
      resultado = await this.peliculasService.actualizarPelicula(id, pelicula, this.generosElegidos());
    } else {
      resultado = await this.peliculasService.crearPelicula(pelicula, this.generosElegidos());
    }

    this.guardando.set(false);

    if (resultado.error) {
      this.error.set('No se pudo guardar la película.');
    } else {
      this.cancelar();
      await this.cargarPeliculas();
    }
  }

  editar(pelicula: any) {
    this.editandoId.set(pelicula.id);
    this.imagenActual.set(pelicula.imagen_url || '');
    this.form.patchValue({
      nombre: pelicula.nombre,
      sinopsis: pelicula.sinopsis,
      duracion: pelicula.duracion,
      restriccion: pelicula.restriccion,
      en_cartelera: pelicula.en_cartelera,
      fecha_estreno: this.aFechaForm(pelicula.fecha_estreno),
      precio_preventa: pelicula.precio_preventa
    });
    this.generosElegidos.set(pelicula.pelicula_generos.map((pg: any) => pg.genero_id));
  }

  cancelar() {
    this.editandoId.set(null);
    this.imagenActual.set('');
    this.archivo = null;
    this.generosElegidos.set([]);
    this.form.reset({ restriccion: 'ATP', en_cartelera: false });
  }

  async eliminar(pelicula: any) {
    if (!confirm('¿Borrar "' + pelicula.nombre + '"?')) return;

    const { error } = await this.peliculasService.eliminarPelicula(pelicula.id);
    if (error) {
      this.error.set('No se puede borrar: la película tiene funciones cargadas.');
    } else {
      await this.cargarPeliculas();
    }
  }

  nombresGeneros(pelicula: any) {
    return pelicula.pelicula_generos
      .map((pg: any) => this.generos().find(g => g.id === pg.genero_id)?.nombre)
      .join(', ');
  }

  aFechaBase(fecha: string) {
    if (!fecha) return null;
    const partes = fecha.split('/');
    return partes[2] + '-' + partes[1] + '-' + partes[0];
  }

  aFechaForm(fecha: string) {
    if (!fecha) return '';
    const partes = fecha.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }
}