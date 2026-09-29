import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  constructor(private supabaseService: SupabaseService) {}

  async obtenerCompras() {
    const { data, error } = await this.supabaseService.client
      .from('compras')
      .select('created_at, total, butacas')
      .eq('estado', 'pagada');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async obtenerEntradas() {
    const { data, error } = await this.supabaseService.client
      .from('entradas')
      .select('compras(created_at), funciones(peliculas(nombre))');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async obtenerVentasCandy() {
    const { data, error } = await this.supabaseService.client
      .from('compra_productos')
      .select('producto_id, combo_id, cantidad, compras(estado)');
    if (error) console.error('Error:', error);
    return data || [];
  }

  async obtenerLogs() {
    const { data, error } = await this.supabaseService.client
      .from('logs')
      .select('*, usuarios(nombre, apellido)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) console.error('Error:', error);
    return data || [];
  }
}