import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class FuncionesService {
  constructor(private supabaseService: SupabaseService) {}

  async obtenerFunciones() {
    const { data, error } = await this.supabaseService.client
      .from('funciones')
      .select('*, peliculas(nombre, duracion), salas(nombre)')
      .gte('inicio', new Date().toISOString())
      .order('inicio');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async buscarSalaLibre(inicio: Date, fin: Date) {
    const { data: salas } = await this.supabaseService.client
      .from('salas')
      .select('*')
      .order('id');

    const desde = new Date(inicio.getTime() - 30 * 60000);
    const hasta = new Date(fin.getTime() + 30 * 60000);

    const { data: ocupadas } = await this.supabaseService.client
      .from('funciones')
      .select('sala_id')
      .lt('inicio', hasta.toISOString())
      .gt('fin', desde.toISOString());

    const idsOcupados = (ocupadas || []).map(f => f.sala_id);
    const libre = (salas || []).find(s => !idsOcupados.includes(s.id));
    return libre || null;
  }

  async crearFuncion(funcion: any) {
    const { error } = await this.supabaseService.client
      .from('funciones')
      .insert([funcion]);
    return { error };
  }

  async eliminarFuncion(id: number) {
    const { error } = await this.supabaseService.client
      .from('funciones')
      .delete()
      .eq('id', id);
    return { error };
  }
}