import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { PerfilService } from '../../services/perfil';
import { EntradaPdfService } from '../../services/entrada-pdf';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {
  pestana = signal('compras');
  compras = signal<any[]>([]);
  recompensas = signal<any[]>([]);
  canjes = signal<any[]>([]);
  misResenas = signal<any[]>([]);
  mensaje = signal('');
  error = signal('');

  misPeliculas = computed(() => {
    const vistas: any = {};
    for (const compra of this.compras()) {
      const inicio = new Date(compra.funciones.inicio);
      if (compra.estado === 'pagada' && inicio < new Date()) {
        const pelicula = compra.funciones.peliculas;
        if (!vistas[pelicula.id]) {
          vistas[pelicula.id] = { pelicula: pelicula, fecha: compra.funciones.inicio };
        }
      }
    }
    return Object.values(vistas) as any[];
  });

  constructor(
    public authService: AuthService,
    private perfilService: PerfilService,
    private entradaPdfService: EntradaPdfService
  ) {}

  async ngOnInit() {
    await this.authService.cargarUsuario();
    await this.cargarDatos();
  }

  async cargarDatos() {
    const usuario = this.authService.usuario();
    if (!usuario) return;
    this.compras.set(await this.perfilService.obtenerMisCompras(usuario.id));
    this.recompensas.set(await this.perfilService.obtenerRecompensas());
    this.canjes.set(await this.perfilService.obtenerCanjes(usuario.id));
    this.misResenas.set(await this.perfilService.obtenerMisResenas(usuario.id));
  }

  puedeCancelar(compra: any) {
    if (compra.estado !== 'pagada' || compra.entrada_validada) return false;
    const limite = new Date(compra.funciones.inicio).getTime() - 2 * 60 * 60000;
    return Date.now() < limite;
  }

  async cancelar(compra: any) {
    const credito = compra.total + compra.credito_usado;
    if (!confirm('¿Cancelar la compra ' + compra.codigo + '? No se devuelve dinero: se te acreditarán $' + credito + ' para futuras compras.')) return;

    this.error.set('');
    this.mensaje.set('');

    const { error } = await this.perfilService.cancelarCompra(compra.id);
    if (error) {
      this.error.set(error.message);
      return;
    }

    this.mensaje.set('Compra cancelada. Se acreditaron $' + credito + ' a tu cuenta.');
    await this.authService.cargarUsuario();
    await this.cargarDatos();
  }

  descargarEntrada(compra: any) {
    this.entradaPdfService.descargar({
      codigo: compra.codigo,
      pelicula: compra.funciones.peliculas.nombre,
      sala: compra.funciones.salas.nombre,
      inicio: compra.funciones.inicio,
      butacas: compra.butacas,
      total: compra.total,
      tieneCandy: compra.items && compra.items.length > 0
    });
  }

  estrellasDe(peliculaId: number) {
    const resena = this.misResenas().find(r => r.pelicula_id === peliculaId);
    return resena ? resena.estrellas : 0;
  }

  async canjear(recompensa: any) {
    if (!confirm('¿Canjear ' + recompensa.puntos + ' puntos por "' + recompensa.nombre + '"?')) return;

    this.error.set('');
    this.mensaje.set('');

    const usuario = this.authService.usuario();
    const codigo = 'C-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await this.perfilService.canjear(usuario.id, recompensa.id, codigo);
    if (error) {
      this.error.set(error.message);
      return;
    }

    this.mensaje.set('¡Canje realizado! Presentá el código ' + codigo + ' en el cine.');
    await this.authService.cargarUsuario();
    await this.cargarDatos();
  }
}