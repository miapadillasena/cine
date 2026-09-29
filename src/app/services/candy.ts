import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class CandyService {
  constructor(private supabaseService: SupabaseService) {}

  async obtenerCategorias() {
    const { data, error } = await this.supabaseService.client
      .from('categorias')
      .select('*')
      .order('nombre');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async crearCategoria(nombre: string) {
    const { error } = await this.supabaseService.client
      .from('categorias')
      .insert([{ nombre: nombre }]);
    return { error };
  }

  async eliminarCategoria(id: number) {
    const { error } = await this.supabaseService.client
      .from('categorias')
      .delete()
      .eq('id', id);
    return { error };
  }

  async obtenerProductos() {
    const { data, error } = await this.supabaseService.client
      .from('productos')
      .select('*, categorias(nombre)')
      .order('nombre');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async subirImagen(archivo: File) {
    const extension = archivo.name.split('.').pop();
    const nombreArchivo = Date.now() + '.' + extension;

    const { error } = await this.supabaseService.client.storage
      .from('productos')
      .upload(nombreArchivo, archivo);

    if (error) {
      console.error('Error:', error);
      return null;
    }

    const { data } = this.supabaseService.client.storage
      .from('productos')
      .getPublicUrl(nombreArchivo);

    return data.publicUrl;
  }

  async crearProducto(producto: any) {
    const { error } = await this.supabaseService.client
      .from('productos')
      .insert([producto]);
    return { error };
  }

  async actualizarProducto(id: number, producto: any) {
    const { error } = await this.supabaseService.client
      .from('productos')
      .update(producto)
      .eq('id', id);
    return { error };
  }

  async eliminarProducto(id: number) {
    const { error } = await this.supabaseService.client
      .from('productos')
      .delete()
      .eq('id', id);
    return { error };
  }

  async obtenerCombos() {
    const { data, error } = await this.supabaseService.client
      .from('combos')
      .select('*')
      .order('nombre');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async crearCombo(combo: any) {
    const { error } = await this.supabaseService.client
      .from('combos')
      .insert([combo]);
    return { error };
  }

  async actualizarPrecioCombo(id: number, precio: number) {
    const { error } = await this.supabaseService.client
      .from('combos')
      .update({ precio: precio })
      .eq('id', id);
    return { error };
  }

  async eliminarCombo(id: number) {
    const { error } = await this.supabaseService.client
      .from('combos')
      .delete()
      .eq('id', id);
    return { error };
  }
}