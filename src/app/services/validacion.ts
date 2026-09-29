import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class ValidacionService {
  private supabase = inject(SupabaseService);

  async buscarCompra(codigo: string) {
    const { data } = await this.supabase.client
      .from('compras')
      .select('*, funciones(inicio, peliculas(nombre), salas(nombre))')
      .eq('codigo', codigo);

    if (!data || data.length === 0) {
      return null;
    }
    return data[0];
  }

  async validarEntrada(id: number) {
    const { error } = await this.supabase.client
      .from('compras')
      .update({ entrada_validada: true })
      .eq('id', id);
    return error;
  }

  async entregarCandy(id: number) {
    const { error } = await this.supabase.client
      .from('compras')
      .update({ candy_entregado: true })
      .eq('id', id);
    return error;
  }

  async buscarCanje(codigo: string) {
    const { data } = await this.supabase.client
      .from('canjes')
      .select('*, recompensas(nombre)')
      .eq('codigo', codigo);

    if (!data || data.length === 0) {
      return null;
    }
    return data[0];
  }

  async marcarCanjeUsado(id: number) {
    const { error } = await this.supabase.client
      .from('canjes')
      .update({ usado: true })
      .eq('id', id);
    return error;
  }
}