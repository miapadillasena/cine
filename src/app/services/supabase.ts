import { Injectable } from '@angular/core'; 
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' }) // Angular crea una sola instancia del servicio en toda la app
export class SupabaseService { 
  private supabase: SupabaseClient;// variable donde se guarda la conexion

  constructor() { // se ejecuta solo cuando angular crea el servicio. 
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client(): SupabaseClient {
    return this.supabase; // se puede leer pero no pisar. 
  }
}
