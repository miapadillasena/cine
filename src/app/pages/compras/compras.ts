import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ComprasService } from '../../services/compras';
import { CandyService } from '../../services/candy';
import { SupabaseService } from '../../services/supabase';
import { AuthService } from '../../services/auth';
import { MapaButacas } from '../../components/mapa-butacas/mapa-butacas';
import { ResaltarDirective } from '../../directives/resaltar.directive';
import { EntradaPdfService } from '../../services/entrada-pdf'; 


@Component({
  selector: 'app-compra',
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink, MapaButacas, ResaltarDirective],
  templateUrl: './compras.html',
  styleUrl: './compras.css'
})
export class Compra implements OnInit, OnDestroy {
  funcion = signal<any>(null);
  ocupadas = signal<string[]>([]);
  seleccionadas = signal<any[]>([]);
  recargoVip = signal(0);
  aviso = signal('');
  paso = signal(1);
  canal: any;

  categorias = signal<any[]>([]);
  productos = signal<any[]>([]);
  combos = signal<any[]>([]);
  cantidadesProductos = signal<any>({});
  cantidadesCombos = signal<any>({});

  porcentajePrimera = signal(20);
  esPrimeraCompra = signal(false);
  fechaNacimiento = signal('');
  codigoCupon = signal('');
  cupon = signal<any>(null);
  mensajeCupon = signal('');
  usarCredito = signal(false);
  medioPago = signal('');
  mediosPago = ['Tarjeta de crédito', 'Tarjeta de débito', 'Mercado Pago'];
  procesando = signal(false);
  errorPago = signal('');
  codigoCompra = signal('');
  totalPagado = signal(0);
  puntosGanados = signal(0);
  qrCompra = signal('');

  precioBase = computed(() => {
    const f = this.funcion();
    if (!f) return 0;
    const p = f.peliculas;
    if (p.fecha_estreno && p.precio_preventa && new Date() < new Date(p.fecha_estreno + 'T00:00:00')) {
      return p.precio_preventa;
    }
    return f.precio;
  });

  hayVip = computed(() => this.seleccionadas().some(b => b.vip));

  totalEntradas = computed(() => {
    let suma = 0;
    for (const butaca of this.seleccionadas()) {
      suma += this.precioButaca(butaca);
    }
    return suma;
  });

  productosPorCategoria = computed(() => {
    return this.categorias()
      .map(categoria => ({
        nombre: categoria.nombre,
        productos: this.productos().filter(p => p.categoria_id === categoria.id)
      }))
      .filter(grupo => grupo.productos.length > 0);
  });

  productosElegidos = computed(() => this.productos().filter(p => this.cantidadProducto(p.id) > 0));
  combosElegidos = computed(() => this.combos().filter(c => this.cantidadCombo(c.id) > 0));

  totalCombosElegidos = computed(() => {
    let total = 0;
    for (const combo of this.combos()) {
      total += this.cantidadCombo(combo.id);
    }
    return total;
  });

  totalCandy = computed(() => {
    let suma = 0;
    for (const producto of this.productosElegidos()) {
      suma += producto.precio * this.cantidadProducto(producto.id);
    }
    for (const combo of this.combosElegidos()) {
      suma += combo.precio * this.cantidadCombo(combo.id);
    }
    return suma;
  });

  descuentoCombos = computed(() => this.totalCombosElegidos() * this.precioBase());

  subtotal = computed(() => this.totalEntradas() - this.descuentoCombos() + this.totalCandy());

  edadMinima = computed(() => {
    const f = this.funcion();
    if (!f) return 0;
    if (f.peliculas.restriccion === '+18') return 18;
    if (f.peliculas.restriccion === '+13') return 13;
    return 0;
  });

  edadComprador = computed(() => {
    const usuario = this.authService.usuario();
    if (usuario) return this.calcularEdad(usuario.fecha_nacimiento);

    const texto = this.fechaNacimiento();
    if (!/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(texto)) return null;
    const partes = texto.split('/');
    return this.calcularEdad(partes[2] + '-' + partes[1] + '-' + partes[0]);
  });

  bloqueoEdad = computed(() => {
    const minima = this.edadMinima();
    if (minima === 0) return '';
    const edad = this.edadComprador();
    if (edad === null) return 'Ingresá tu fecha de nacimiento (DD/MM/AAAA).';
    if (edad < minima) return 'Tenés que tener ' + minima + ' años o más para ver esta película.';
    return '';
  });

