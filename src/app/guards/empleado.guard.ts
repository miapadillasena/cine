import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const empleadoGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.cargarUsuario();
  const usuario = authService.usuario();

  if (usuario && (usuario.rol === 'empleado' || usuario.rol === 'admin')) {
    return true;
  }
  return router.createUrlTree(['/']);
};