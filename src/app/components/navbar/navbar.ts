import { Component, effect, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AlertasService } from '../../services/alertas';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  abierto = signal(false);

  constructor(public authService: AuthService, public alertasService: AlertasService, private router: Router) {
    effect(() => {
      const usuario = this.authService.usuario();
      if (usuario) {
        this.alertasService.revisar(usuario.id);
      } else {
        this.alertasService.limpiar();
      }
    });
  }

  async leer(notificacion: any) {
    const usuario = this.authService.usuario();
    await this.alertasService.marcarLeida(usuario.id, notificacion.pelicula_id);
    this.abierto.set(false);
  }

  async cerrarSesion() {
    await this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}