import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanMatchFn = async (route, segments) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.cargarUsuario();
  const usuario = authService.usuario();

  if (usuario && usuario.rol === 'admin') {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};