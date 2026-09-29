import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { PeliculasService } from '../../services/peliculas';
import { AuthService } from '../../services/auth';
import { DuracionPipe } from '../../pipes/duracion.pipe';

@Component({
  selector: 'app-pelicula-detalle',
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe, DecimalPipe, DuracionPipe],
  templateUrl: './pelicula-detalle.html',
  styleUrl: './pelicula-detalle.css'
})
export class PeliculaDetalle implements OnInit {
  pelicula = signal<any>(null);
  generos = signal<any[]>([]);
  funciones = signal<any[]>([]);
  resenas = signal<any[]>([]);
  estrellasElegidas = signal(0);
  comentario = signal('');
  mensaje = signal('');

  promedio = computed(() => {
    const lista = this.resenas();
    if (lista.length === 0) return 0;
    let suma = 0;
    for (const resena of lista) {
      suma += resena.estrellas;
    }
    return suma / lista.length;
  });

  miResena = computed(() => {
    const usuario = this.authService.usuario();
    if (!usuario) return null;
    return this.resenas().find(r => r.usuario_id === usuario.id) || null;
  });

  ventaAbierta = computed(() => {
    const p = this.pelicula();
    if (!p || !p.fecha_estreno) return true;
    const apertura = new Date(p.fecha_estreno + 'T00:00:00');
    apertura.setDate(apertura.getDate() - 7);
    return new Date() >= apertura;
  });

  enPreventa = computed(() => {
    const p = this.pelicula();
    if (!p || !p.fecha_estreno || !p.precio_preventa) return false;
    return new Date() < new Date(p.fecha_estreno + 'T00:00:00');
  });

  constructor(
    private route: ActivatedRoute,
    private peliculasService: PeliculasService,
    public authService: AuthService
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pelicula.set(await this.peliculasService.obtenerPelicula(id));
    this.generos.set(await this.peliculasService.obtenerGeneros());
    this.funciones.set(await this.peliculasService.obtenerFuncionesDePelicula(id));
    await this.cargarResenas();
  }

  async cargarResenas() {
    this.resenas.set(await this.peliculasService.obtenerResenas(this.pelicula().id));
    const mia = this.miResena();
    if (mia) {
      this.estrellasElegidas.set(mia.estrellas);
      this.comentario.set(mia.comentario);
    }
  }

  nombresGeneros() {
    return this.pelicula().pelicula_generos
      .map((pg: any) => this.generos().find(g => g.id === pg.genero_id)?.nombre)
      .join(', ');
  }

  precioDe(funcion: any) {
    return this.enPreventa() ? this.pelicula().precio_preventa : funcion.precio;
  }

  async guardarResena() {
    const usuario = this.authService.usuario();
    const resena = {
      usuario_id: usuario.id,
      pelicula_id: this.pelicula().id,
      estrellas: this.estrellasElegidas(),
      comentario: this.comentario(),
      autor: usuario.nombre
    };

    const existente = this.miResena();
    const { error } = await this.peliculasService.guardarResena(resena, existente ? existente.id : null);

    if (error) {
      this.mensaje.set('No se pudo guardar la reseña.');
    } else {
      this.mensaje.set('¡Reseña guardada!');
      await this.cargarResenas();
    }
  }
}