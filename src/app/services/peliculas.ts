import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class PeliculasService {
  constructor(private supabaseService: SupabaseService) {}
        // Hace que sea un solo servicio para toda la app
  async obtenerGeneros() {
    const { data, error } = await this.supabaseService.client
      .from('generos')
      .select('*'); // Trae todos los generos para armar las opciones
    if (error) console.error('Error:', error);
    return data || []; // si data esta vacio por un error, devuelve un arrar vacio. 
  }

  async obtenerPeliculas() {
    const { data, error } = await this.supabaseService.client
      .from('peliculas')
      .select('*, pelicula_generos(genero_id)'); // trae todas las peliculas y ademas todos los generos
    if (error) console.error('Error:', error);   // con genero_id se puede saber cuantos generon puede tener una pelicula (RF-02)
    return data || [];
  }

  async subirImagen(archivo: File) {
    const extension = archivo.name.split('.').pop();
    const nombreArchivo = Date.now() + '.' + extension;

    const { error } = await this.supabaseService.client.storage
      .from('peliculas')
      .upload(nombreArchivo, archivo); // sube el archivo al bucket peliculas. 

    if (error) {
      console.error('Error:', error);
      return null;
    }

    const { data } = this.supabaseService.client.storage
      .from('peliculas')
      .getPublicUrl(nombreArchivo); // arma un link publico de la imagen, funciona porque el bucket es puplico. 

    return data.publicUrl;
  }

  async crearPelicula(pelicula: any, generosIds: number[]) {
    const { data, error } = await this.supabaseService.client
      .from('peliculas')
      .insert([pelicula])
      .select();

    if (error) return { error };

    const peliculaId = data[0].id;
    await this.guardarGeneros(peliculaId, generosIds);
    return { error: null };
  }

  async actualizarPelicula(id: number, pelicula: any, generosIds: number[]) {
    const { error } = await this.supabaseService.client
      .from('peliculas')
      .update(pelicula)
      .eq('id', id);

    if (error) return { error };

    await this.supabaseService.client
      .from('pelicula_generos')
      .delete()
      .eq('pelicula_id', id);

    await this.guardarGeneros(id, generosIds);
    return { error: null };
  }

  async eliminarPelicula(id: number) {
    const { error } = await this.supabaseService.client
      .from('peliculas')
      .delete()
      .eq('id', id);
    return { error };
  }

  private async guardarGeneros(peliculaId: number, generosIds: number[]) {
    const filas = generosIds.map(generoId => ({ pelicula_id: peliculaId, genero_id: generoId }));
    if (filas.length > 0) {
      await this.supabaseService.client.from('pelicula_generos').insert(filas);
    }
  }

    async obtenerCartelera() {
    const { data, error } = await this.supabaseService.client
      .from('peliculas')
      .select('*, pelicula_generos(genero_id)')
      .eq('en_cartelera', true)
      .order('nombre');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async obtenerVentas() {
    const { data, error } = await this.supabaseService.client
      .from('entradas')
      .select('funciones(pelicula_id)');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async obtenerPelicula(id: number) {
    const { data, error } = await this.supabaseService.client
      .from('peliculas')
      .select('*, pelicula_generos(genero_id)')
      .eq('id', id);
    if (error) console.error('Error:', error);
    return data && data.length > 0 ? data[0] : null;
  }

  async obtenerFuncionesDePelicula(id: number) {
    const { data, error } = await this.supabaseService.client
      .from('funciones')
      .select('*, salas(nombre)')
      .eq('pelicula_id', id)
      .gte('inicio', new Date().toISOString())
      .order('inicio');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async obtenerResenas(peliculaId: number) {
    const { data, error } = await this.supabaseService.client
      .from('resenas')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error:', error);
    return data || [];
  }

  async guardarResena(resena: any, existenteId: number | null) {
    if (existenteId) {
      const { error } = await this.supabaseService.client
        .from('resenas')
        .update(resena)
        .eq('id', existenteId);
      return { error };
    } else {
      const { error } = await this.supabaseService.client
        .from('resenas')
        .insert([resena]);
      return { error };
    }
  }
    async obtenerProximamente() {
    const hoy = new Date();
    const fecha = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

    const { data, error } = await this.supabaseService.client
      .from('peliculas')
      .select('*')
      .gt('fecha_estreno', fecha)
      .order('fecha_estreno');
    if (error) console.error('Error:', error);
    return data || [];
  }
}