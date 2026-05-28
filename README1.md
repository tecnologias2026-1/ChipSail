# ChipSail – Guía de configuración en VS Code

## 📁 Estructura del proyecto

```
ChipSail/
├── .vscode/
│   ├── extensions.json   ← Extensiones recomendadas
│   ├── launch.json       ← Configuración de depuración (F5)
│   ├── tasks.json        ← Tareas automáticas
│   └── settings.json     ← Configuración del editor
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── Script.js
│   └── assets/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example      ← Copiar a .env y editar
│   ├── database/
│   │   ├── script.sql
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       └── users.js
├── chipsail.http         ← Pruebas de API desde VS Code
└── .gitignore
```

---

## 🚀 Primer uso – paso a paso

### Paso 1 – Abrir el proyecto
Abre la carpeta `ChipSail/` completa en VS Code:
```
Archivo → Abrir carpeta → seleccionar ChipSail/
```

---

### Paso 2 – Instalar extensiones recomendadas
VS Code te preguntará automáticamente. Si no:
```
Ctrl+Shift+P → "Extensions: Show Recommended Extensions" → instalar todas
```

Las más importantes:
| Extensión | Para qué sirve |
|-----------|---------------|
| **Live Server** | Sirve el frontend con recarga automática |
| **REST Client** | Probar la API desde el archivo `.http` |
| **MySQL Client** | Ver la base de datos desde VS Code |

---

### Paso 3 – Configurar el backend

**3a. Crear el archivo .env**

Opción A – desde VS Code:
```
Ctrl+Shift+P → "Tasks: Run Task" → "📋 Copiar .env.example a .env"
```

Opción B – manual: copia `backend/.env.example` y renómbralo a `backend/.env`

**3b. Editar el .env con tus credenciales de MySQL:**
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=chipsail
JWT_SECRET=escribe_cualquier_texto_largo_aqui
JWT_EXPIRES=7d
ALLOWED_ORIGIN=*
```

---

### Paso 4 – Crear la base de datos

**Opción A – Desde la terminal de VS Code** (`Ctrl+ñ`):
```bash
cd backend
mysql -u root -p < database/script.sql
```

**Opción B – Desde VS Code con MySQL Client:**
1. Abre la extensión MySQL Client (icono de base de datos en la barra lateral)
2. Conecta con tus credenciales
3. Abre `backend/database/script.sql`
4. Selecciona todo (`Ctrl+A`) y ejecuta (`Ctrl+Enter`)

---

### Paso 5 – Instalar dependencias del backend

En la terminal de VS Code:
```bash
cd backend
npm install
```

O desde el menú:
```
Ctrl+Shift+P → "Tasks: Run Task" → "🟢 Instalar dependencias del backend"
```

---

### Paso 6 – Iniciar el proyecto

#### Opción A – Con F5 (recomendada)
Presiona `F5` o ve a **Ejecutar → Iniciar depuración**.

Selecciona **"🚀 ChipSail completo (Back + Front)"** para arrancar todo junto.

O por separado:
- **"🟢 Backend – Node.js"** → inicia el servidor en puerto 3000
- **"🌐 Frontend – Live Server"** → abre el HTML en el navegador

#### Opción B – Manual
**Terminal 1 – Backend:**
```bash
cd backend
node server.js
# ✅ ChipSail API corriendo en http://localhost:3000
```

**Terminal 2 – Frontend:**
Clic derecho sobre `frontend/index.html` → **"Open with Live Server"**
```
http://127.0.0.1:5500/frontend/index.html
```

---

## 🧪 Probar la API desde VS Code

Abre el archivo `chipsail.http` y haz clic en **"Send Request"** sobre cada bloque.

Flujo de prueba:
1. `GET /` → verifica que el servidor responde
2. `POST /api/auth/register` → crea un usuario
3. `POST /api/auth/login` → obtén el token
4. Copia el token en la variable `@token` al inicio del archivo
5. `GET /api/users` → prueba un endpoint protegido

---

## 🔍 Depuración

Con la configuración **"🟢 Backend – Node.js"** activa en F5 puedes:
- Poner **breakpoints** haciendo clic al lado del número de línea
- Ver variables en tiempo real en el panel "Variables"
- Usar la consola de depuración integrada

---

## ❓ Problemas comunes

| Error | Solución |
|-------|----------|
| `ECONNREFUSED 3306` | MySQL no está corriendo. Inicia el servicio MySQL |
| `Access denied for user` | Credenciales incorrectas en `.env` |
| `EADDRINUSE 3000` | El puerto 3000 está ocupado. Cambia `PORT` en `.env` |
| CORS bloqueado en el navegador | Verifica que `ALLOWED_ORIGIN=*` está en `.env` |
| Live Server no abre | Instala la extensión **Live Server** y reinicia VS Code |
