import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router , RouterLink} from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  form: FormGroup;
  error = signal(''); // guarda el mensaje de error que devuelve Supabase
  cargando = signal(false); // indica si se esta esperando la respuesta de supabase,
                            // sirve para deshabilitar el boton y que no se registre dos veces

  tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']; // lista de datos. 
  coloresOjos = ['Marrones', 'Negros', 'Verdes', 'Azules', 'Grises', 'Otro'];

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) { // manda al usuario a otra pagina cuando termina
    this.form = this.fb.group({ // crea el formulario y las validaciones. 
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      dia: ['', [Validators.required, Validators.min(1), Validators.max(31)]],
      mes: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      anio: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      tipo_sangre: ['', Validators.required],
      color_ojos: ['', Validators.required],
      dias_vacaciones: ['', [Validators.required, Validators.min(0), Validators.max(365)]]
    });
  }

  async registrar() {
    this.cargando.set(true);
    this.error.set('');

    const valores = this.form.value;
    const fecha = valores.anio + '-' + String(valores.mes).padStart(2, '0') + '-' + String(valores.dia).padStart(2, '0');
      // El formato de fecha es AAAA/MM/DD
    const { error } = await this.authService.registrar({
      email: valores.email,
      password: valores.password,
      nombre: valores.nombre,
      apellido: valores.apellido,
      fecha_nacimiento: fecha,
      tipo_sangre: valores.tipo_sangre,
      color_ojos: valores.color_ojos,
      dias_vacaciones: valores.dias_vacaciones
    });

    this.cargando.set(false);

    if (error) {
      this.error.set(error.message); // si se rechaza el registro muestra un mensaje. 
    } else {
      this.router.navigate(['/']); // si todo sale bien manda al usuario a la pagina principal
    }
  }
}