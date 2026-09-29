import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class LogsService {
  constructor(private supabaseService: SupabaseService, private authService: AuthService) {}

  async registrar(accion: string) {
    const usuario = this.authService.usuario();
    if (!usuario) return;

    await this.supabaseService.client
      .from('logs')
      .insert([{ usuario_id: usuario.id, accion: accion }]);
  }
}