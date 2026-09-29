import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  constructor(private supabaseService: SupabaseService) {}

  async obtenerFuncion(id: number) {
    const { data, error } = await this.supabaseService.client
      .from('funciones')
      .select('*, peliculas(*), salas(nombre)')
      .eq('id', id);
    if (error) console.error('Error:', error);
    return data && data.length > 0 ? data[0] : null;
  }

  async obtenerOcupadas(funcionId: number) {
    const { data, error } = await this.supabaseService.client
      .from('entradas')
      .select('fila, numero')
      .eq('funcion_id', funcionId);
    if (error) console.error('Error:', error);
    return (data || []).map(e => e.fila + '-' + e.numero);
  }

  async obtenerConfiguracion() {
    const { data, error } = await this.supabaseService.client
      .from('configuracion')
      .select('*')
      .eq('id', 1);
    if (error) console.error('Error:', error);
    return data && data.length > 0 ? data[0] : { porcentaje_primera_compra: 20, recargo_vip: 0 };
  }

    async esPrimeraCompra(usuarioId: string) {
    const { data, error } = await this.supabaseService.client
      .from('compras')
      .select('id')
      .eq('usuario_id', usuarioId);
    if (error) {
      console.error('Error:', error);
      return false;
    }
    return data.length === 0;
  }

  async buscarCupon(codigo: string) {
    const { data, error } = await this.supabaseService.client
      .from('cupones')
      .select('*')
      .eq('codigo', codigo);
    if (error) console.error('Error:', error);
    return data && data.length > 0 ? data[0] : null;
  }

  async crearCompra(compra: any) {
    const { error } = await this.supabaseService.client
      .from('compras')
      .insert([compra]);
    return { error };
  }

  
}