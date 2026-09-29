import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  constructor(private supabaseService: SupabaseService) {}

  async obtenerMisCompras(usuarioId: string) {
    const { data, error } = await this.supabaseService.client
      .from('compras')
      .select('*, funciones(inicio, peliculas(id, nombre, imagen_url), salas(nombre))')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error:', error);
    return data || [];
  }

  async cancelarCompra(id: string) {
    const { error } = await this.supabaseService.client
      .from('compras')
      .update({ estado: 'cancelada' })
      .eq('id', id);
    return { error };
  }

  async obtenerRecompensas() {
    const { data, error } = await this.supabaseService.client
      .from('recompensas')
      .select('*')
      .order('puntos');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async obtenerCanjes(usuarioId: string) {
    const { data, error } = await this.supabaseService.client
      .from('canjes')
      .select('*, recompensas(nombre)')
      .eq('usuario_id', usuarioId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error:', error);
    return data || [];
  }

  async canjear(usuarioId: string, recompensaId: number, codigo: string) {
    const { error } = await this.supabaseService.client
      .from('canjes')
      .insert([{ usuario_id: usuarioId, recompensa_id: recompensaId, codigo: codigo, puntos: 0 }]);
    return { error };
  }

  async obtenerMisResenas(usuarioId: string) {
    const { data, error } = await this.supabaseService.client
      .from('resenas')
      .select('pelicula_id, estrellas')
      .eq('usuario_id', usuarioId);
    if (error) console.error('Error:', error);
    return data || [];
  }
}