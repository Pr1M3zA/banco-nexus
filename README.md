//# Banco Nexus

Sistema bancario distribuido utilizando MongoDB, Node.js y React.

Proyecto académico para la materia de Sistemas Distribuidos.

## Tecnologías utilizadas

- React
- Vite
- TailwindCSS


# Configuración del Frontend

## 1. Entrar a la carpeta app

```bash
cd .\app\
```

## 2. Instalar dependencias

```bash
npm install
```
## Instalación de TailwindCSS

```bash
npm install -D tailwindcss @tailwindcss/vite
```
## 3. Ejecutar proyecto

```bash
npm run dev
```

## 4. Abrir en navegador

```txt
http://localhost:5173
```

## 🧪 Pruebas de Concurrencia y Sincronización (Etapa 2)

Se ha creado un entorno de pruebas para simular el estrés en la base de datos cuando múltiples sucursales intentan modificar el saldo de una misma cuenta de manera simultánea.

Esta prueba inyecta 5 operaciones (depósitos y retiros) desde distintas sucursales (CDMX, GDL, MTY, TIJ, CUN) exactamente al mismo tiempo utilizando `Promise.all` e interactuando directamente con MongoDB usando operadores atómicos (`$inc`).

### ¿Cómo ejecutar la simulación?

**Requisitos previos:**
1. Asegúrate de tener tu servidor local de MongoDB corriendo.
2. Debes tener la base de datos `BancoNexus` inicializada con el script base para que exista al menos una cuenta (ej. `NX01001`).

**Ejecución:**
Abre tu terminal en la raíz del proyecto y ejecuta el siguiente script:

```bash
node concurrency-simulation/concurrentSimulator.js
