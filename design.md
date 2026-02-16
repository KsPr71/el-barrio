# Diseño de Interfaz - App Boilerplate Rojo Amarillo

## Orientación y Uso
- **Orientación**: Móvil vertical (9:16)
- **Uso**: Una mano
- **Estilo**: iOS Human Interface Guidelines (HIG)

## Paleta de Colores
- **Rojo principal**: #DC2626 (color primario/acento)
- **Amarillo secundario**: #FBBF24 (color de soporte/destacados)
- **Fondo claro**: #FFFFFF
- **Fondo oscuro**: #151718
- **Superficie clara**: #FEF2F2 (tinte rojo suave)
- **Superficie oscura**: #1E2022
- **Texto primario claro**: #11181C
- **Texto primario oscuro**: #ECEDEE
- **Texto secundario claro**: #687076
- **Texto secundario oscuro**: #9BA1A6
- **Bordes claro**: #FCA5A5 (tinte rojo claro)
- **Bordes oscuro**: #991B1B (tinte rojo oscuro)

## Lista de Pantallas

### 1. Inicio (Home)
**Contenido principal:**
- Sección hero con título de bienvenida
- Tarjetas de ejemplo con estilo rojo/amarillo
- Botones de acción principales

**Funcionalidad:**
- Navegación a otras secciones mediante tabs
- Interacción con botones de ejemplo
- Scroll vertical para contenido adicional

### 2. Explorar (Explore)
**Contenido principal:**
- Lista de elementos/items con tarjetas
- Cada tarjeta muestra información resumida
- Uso de colores rojo y amarillo en badges/etiquetas

**Funcionalidad:**
- Scroll vertical para ver más elementos
- Tap en tarjetas para ver detalles
- Pull-to-refresh para actualizar contenido

### 3. Perfil (Profile)
**Contenido principal:**
- Avatar/icono de usuario
- Información del usuario
- Lista de configuraciones y opciones

**Funcionalidad:**
- Editar información de perfil
- Acceso a configuraciones
- Cerrar sesión (si aplica)

## Flujos de Usuario Principales

### Flujo 1: Navegación entre tabs
1. Usuario abre la app → Pantalla de Inicio
2. Usuario toca tab "Explorar" → Pantalla de Explorar
3. Usuario toca tab "Perfil" → Pantalla de Perfil
4. Usuario puede volver a "Inicio" en cualquier momento

### Flujo 2: Abrir menú lateral
1. Usuario está en cualquier pantalla
2. Usuario desliza desde el borde izquierdo O toca el icono de menú
3. Se abre el drawer con opciones adicionales
4. Usuario selecciona una opción → Navega a esa sección
5. Usuario cierra el drawer deslizando hacia la izquierda o tocando fuera

### Flujo 3: Interacción con tarjetas
1. Usuario está en pantalla de Explorar
2. Usuario hace scroll para ver tarjetas
3. Usuario toca una tarjeta → Navega a pantalla de detalle
4. Usuario ve información completa
5. Usuario toca botón "Volver" → Regresa a Explorar

## Componentes Clave

### Tab Bar
- 3 tabs: Inicio, Explorar, Perfil
- Iconos con color rojo cuando están activos
- Fondo con tema adaptable (claro/oscuro)

### Drawer (Menú Lateral)
- Header con logo/título de la app
- Lista de opciones de navegación
- Iconos con acento rojo
- Separadores con color amarillo suave
- Footer con información de versión

### Tarjetas
- Bordes redondeados (rounded-2xl)
- Sombra sutil
- Borde con tinte rojo
- Contenido: título (texto rojo), descripción (texto secundario)
- Badge amarillo para destacar información

### Botones
- Primarios: fondo rojo, texto blanco
- Secundarios: borde rojo, texto rojo, fondo transparente
- Efecto de press: escala 0.97 + opacidad

## Notas de Implementación
- Usar `ScreenContainer` para todas las pantallas
- Implementar navegación con Expo Router y React Navigation Drawer
- Usar NativeWind (Tailwind CSS) para estilos
- Mantener consistencia con iOS HIG
- Asegurar que todos los elementos táctiles tengan feedback visual
- Implementar modo oscuro automático
