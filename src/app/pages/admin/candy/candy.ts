import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { CandyService } from '../../../services/candy';
import { LogsService } from '../../../services/logs';

@Component({
  selector: 'app-candy',
  imports: [ReactiveFormsModule, FormsModule, CurrencyPipe],
  templateUrl: './candy.html',
  styleUrl: './candy.css'
})
export class Candy implements OnInit {
  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  combos = signal<any[]>([]);
  nuevaCategoria = signal('');
  editandoProducto = signal<any>(null);
  imagenActual = signal('');
  archivo: File | null = null;
  error = signal('');
  formProducto: FormGroup;
  formCombo: FormGroup;

  constructor(private fb: FormBuilder, private candyService: CandyService, private logsService: LogsService) {
    this.formProducto = this.fb.group({
      nombre: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      categoria_id: ['', Validators.required]
    });

    this.formCombo = this.fb.group({
      nombre: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      pochoclo_id: ['', Validators.required],
      bebida_id: ['', Validators.required]
    });
  }

  async ngOnInit() {
    await this.cargarTodo();
  }

  async cargarTodo() {
    this.categorias.set(await this.candyService.obtenerCategorias());
    this.productos.set(await this.candyService.obtenerProductos());
    this.combos.set(await this.candyService.obtenerCombos());
  }

  async agregarCategoria() {
    const nombre = this.nuevaCategoria().trim();
    if (!nombre) return;

    const { error } = await this.candyService.crearCategoria(nombre);
    if (error) {
      this.error.set('No se pudo crear la categoría.');
    } else {
      this.nuevaCategoria.set('');
      await this.cargarTodo();
    }
  }

  async eliminarCategoria(categoria: any) {
    if (!confirm('¿Borrar la categoría "' + categoria.nombre + '"?')) return;

    const { error } = await this.candyService.eliminarCategoria(categoria.id);
    if (error) {
      this.error.set('No se puede borrar: la categoría tiene productos.');
    } else {
      await this.cargarTodo();
    }
  }

  seleccionarArchivo(event: any) {
    this.archivo = event.target.files[0];
  }

  async guardarProducto() {
    this.error.set('');

    let imagenUrl = this.imagenActual();
    if (this.archivo) {
      const url = await this.candyService.subirImagen(this.archivo);
      if (!url) {
        this.error.set('No se pudo subir la imagen.');
        return;
      }
      imagenUrl = url;
    }

    const valores = this.formProducto.value;
    const producto = {
      nombre: valores.nombre,
      precio: valores.precio,
      categoria_id: Number(valores.categoria_id),
      imagen_url: imagenUrl || null
    };

    const editando = this.editandoProducto();
    if (editando) {
      const { error } = await this.candyService.actualizarProducto(editando.id, producto);
      if (error) {
        this.error.set('No se pudo guardar el producto.');
        return;
      }
      if (Number(editando.precio) !== Number(valores.precio)) {
        await this.logsService.registrar(
          'Cambió el precio de "' + valores.nombre + '" de $' + editando.precio + ' a $' + valores.precio
        );
      }
    } else {
      const { error } = await this.candyService.crearProducto(producto);
      if (error) {
        this.error.set('No se pudo guardar el producto.');
        return;
      }
    }

    this.cancelarProducto();
    await this.cargarTodo();
  }

  editarProducto(producto: any) {
    this.editandoProducto.set(producto);
    this.imagenActual.set(producto.imagen_url || '');
    this.formProducto.patchValue({
      nombre: producto.nombre,
      precio: producto.precio,
      categoria_id: producto.categoria_id
    });
  }

  cancelarProducto() {
    this.editandoProducto.set(null);
    this.imagenActual.set('');
    this.archivo = null;
    this.formProducto.reset({ categoria_id: '' });
  }

  async eliminarProducto(producto: any) {
    if (!confirm('¿Borrar "' + producto.nombre + '"?')) return;

    const { error } = await this.candyService.eliminarProducto(producto.id);
    if (error) {
      this.error.set('No se puede borrar: el producto está en un combo o en compras.');
    } else {
      await this.cargarTodo();
    }
  }

  async guardarCombo() {
    this.error.set('');
    const valores = this.formCombo.value;

    const { error } = await this.candyService.crearCombo({
      nombre: valores.nombre,
      precio: valores.precio,
      pochoclo_id: Number(valores.pochoclo_id),
      bebida_id: Number(valores.bebida_id)
    });

    if (error) {
      this.error.set('No se pudo crear el combo.');
    } else {
      this.formCombo.reset({ pochoclo_id: '', bebida_id: '' });
      await this.cargarTodo();
    }
  }

  async cambiarPrecioCombo(combo: any) {
    const respuesta = prompt('Nuevo precio para "' + combo.nombre + '"', combo.precio);
    if (!respuesta) return;

    const nuevoPrecio = Number(respuesta);
    if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
      this.error.set('El precio no es válido.');
      return;
    }

    const { error } = await this.candyService.actualizarPrecioCombo(combo.id, nuevoPrecio);
    if (error) {
      this.error.set('No se pudo cambiar el precio.');
    } else {
      await this.logsService.registrar(
        'Cambió el precio del combo "' + combo.nombre + '" de $' + combo.precio + ' a $' + nuevoPrecio
      );
      await this.cargarTodo();
    }
  }

  async eliminarCombo(combo: any) {
    if (!confirm('¿Borrar el combo "' + combo.nombre + '"?')) return;

    const { error } = await this.candyService.eliminarCombo(combo.id);
    if (error) {
      this.error.set('No se pudo borrar el combo.');
    } else {
      await this.cargarTodo();
    }
  }

  nombreProducto(id: number) {
    return this.productos().find(p => p.id === id)?.nombre || '—';
  }

  productosDe(nombreCategoria: string) {
  return this.productos().filter(p => p.categorias?.nombre === nombreCategoria);
  }
}