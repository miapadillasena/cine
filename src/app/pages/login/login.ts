import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  form: FormGroup;
  error = signal('');
  cargando = signal(false);

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({ // los campos obligatorios y el mail tiene que ser en un formato valido. 
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async iniciarSesion() {
    this.cargando.set(true);
    this.error.set(''); // marca que empezo y borra errores anteriores. 

    const { error } = await this.authService.iniciarSesion(this.form.value.email, this.form.value.password);
      // llama al metodo sel servicio con lo que escribio el usuario. 
    this.cargando.set(false);

    if (error) {
      this.error.set('Mail o contraseña incorrectos.'); // mensaje de error
    } else {
      this.router.navigate(['/']); // si todo sale bien mmanda a la pagina principal. 
    }
  }
}