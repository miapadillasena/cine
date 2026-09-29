import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  constructor(private supabaseService: SupabaseService) {}

  async guardarConfiguracion(valores: any) {
    const { error } = await this.supabaseService.client
      .from('configuracion')
      .update(valores)
      .eq('id', 1);
    return { error };
  }

  async obtenerCupones() {
    const { data, error } = await this.supabaseService.client
      .from('cupones')
      .select('*')
      .order('codigo');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async crearCupon(cupon: any) {
    const { error } = await this.supabaseService.client
      .from('cupones')
      .insert([cupon]);
    return { error };
  }

  async eliminarCupon(id: number) {
    const { error } = await this.supabaseService.client
      .from('cupones')
      .delete()
      .eq('id', id);
    return { error };
  }

  async obtenerRecompensas() {
    const { data, error } = await this.supabaseService.client
      .from('recompensas')
      .select('*, productos(nombre)')
      .order('puntos');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async crearRecompensa(recompensa: any) {
    const { error } = await this.supabaseService.client
      .from('recompensas')
      .insert([recompensa]);
    return { error };
  }

  async eliminarRecompensa(id: number) {
    const { error } = await this.supabaseService.client
      .from('recompensas')
      .delete()
      .eq('id', id);
    return { error };
  }

  async obtenerSalas() {
    const { data, error } = await this.supabaseService.client
      .from('salas')
      .select('*')
      .order('id');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async crearSala(nombre: string) {
    const { error } = await this.supabaseService.client
      .from('salas')
      .insert([{ nombre: nombre }]);
    return { error };
  }

  async eliminarSala(id: number) {
    const { error } = await this.supabaseService.client
      .from('salas')
      .delete()
      .eq('id', id);
    return { error };
  }
}