  descuentoPrimera = computed(() => this.esPrimeraCompra() ? this.subtotal() * this.porcentajePrimera() / 100 : 0);
  descuentoCupon = computed(() => this.cupon() ? this.subtotal() * this.cupon().porcentaje / 100 : 0);
  descuento = computed(() => Math.round(Math.max(this.descuentoPrimera(), this.descuentoCupon())));
  totalConDescuento = computed(() => this.subtotal() - this.descuento());
  creditoDisponible = computed(() => this.authService.usuario()?.credito || 0);
  creditoUsado = computed(() => this.usarCredito() ? Math.min(this.creditoDisponible(), this.totalConDescuento()) : 0);
  totalAPagar = computed(() => this.totalConDescuento() - this.creditoUsado());
  puntosAGanar = computed(() => this.authService.usuario() ? Math.floor(this.totalAPagar()) : 0);

  noDisponible = computed(() => {
    const f = this.funcion();
    if (!f) return '';
    if (this.paso() === 4) return '';
    if (new Date(f.inicio) < new Date()) return 'Esta función ya comenzó.';
    const p = f.peliculas;
    if (p.fecha_estreno) {
      const apertura = new Date(p.fecha_estreno + 'T00:00:00');
      apertura.setDate(apertura.getDate() - 7);
      if (new Date() < apertura) return 'La venta para esta película todavía no abrió.';
    }
    return '';
  });

    constructor(
    private route: ActivatedRoute,
    private comprasService: ComprasService,
    private candyService: CandyService,
    private supabaseService: SupabaseService,
    public authService: AuthService,
    private entradaPdfService: EntradaPdfService
  ) {}

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    await this.authService.cargarUsuario();
    this.funcion.set(await this.comprasService.obtenerFuncion(id));

    const config = await this.comprasService.obtenerConfiguracion();
    this.recargoVip.set(config.recargo_vip);
    this.porcentajePrimera.set(config.porcentaje_primera_compra);

    const usuario = this.authService.usuario();
    if (usuario) {
      this.esPrimeraCompra.set(await this.comprasService.esPrimeraCompra(usuario.id));
    }

    this.categorias.set(await this.candyService.obtenerCategorias());
    this.productos.set(await this.candyService.obtenerProductos());
    this.combos.set(await this.candyService.obtenerCombos());

    await this.cargarOcupadas();

