import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./panel/panel').then(c => c.Panel),
    children: [
      { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
      { path: 'peliculas', loadComponent: () => import('./peliculas/peliculas').then(c => c.Peliculas) },
      { path: 'funciones', loadComponent: () => import('./funciones/funciones').then(c => c.Funciones) },
      { path: 'candy', loadComponent: () => import('./candy/candy').then(c => c.Candy) },
      { path: 'configuracion', loadComponent: () => import('./configuracion/configuracion').then(c => c.Configuracion) },
      { path: 'reportes', loadComponent: () => import('./reportes/reportes').then(c => c.Reportes) }
    
    ]
  }
];
// las pandallas del admin se muestran adentro del panel