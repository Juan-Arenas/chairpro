# 🚀 Guía de Arquitectura, Base de Datos y Hosting — ChairPro SaaS

Esta guía explica en detalle cómo está estructurada la plataforma multi-empresa de ChairPro, cómo funcionan los roles de acceso, y por qué **no necesitas comprar un VPS** en este momento.

---

## 1. 💡 ¿VPS o Servicios Cloud Modernos? (Respuesta a tu duda)

### ❌ ¿Por qué NO recomendamos comprar un VPS tradicional (DigitalOcean, Linode, AWS EC2 clásico)?
1. **Costo innecesario:** Un VPS te cuesta entre $10 y $40 USD al mes desde el día 1, incluso sin usuarios activos.
2. **Mantenimiento pesado:** En un VPS debes configurar manualmente Linux (Ubuntu), instalar Node.js, configurar Nginx como Reverse Proxy, renovar certificados SSL (Let's Encrypt), parches de seguridad y backups de PostgreSQL. Si el servidor se cae, tú tienes que reiniciarlo.
3. **Escalabilidad manual:** Si una barbería tiene un pico de reservas, debes redimensionar el VPS a mano.

---

### ✅ La Arquitectura Recomendada (100% Profesional y Económica)

| Capa | Servicio Recomendado | Costo Inicial | Ventajas |
|---|---|---|---|
| **Frontend & API (Next.js)** | **Vercel** o **Railway** | **Gratis** (Hobby) | Despliegue en 1 clic desde GitHub, CDN global ultrarrápida, SSL automático, cero mantenimiento de servidores. |
| **Base de Datos Multi-Tenant** | **Supabase** (PostgreSQL) | **Gratis** (hasta 500MB y 50k usuarios) | Base de datos relacional potente con **Row Level Security (RLS)** nativo para aislar barberías, backups automáticos y autenticación lista. |
| **Almacenamiento de Logos/Fotos** | **Supabase Storage** | **Gratis** (1GB) | Para que las barberías suban sus logos y fondos directamente. |

---

## 2. 🛡️ Separación Estricta de Roles (RBAC)

La plataforma cuenta con 4 niveles de acceso completamente aislados:

```
[ SuperAdmin (Martín & Equipo) ]
               │
               ▼
[ Dueño / Administrador de la Barbería ]
               │
               ▼
      [ Barbero / Empleado ]
               │
               ▼
       [ Cliente Final ]
```

### 👑 1. SuperAdmin (Martín & Equipo) — `/superadmin`
- **¿Qué ve?**
  - Métricas de toda la plataforma SaaS: Número de barberías suscritas, barberías activas, citas procesadas y MRR (Facturación mensual recurrente).
  - Listado de todas las barberías con su plan, ciudad y estado.
  - Botón para dar de alta una nueva barbería con su propio correo, slug y plan.
  - Botón "Entrar a gestionar", que permite al equipo entrar a cualquier barbería en modo soporte.

### 💼 2. Dueño / Administrador de Barbería — `/dashboard`
- **¿Qué ve?**
  - Panel operativo y financiero de su barbería: ingresos totales, margen neto, gastos, comisiones de todos los barberos.
  - Control de inventario y stock de productos.
  - Base de clientes completa, fidelización y control de no-show.
  - **Branding Studio (`/branding`):** Cambia el nombre, logo, color de marca (azul, verde, oro, etc.), modo oscuro/claro y fondos de pantalla en vivo.
- **¿Qué NO puede ver?**
  - No puede ver los datos ni las métricas de otras barberías.

### ✂️ 3. Barbero / Empleado — `/calendar`, `/commissions`, `/appointments`
- **¿Qué ve?**
  - Su agenda personal y calendario de turnos.
  - Sus citas asignadas (marcar inicio de corte, completado o inasistencia).
  - Sus comisiones ganadas y acumuladas del mes.
  - Sus clientes atendidos.
  - Su horario de trabajo y descansos.
- **¿Qué NO puede ver? (Protección estricta)**
  - ❌ CERO acceso a finanzas globales de la barbería.
  - ❌ CERO acceso a las comisiones de otros compañeros barberos.
  - ❌ CERO acceso al inventario, costos de productos o configuración del negocio.
  - ❌ CERO acceso a automatizaciones o al Branding Studio del dueño.

### 👤 4. Cliente — `/booking/[slug]`
- **¿Qué ve?**
  - Portal de reservas público adaptado con los colores, logo y fondo que el dueño configuró.
  - Catálogo de servicios y precios de la barbería.
  - Selección de barbero y horario disponible en tiempo real.
  - Formulario de reserva rápido (sin necesidad de crear contraseñas).
  - Ticket digital con código de confirmación y código QR.
  - Pestaña para consultar sus citas y puntos del club de fidelidad con su teléfono.
- **¿Qué NO puede ver?**
  - ❌ Ningún acceso a la administración, agenda interna ni panel de barberos.

---

## 3. 🎨 Motor de Personalización de Marca (White-Label en Vivo)

Cada barbería puede entrar a **Branding Studio (`/branding`)** y configurar:

1. **Color de Marca:** Selector de paletas (Violeta, Verde Esmeralda, Azul Neón, Oro Luxury, Rojo Carmesí) o picker hexadecimal personalizado.
2. **Tema:** Modo Oscuro Moderno vs Modo Claro Elegante.
3. **Fondo de Pantalla (Wallpaper):** Ladrillo vintage, madera de roble, neón cyberpunk, textura de carbono, o cualquier URL de imagen externa con slider de opacidad para garantizar lectura óptima.
4. **Logo y Slogan:** Emblema personalizado y nombre comercial.

El motor de temas inyecta dinámicamente las variables CSS (`--brand-primary`, `--brand-primary-rgb`, `--brand-glow`) para que **todos los botones, badges, bordes activos y elementos visuales cambien en tiempo real** tanto en el panel como en el portal del cliente.

---

## 4. 🗄️ Pasos para conectar Supabase en Producción (Cuando estés listo)

1. Ingresa a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Crea un nuevo proyecto llamado `chairpro-saas`.
3. Ve a la pestaña **SQL Editor** en Supabase.
4. Abre el archivo [supabase-schema.sql](file:///c:/Users/MARTIN/Downloads/Demo%20Barber%C3%ADa/chairpro/supabase-schema.sql) que dejamos en el proyecto, copia su contenido y presiona **Run**.
5. Ve a **Settings -> API** en Supabase y copia:
   - `Project URL`
   - `anon public key`
6. Crea un archivo `.env.local` en la raíz de `chairpro`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
   ```
7. ¡Listo! La base de datos relacional con aislamiento RLS estará conectada.
