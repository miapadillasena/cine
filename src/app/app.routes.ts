import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { empleadoGuard } from './guards/empleado.guard';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/home/home').then(c => c.Home) },
  { path: 'pelicula/:id', loadComponent: () => import('./pages/pelicula-detalle/pelicula-detalle').then(c => c.PeliculaDetalle) },
  { path: 'compra/:id', loadComponent: () => import('./pages/compras/compras').then(c => c.Compra) },  { path: 'login', loadComponent: () => import('./pages/login/login').then(c => c.Login) },
  { path: 'registro', loadComponent: () => import('./pages/registro/registro').then(c => c.Registro) },
  { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil').then(c => c.Perfil), canActivate: [authGuard] },
  { path: 'admin', loadChildren: () => import('./pages/admin/admin.routes').then(r => r.adminRoutes), canMatch: [adminGuard] },
  { path: 'validacion', loadComponent: () => import('./pages/validacion/validacion').then(c => c.Validacion), canActivate: [empleadoGuard]},

];