    this.canal = this.supabaseService.client
      .channel('butacas-funcion-' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'entradas', filter: 'funcion_id=eq.' + id }, (payload: any) => {
        const clave = payload.new.fila + '-' + payload.new.numero;
        this.ocupadas.update(lista => [...lista, clave]);

        const laTenia = this.seleccionadas().some(b => b.fila + '-' + b.numero === clave);
        if (laTenia && !this.procesando() && this.paso() !== 4) {
          this.seleccionadas.update(lista => lista.filter(b => b.fila + '-' + b.numero !== clave));
          this.aviso.set('La butaca ' + payload.new.fila + payload.new.numero + ' acaba de ser comprada por otra persona.');
          this.paso.set(1);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'entradas' }, () => {
        this.cargarOcupadas();
      })
      .subscribe();
  }

  ngOnDestroy() {
    if (this.canal) {
      this.supabaseService.client.removeChannel(this.canal);
    }
  }

  async cargarOcupadas() {
    this.ocupadas.set(await this.comprasService.obtenerOcupadas(this.funcion().id));
  }

  precioButaca(butaca: any) {
    return butaca.vip ? this.precioBase() + this.recargoVip() : this.precioBase();
  }

  continuar() {
    this.aviso.set('');
    if (this.totalCombosElegidos() > this.seleccionadas().length) {
      this.cantidadesCombos.set({});
    }
    this.paso.set(2);
  }

  cantidadProducto(id: number) {
    return this.cantidadesProductos()[id] || 0;
  }

  cambiarProducto(id: number, cambio: number) {
    const nueva = this.cantidadProducto(id) + cambio;
    if (nueva < 0) return;
    this.cantidadesProductos.update(c => ({ ...c, [id]: nueva }));
  }

  cantidadCombo(id: number) {
    return this.cantidadesCombos()[id] || 0;
  }

  cambiarCombo(id: number, cambio: number) {
    const nueva = this.cantidadCombo(id) + cambio;
    if (nueva < 0) return;

    if (cambio > 0 && this.totalCombosElegidos() >= this.seleccionadas().length) {
      this.aviso.set('Cada combo incluye una entrada: podés elegir hasta ' + this.seleccionadas().length + ' combos.');
      return;
    }

    this.aviso.set('');
    this.cantidadesCombos.update(c => ({ ...c, [id]: nueva }));
  }

  nombreProducto(id: number) {
    return this.productos().find(p => p.id === id)?.nombre || '—';
  }

  calcularEdad(fecha: string) {
    const nacimiento = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const noCumplioTodavia =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
    if (noCumplioTodavia) edad--;
    return edad;
  }

  async aplicarCupon() {
    this.mensajeCupon.set('');
    const codigo = this.codigoCupon().trim().toUpperCase();
    if (!codigo) return;

    const encontrado = await this.comprasService.buscarCupon(codigo);
    if (!encontrado) {
      this.mensajeCupon.set('El cupón no existe.');
      return;
    }
    if (encontrado.vigente_hasta && new Date(encontrado.vigente_hasta + 'T23:59:59') < new Date()) {
      this.mensajeCupon.set('El cupón está vencido.');
      return;
    }
    const edad = this.edadComprador();
    if (edad === null || edad < 50) {
      this.mensajeCupon.set('Este cupón es solo para mayores de 50 años.');
      return;
    }

    this.cupon.set(encontrado);
    this.mensajeCupon.set('Cupón aplicado: ' + encontrado.porcentaje + '% de descuento.');
  }

   async pagar() {
    this.procesando.set(true);
    this.errorPago.set('');

    const usuario = this.authService.usuario();
    const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();

    const butacas = this.seleccionadas().map(b => ({
      fila: b.fila,
      numero: b.numero,
      vip: b.vip,
      precio: this.precioButaca(b)
    }));

    const items = [
      ...this.productosElegidos().map(p => ({
        producto_id: p.id,
        combo_id: null,
        cantidad: this.cantidadProducto(p.id),
        precio: p.precio
      })),
      ...this.combosElegidos().map(c => ({
        producto_id: null,
        combo_id: c.id,
        cantidad: this.cantidadCombo(c.id),
        precio: c.precio
      }))
    ];

    const usoCupon = this.cupon() && this.descuentoCupon() >= this.descuentoPrimera();

    const { error } = await this.comprasService.crearCompra({
      codigo: codigo,
      usuario_id: usuario ? usuario.id : null,
      funcion_id: this.funcion().id,
      cupon_id: usoCupon ? this.cupon().id : null,
      subtotal: this.subtotal(),
      descuento: this.descuento(),
      credito_usado: this.creditoUsado(),
      total: this.totalAPagar(),
      butacas: butacas,
      items: items
    });

    if (error) {
      this.procesando.set(false);
      if (error.code === '23505') {
        await this.cargarOcupadas();
        this.seleccionadas.update(lista => lista.filter(b => !this.ocupadas().includes(b.fila + '-' + b.numero)));
        this.aviso.set('Una de tus butacas se vendió mientras pagabas. Elegí otra.');
        this.paso.set(1);
      } else {
        this.errorPago.set('No se pudo completar la compra. Intentá de nuevo.');
      }
      return;
    }

    this.codigoCompra.set(codigo);
    this.qrCompra.set(await this.entradaPdfService.generarQr(codigo));
    this.totalPagado.set(this.totalAPagar());
    this.puntosGanados.set(this.puntosAGanar());
    this.paso.set(4);
    this.procesando.set(false);

    if (usuario) {
      await this.authService.cargarUsuario();
    }
  }

  descargarEntrada() {
    this.entradaPdfService.descargar({
      codigo: this.codigoCompra(),
      pelicula: this.funcion().peliculas.nombre,
      sala: this.funcion().salas.nombre,
      inicio: this.funcion().inicio,
      butacas: this.seleccionadas(),
      total: this.totalPagado(),
      tieneCandy: this.productosElegidos().length > 0 || this.combosElegidos().length > 0
    });
  }
}