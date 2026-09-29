import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  usuario = signal<any>(null);

  constructor(private supabaseService: SupabaseService) {}

  async registrar(datos: any) {
    const { data, error } = await this.supabaseService.client.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          fecha_nacimiento: datos.fecha_nacimiento,
          tipo_sangre: datos.tipo_sangre,
          color_ojos: datos.color_ojos,
          dias_vacaciones: datos.dias_vacaciones
        }
      }
    });
    if (!error) {
      await this.cargarUsuario();
    }
    return { data, error };
  }

  async iniciarSesion(email: string, password: string) {
    const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
      email: email,
      password: password
    });
    if (!error) {
      await this.cargarUsuario();
    }
    return { data, error };
  }

  async cerrarSesion() {
    await this.supabaseService.client.auth.signOut();
    this.usuario.set(null);
  }

  async cargarUsuario() {
    const { data: { session } } = await this.supabaseService.client.auth.getSession();
    if (session) {
      const { data } = await this.supabaseService.client.from('usuarios').select('*');
      if (data && data.length > 0) {
        this.usuario.set(data[0]);
      }
    } else {
      this.usuario.set(null);
    }
  }
}