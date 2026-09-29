import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duracion' }) // registra la clase como pipe
export class DuracionPipe implements PipeTransform { // obliga a tener el metodo transform
  transform(minutos: number): string {// devuelve el texto transformado en string
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas + 'h ' + String(resto).padStart(2, '0') + 'min';
  }
}