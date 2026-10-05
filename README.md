# CINE. — Venta de entradas y candy bar

Trabajo Práctico N°1 — Programación IV (2026 C2)

**App publicada:** https://cine-self-nine.vercel.app
**Repositorio:** https://github.com/miapadillasena/cine

## Descripción

Aplicación web para un cine que permite ver la cartelera, comprar entradas eligiendo butacas en un mapa en tiempo real, sumar productos del candy bar y retirar todo con un código QR. Tiene cuatro tipos de usuario:

| Rol | Qué puede hacer |
|---|---|
| Anónimo | Ver cartelera y detalle de películas, comprar entradas |
| Registrado | Lo anterior + descuento de primera compra, cupones, puntos, crédito, cancelar compras, reseñas, alertas de estreno, canjes |
| Empleado | Validar entradas, entregar candy y canjes ingresando el código |
| Admin | Lo anterior + ABM de películas, funciones, candy, configuración y reportes |

## Tecnologías

- **Angular 22** con componentes standalone, signals, control flow (`@if`, `@for`, `@switch`), Reactive Forms y lazy loading
- **Supabase**: base de datos PostgreSQL, Auth, Storage, Realtime, políticas RLS y triggers
- **PWA** con `@angular/pwa` (Service Worker + manifest)
- **qrcode** para generar el QR y **jsPDF** para generar los PDF (autorizadas por el profesor)
- **Vercel** para el deploy

## Estructura del proyecto

```
src/app/
├── components/     navbar, mapa-butacas, tarjeta-pelicula
├── directives/     resaltar (efecto hover en tarjetas)
├── guards/         auth, admin, empleado
├── pages/
│   ├── home/               cartelera, más vendidas, próximamente
│   ├── pelicula-detalle/   funciones, reseñas
│   ├── compras/            flujo de compra en 4 pasos
│   ├── login/ registro/
│   ├── perfil/             compras, películas vistas, puntos y canjes
│   ├── validacion/         pantalla del empleado
│   └── admin/              panel con rutas hijas: películas, funciones, candy, configuración, reportes
├── pipes/          duracion (minutos → "2h 05min")
└── services/       un servicio por módulo, todos usan SupabaseService
```

## Rutas

| Ruta | Página | Protección |
|---|---|---|
| `/` | Home | — |
| `/pelicula/:id` | Detalle de película | — |
| `/compra/:id` | Compra de una función | — |
| `/login`, `/registro` | Autenticación | — |
| `/perfil` | Mi perfil | `authGuard` (canActivate) |
| `/validacion` | Validación de códigos | `empleadoGuard` (canActivate) |
| `/admin/...` | Panel de administración | `adminGuard` (canMatch) |

Todas las páginas se cargan con lazy loading (`loadComponent` / `loadChildren`).

## Reglas de negocio

- **Sala:** filas A a T sin la K (518 butacas). La fila J es accesible con distribución 2-10-2. Las filas R, S y T son VIP, con recargo configurable.
- **Funciones:** entre funciones de una misma sala tiene que haber 30 minutos libres. La sala se asigna automáticamente al crear la función.
- **Preventa:** la venta abre 7 días antes del estreno, con precio de preventa hasta el día del estreno.
- **Compra:** máximo 10 butacas. Si la película es +13 o +18 se controla la edad del comprador.
- **Combos:** cada combo incluye una entrada, un pochoclo y una bebida.
- **Descuentos:** 20 % en la primera compra (configurable) o cupón para mayores de 50 años. Se aplica uno solo, el mayor.
- **Puntos:** 1 peso pagado = 1 punto. Los puntos se canjean por recompensas.
- **Cancelación:** hasta 2 horas antes de la función y si la entrada no fue validada. No se devuelve dinero: el total se acredita como crédito para futuras compras.

## Base de datos (Supabase)

Las reglas importantes se controlan en la base de datos y no solo en Angular, para que no se puedan saltear desde el navegador:

| Trigger / función | Qué hace |
|---|---|
| `crear_usuario` | Al registrarse, crea la fila en `usuarios` con los datos del formulario y rol `usuario` |
| `procesar_compra` | Al insertar una compra: controla el crédito, crea las entradas y los productos, suma puntos y descuenta crédito. Todo en una sola operación |
| `controlar_compra` | Solo permite cancelar compras pagadas, no validadas y con más de 2 h de anticipación. Libera las butacas, devuelve el crédito y descuenta los puntos |
| `proteger_usuario` | Impide que un usuario se modifique a sí mismo los puntos, el crédito o el rol |
| `procesar_canje` | Calcula el costo del canje y descuenta los puntos |
| `es_admin()` | Función usada en las políticas RLS para no generar recursión sobre `usuarios` |

- **RLS** activado en todas las tablas: lectura pública de cartelera, cada usuario ve solo sus datos, y empleado/admin tienen permisos extra.
- **`entradas`** tiene `unique (funcion_id, fila, numero)`: si dos personas compran la misma butaca al mismo tiempo, la segunda recibe el error `23505` y vuelve a elegir.
- **Realtime** sobre `entradas`: el mapa de butacas se actualiza solo cuando otra persona compra.
- **Storage:** buckets `peliculas` y `productos` para las imágenes. Solo el admin puede subir.

## Decisiones técnicas

- **Signals** para todo el estado de los componentes, y `computed` para totales, descuentos y filtros.
- **Butacas e items en `jsonb`** dentro de la compra: el trigger los recorre con `jsonb_array_elements` para crear las entradas. Así la compra es atómica.
- **Validación por código:** el QR contiene el código de la compra. La pantalla del empleado busca ese código escrito a mano. No se usó lectura con cámara porque no se habilitó una librería para eso.
- **Reportes:** se exportan a PDF con jsPDF. La exportación a Excel no se implementó porque no se habilitó una librería para eso.
- **Vercel:** `vercel.json` redirige todas las rutas a `index.html` para que funcionen el F5 y los links directos.
- **PWA:** el Service Worker guarda en caché los archivos de la app. Sin conexión carga la estructura, pero los datos necesitan internet porque vienen de Supabase.

## Limitaciones conocidas

- Los precios se calculan en Angular y el trigger de compra los guarda tal como llegan. Una mejora sería recalcularlos en la base de datos.
- La pantalla de validación no lee el QR con la cámara; el código se ingresa a mano.

## Cómo correrlo

```bash
npm install
ng serve
```

Abrir http://localhost:4200

Para probar la PWA (el Service Worker no funciona con `ng serve`):

```bash
ng build --configuration production
npx http-server dist/cine/browser -p 8080
```

## Usuarios de prueba

[Completar o indicar que se envían por privado]