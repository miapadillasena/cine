import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class AlertasService {
  notificaciones = signal<any[]>([]);

  constructor(private supabaseService: SupabaseService) {}

  async obtenerIdsAlertas(usuarioId: string) {
    const { data, error } = await this.supabaseService.client
      .from('alertas')
      .select('pelicula_id')
      .eq('usuario_id', usuarioId);
    if (error) console.error('Error:', error);
    return (data || []).map(a => a.pelicula_id);
  }

  async activarAlerta(usuarioId: string, peliculaId: number) {
    const { error } = await this.supabaseService.client
      .from('alertas')
      .insert([{ usuario_id: usuarioId, pelicula_id: peliculaId }]);
    return { error };
  }

  async quitarAlerta(usuarioId: string, peliculaId: number) {
    const { error } = await this.supabaseService.client
      .from('alertas')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('pelicula_id', peliculaId);
    return { error };
  }

  async revisar(usuarioId: string) {
    const { data, error } = await this.supabaseService.client
      .from('alertas')
      .select('pelicula_id, peliculas(id, nombre, fecha_estreno, funciones(id))')
      .eq('usuario_id', usuarioId)
      .eq('notificada', false);
    if (error) console.error('Error:', error);

    const hoy = new Date();
    const disponibles = (data || []).filter((alerta: any) => {
      const pelicula = alerta.peliculas;
      if (pelicula.funciones.length === 0) return false;
      if (!pelicula.fecha_estreno) return true;
      const apertura = new Date(pelicula.fecha_estreno + 'T00:00:00');
      apertura.setDate(apertura.getDate() - 7);
      return hoy >= apertura;
    });

    this.notificaciones.set(disponibles);
  }

  async marcarLeida(usuarioId: string, peliculaId: number) {
    await this.supabaseService.client
      .from('alertas')
      .update({ notificada: true })
      .eq('usuario_id', usuarioId)
      .eq('pelicula_id', peliculaId);
    this.notificaciones.update(lista => lista.filter(n => n.pelicula_id !== peliculaId));
  }

  limpiar() {
    this.notificaciones.set([]);
  }
}