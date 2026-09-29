import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DuracionPipe } from '../../pipes/duracion.pipe';
import { ResaltarDirective } from '../../directives/resaltar.directive';

@Component({
  selector: 'app-tarjeta-pelicula',
  imports: [RouterLink, DuracionPipe, ResaltarDirective],
  templateUrl: './tarjeta-pelicula.html',
  styleUrl: './tarjeta-pelicula.css'
})
export class TarjetaPelicula {
  pelicula = input.required<any>();
  posicion = input<number>(0);
}