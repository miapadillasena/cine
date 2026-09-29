import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PeliculasService } from '../../services/peliculas';
import { AuthService } from '../../services/auth';
import { AlertasService } from '../../services/alertas';
import { TarjetaPelicula } from '../../components/tarjeta-pelicula/tarjeta-pelicula';
import { ResaltarDirective } from '../../directives/resaltar.directive';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, DatePipe, TarjetaPelicula, ResaltarDirective],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  peliculas = signal<any[]>([]);
  generos = signal<any[]>([]);
  ventas = signal<any>({});
  busqueda = signal('');
  generoElegido = signal(0);
  proximas = signal<any[]>([]);
  alertasActivas = signal<number[]>([]);

  masVendidas = computed(() => {
    const lista = [...this.peliculas()];
    lista.sort((a, b) => (this.ventas()[b.id] || 0) - (this.ventas()[a.id] || 0));
    return lista.slice(0, 3);
  });

  filtradas = computed(() => {
    const texto = this.busqueda().toLowerCase();
    const genero = this.generoElegido();
    return this.peliculas().filter(p => {
      const coincideNombre = p.nombre.toLowerCase().includes(texto);
      const coincideGenero = genero === 0 || p.pelicula_generos.some((pg: any) => pg.genero_id === genero);
      return coincideNombre && coincideGenero;
    });
  });

  constructor(
    private peliculasService: PeliculasService,
    public authService: AuthService,
    private alertasService: AlertasService
  ) {}

  async ngOnInit() {
    this.peliculas.set(await this.peliculasService.obtenerCartelera());
    this.generos.set(await this.peliculasService.obtenerGeneros());
    this.proximas.set(await this.peliculasService.obtenerProximamente());

    const entradas = await this.peliculasService.obtenerVentas();
    const conteo: any = {};
    for (const entrada of entradas) {
      const id = (entrada as any).funciones.pelicula_id;
      conteo[id] = (conteo[id] || 0) + 1;
    }
    this.ventas.set(conteo);

    await this.authService.cargarUsuario();
    const usuario = this.authService.usuario();
    if (usuario) {
      this.alertasActivas.set(await this.alertasService.obtenerIdsAlertas(usuario.id));
    }
  }

  ventaAbierta(pelicula: any) {
    const apertura = new Date(pelicula.fecha_estreno + 'T00:00:00');
    apertura.setDate(apertura.getDate() - 7);
    return new Date() >= apertura;
  }

  tieneAlerta(peliculaId: number) {
    return this.alertasActivas().includes(peliculaId);
  }

  async toggleAlerta(pelicula: any) {
    const usuario = this.authService.usuario();
    if (this.tieneAlerta(pelicula.id)) {
      await this.alertasService.quitarAlerta(usuario.id, pelicula.id);
      this.alertasActivas.update(lista => lista.filter(id => id !== pelicula.id));
    } else {
      await this.alertasService.activarAlerta(usuario.id, pelicula.id);
      this.alertasActivas.update(lista => [...lista, pelicula.id]);
    }
  }
}