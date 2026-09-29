import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-mapa-butacas',
  imports: [],
  templateUrl: './mapa-butacas.html',
  styleUrl: './mapa-butacas.css'
})
export class MapaButacas {
  ocupadas = input.required<string[]>();
  seleccionadas = model.required<any[]>();
  maximo = 10;
  filas = this.armarFilas();

  armarFilas() {
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    return letras.map(letra => {
      if (letra === 'J') {
        return { letra: letra, tipo: 'accesible', bloques: this.armarBloques([2, 10, 2]) };
      }
      const tipo = ['R', 'S', 'T'].includes(letra) ? 'vip' : 'normal';
      return { letra: letra, tipo: tipo, bloques: this.armarBloques([4, 20, 4]) };
    });
  }

  armarBloques(tamanios: number[]) {
    const bloques: number[][] = [];
    let numero = 1;
    for (const tamanio of tamanios) {
      const bloque: number[] = [];
      for (let i = 0; i < tamanio; i++) {
        bloque.push(numero);
        numero++;
      }
      bloques.push(bloque);
    }
    return bloques;
  }

  estaOcupada(fila: string, numero: number) {
    return this.ocupadas().includes(fila + '-' + numero);
  }

  estaSeleccionada(fila: string, numero: number) {
    return this.seleccionadas().some(b => b.fila === fila && b.numero === numero);
  }

  toggle(fila: string, numero: number, tipo: string) {
    if (this.estaOcupada(fila, numero)) return;

    if (this.estaSeleccionada(fila, numero)) {
      this.seleccionadas.update(lista => lista.filter(b => !(b.fila === fila && b.numero === numero)));
    } else {
      if (this.seleccionadas().length >= this.maximo) return;
      this.seleccionadas.update(lista => [...lista, {
        fila: fila,
        numero: numero,
        vip: tipo === 'vip',
        accesible: tipo === 'accesible'
      }]);
    }
  }
}