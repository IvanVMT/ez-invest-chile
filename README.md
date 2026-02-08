# 🇨🇱 Ez Invest - Mercado Chileno

Aplicación PWA avanzada para el seguimiento de inversiones en la Bolsa de Santiago. Diseñada para dispositivos móviles con una experiencia de usuario premium.

## ✨ Características Principales

### 📱 Experiencia Móvil
- **Navegación Intuitiva:** Barra inferior fija con acceso rápido a todas las secciones.
- **Diseño Card-First:** Vista de tarjetas para acciones con logos de empresas.
- **Header Limpio:** Interfaz minimalista centrada en el contenido.

### 💰 Funcionalidades Financieras
- **Mercado en Tiempo Real:** Precios actualizados de 30+ acciones chilenas principales (IPSA).
- **Portafolio:** Seguimiento de tus inversiones, costo promedio y ganancias.
- **Dividendos (¡Nuevo!):** Sistema de simulación de pagos de dividendos con yields reales.
- **Movimientos:** Historial completo de compras, ventas y dividendos recibidos.

### 🤖 Inteligencia Artificial (¡Nuevo!)
- **Asistente IA:** Chatbot integrado potenciado por Google Gemini.
- **Consultas:** Pregunta sobre acciones, tendencias o conceptos financieros.

### 👤 Perfil de Usuario (¡Nuevo!)
- **Resumen Financiero:** Balance total, inversión y retorno.
- **Personalización:** Modos Claro y Oscuro.

## 🛠️ Tecnologías

- **Core:** Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Datos:** Yahoo Finance API (v8), MIndicador.cl (UF/Dólar).
- **Gráficos:** Lightweight Charts (TradingView) & Chart.js.
- **IA:** Google Gemini Pro API.
- **Logos:** Clearbit API.

## 🚀 Instalación (PWA)

Esta aplicación es una Progressive Web App (PWA). Puedes instalarla directamente en tu teléfono:
1. Abre la web en Chrome/Safari.
2. Toca "Compartir" (iOS) o menú (Android).
3. Selecciona "Agregar a Inicio".

## 💻 Desarrollo Local

Para correr el proyecto localmente:

1. Clona el repositorio.
2. Instala [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) en VS Code.
3. Abre `index.html` con Live Server.
4. Para activar el chatbot, configura tu API Key en `src/services/gemini.js`.

### Uso del proxy local (recomendado)

Para evitar exponer claves y problemas de CORS es recomendable usar el proxy local incluido en `server/` durante el desarrollo.

1. Abrir una terminal y entrar a la carpeta `server`:

```bash
cd server
npm install
```

2. Crear un archivo `.env` basado en `.env.example` y poner tu `GEMINI_API_KEY`:

```text
GEMINI_API_KEY=tu_api_key_aqui
PORT=3000
```

3. Iniciar el proxy:

```bash
npm start
```

4. Abrir la app (cliente) en `http://localhost:5500` o el puerto que uses con Live Server. El código cliente intentará usar automáticamente el proxy en `http://localhost:3000` cuando detecte que estás en `localhost`.

Notas:
- El proxy expone `/api/gemini` (POST), `/api/yahoo/quote` (GET) y `/api/yahoo/chart` (GET). Ver `server/README.md` para más detalles.
- No subas tu `.env` con claves al repositorio.


---

*Proyecto desarrollado con asistencia de IA Avanzada.*
