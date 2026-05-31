const { MongoClient, ServerApiVersion } = require("mongodb");
const bcrypt = require("bcrypt");
const dns = require("dns");
dns.setServers(["8.8.8.8"]);

const MONGO_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_SERVER}`;
const DB_NAME = "BancoNexus";
const SALT_ROUNDS = 10;

function generarContraseña(nombre) {
  return `${nombre.replace(/\s+/g, "")}123!`;
}

function generarNumeroCuenta(idSecuencial) {
  const base = `180${String(idSecuencial).padStart(6, "0")}`;
  const suma = base.split("").reduce((acc, digit) => acc + Number(digit), 0);
  const digitoVerificador = suma % 10;
  return `${base}${digitoVerificador}`;
}

async function main() {
  const client = new MongoClient(MONGO_URI, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true }
  });
 
  await client.connect();
  const db = client.db(DB_NAME);

  db.collection("clientes").drop().catch(() => {});
  db.collection("cuentas").drop().catch(() => {});
  db.collection("beneficiarios").drop().catch(() => {});
  db.collection("transferencias").drop().catch(() => {});
  db.collection("auditoria").drop().catch(() => {});

  // ─────────────────────────────────────────────────────────────
  // 1. Clientes
  // ─────────────────────────────────────────────────────────────

  const clientesBase = [
    { nombre: "Carlos Mendoza", curp: "MERC850312HDFNRS09", correo: "carlos.mendoza@gmail.com", telefono: "5551234567", fechaRegistro: new Date("2026-03-15") },
    { nombre: "Laura Gutierrez", curp: "GUVL920708MDFTRR02", correo: "laura.gutierrez@gmail.com", telefono: "5559876543", fechaRegistro: new Date("2025-07-22") },
    { nombre: "Jorge Herrera", curp: "HECJ780924HDFRSRR04", correo: "jorge.herrera@gmail.com", telefono: "5553456789", fechaRegistro: new Date("2026-01-10") },
    { nombre: "Maria Lopez", curp: "LOSM910415MDFPNR06", correo: "maria.lopez@gmail.com", telefono: "5552345678", fechaRegistro: new Date("2025-11-05") },
    { nombre: "Roberto Solis", curp: "SOPR870630HDFLRB08", correo: "roberto.solis@gmail.com", telefono: "5554567890", fechaRegistro: new Date("2025-08-30") },
    { nombre: "Ana Ramirez", curp: "RAFA930120MDFMNN03", correo: "ana.ramirez@gmail.com", telefono: "5556789012", fechaRegistro: new Date("2026-04-18") },
    { nombre: "Miguel Torres", curp: "TOBM800517HDFRRG01", correo: "miguel.torres@gmail.com", telefono: "5557890123", fechaRegistro: new Date("2025-06-02") },
    { nombre: "Daniela Ruiz", curp: "RIED951103MDFZPN07", correo: "daniela.ruiz@gmail.com", telefono: "5558901234", fechaRegistro: new Date("2025-12-14") },
    { nombre: "Fernando Cruz", curp: "CUMF760811HDFRRN05", correo: "fernando.cruz@gmail.com", telefono: "5550123456", fechaRegistro: new Date("2025-09-27") },
    { nombre: "Sofia Perez", curp: "PEAS001228MDFRGF00", correo: "sofia.perez@gmail.com", telefono: "5552109876", fechaRegistro: new Date("2026-03-08") },
    { nombre: "Eduardo Navarro", curp: "NALE890305HDFRDD02", correo: "eduardo.navarro@gmail.com", telefono: "5553210987", fechaRegistro: new Date("2025-06-19") },
  ];

  console.log("\n=== Contraseñas generadas (texto plano) ===");
  for (const c of clientesBase) {
    const plain = generarContraseña(c.nombre);
    c.contraseña = await bcrypt.hash(plain, SALT_ROUNDS);
    console.log(`  ${c.correo}: ${plain}`);
  }

  const clientesInsertados = await db.collection("clientes").insertMany(clientesBase);
  const clientesIds = Object.values(clientesInsertados.insertedIds);

  await db.collection("clientes").createIndex({ correo: 1 }, { unique: true });

  // ─────────────────────────────────────────────────────────────
  // 2. Cuentas
  // ─────────────────────────────────────────────────────────────

  const cuentas = clientesIds.map((idCliente, index) => ({
    clienteId: idCliente,
    numeroCuenta: generarNumeroCuenta(index + 1),
    saldo: parseFloat((1000 + (index * (48000 / 10))).toFixed(2)),
    estado: "activa",
    fechaApertura: new Date(),
  }));

  await db.collection("cuentas").insertMany(cuentas);

  await db.collection("cuentas").createIndex({ numeroCuenta: 1 }, { unique: true });

  const docsCuentas = await db.collection("cuentas").find().toArray();
  const numerosCuenta = docsCuentas.map(d => d.numeroCuenta);

  // ─────────────────────────────────────────────────────────────
  // 3. Beneficiarios
  // ─────────────────────────────────────────────────────────────

  const aliasNombres = ["Juan Perez", "Maria Garcia", "Pedro Hernandez", "Luis Martinez", "Ana Torres", "Sofia Ramirez", "Diego Flores", "Valentina Lopez"];

  const beneficiarios = [];
  for (let i = 0; i < clientesIds.length; i++) {
    const numBeneficiarios = (i % 2) + 1;
    const cuentasDisponibles = numerosCuenta.filter((_, idx) => idx !== i);
    for (let j = 0; j < numBeneficiarios; j++) {
      beneficiarios.push({
        clienteId: clientesIds[i],
        numeroCuentaDestino: cuentasDisponibles[(i + j) % cuentasDisponibles.length],
        alias: aliasNombres[(i * 2 + j) % aliasNombres.length],
        fechaRegistro: new Date(),
      });
    }
  }

  await db.collection("beneficiarios").insertMany(beneficiarios);
  await db.collection("beneficiarios").createIndex({ clienteId: 1 });

  // ─────────────────────────────────────────────────────────────
  // 4. Transferencias
  // ─────────────────────────────────────────────────────────────

  const conceptos = [
    "Pago de servicios",
    "Transferencia entre cuentas",
    "Pago de renta",
    "Reembolso",
    "Pago de nomina",
    "Transferencia a familiar",
    "Pago de colegiatura",
    "Compra en linea",
    "Pago de credito",
    "Ahorro mensual",
    "Donacion",
  ];

  const transferencias = numerosCuenta.map((cuenta, index) => {
    const destinoIndex = (index + 1) % numerosCuenta.length;
    return {
      cuentaOrigen: cuenta,
      cuentaDestino: numerosCuenta[destinoIndex],
      monto: parseFloat((500 + (index * 250)).toFixed(2)),
      concepto: conceptos[index % conceptos.length],
      fechaHora: new Date(),
      estado: "aprobada",
    };
  });

  await db.collection("transferencias").insertMany(transferencias);

  // ─────────────────────────────────────────────────────────────
  // 5. Auditoria
  // ─────────────────────────────────────────────────────────────

  const eventosAuditoria = [
    { accion: "login_exitoso", detalle: { metodo: "correo_contraseña" } },
    { accion: "alta_cuenta", detalle: { tipo: "ahorro" } },
    { accion: "transferencia_aprobada", detalle: { cuentaOrigen: "", cuentaDestino: "", monto: 0 } },
    { accion: "login_fallido", detalle: { intento: 1, metodo: "correo_contraseña" } },
    { accion: "actualizacion_perfil", detalle: { campo: "telefono" } },
    { accion: "transferencia_rechazada", detalle: { motivo: "saldo_insuficiente" } },
    { accion: "login_exitoso", detalle: { metodo: "correo_contraseña" } },
    { accion: "transferencia_aprobada", detalle: { cuentaOrigen: "", cuentaDestino: "", monto: 0 } },
    { accion: "alta_cuenta", detalle: { tipo: "corriente" } },
    { accion: "login_fallido", detalle: { intento: 2, metodo: "correo_contraseña" } },
    { accion: "transferencia_aprobada", detalle: { cuentaOrigen: "", cuentaDestino: "", monto: 0 } },
  ];

  const auditoria = eventosAuditoria.map((evento, index) => {
    const e = {
      fechaHora: new Date(),
      usuarioId: clientesIds[index % clientesIds.length],
      accion: evento.accion,
      estado: evento.accion.includes("fallido") || evento.accion.includes("rechazada") ? "fallido" : "exitoso",
      detalle: { ...evento.detalle },
    };
    if (e.accion.includes("transferencia")) {
      const tx = transferencias[index % transferencias.length];
      e.detalle.cuentaOrigen = tx.cuentaOrigen;
      e.detalle.cuentaDestino = tx.cuentaDestino;
      e.detalle.monto = tx.monto;
    }
    return e;
  });

  await db.collection("auditoria").insertMany(auditoria);

  // ─────────────────────────────────────────────────────────────
  // Resumen
  // ─────────────────────────────────────────────────────────────

  console.log("\n=== Banco Nexus - Base de datos lista ===");
  console.log(`  Clientes:       ${await db.collection("clientes").countDocuments()}`);
  console.log(`  Cuentas:        ${await db.collection("cuentas").countDocuments()}`);
  console.log(`  Beneficiarios:  ${await db.collection("beneficiarios").countDocuments()}`);
  console.log(`  Transferencias: ${await db.collection("transferencias").countDocuments()}`);
  console.log(`  Auditoria:      ${await db.collection("auditoria").countDocuments()}`);

  const ejCliente = await db.collection("clientes").findOne();
  const ejCuenta = await db.collection("cuentas").findOne({ clienteId: ejCliente._id });
  const ejTransferencia = await db.collection("transferencias").findOne({
    $or: [
      { cuentaOrigen: ejCuenta.numeroCuenta },
      { cuentaDestino: ejCuenta.numeroCuenta },
    ],
  });

  console.log("\n--- Ejemplo de registro encadenado ---");
  console.log(JSON.stringify({
    cliente: ejCliente.nombre,
    cuenta: ejCuenta.numeroCuenta,
    saldo: ejCuenta.saldo,
    ultimaTransferencia: ejTransferencia
      ? {
          origen: ejTransferencia.cuentaOrigen,
          destino: ejTransferencia.cuentaDestino,
          monto: ejTransferencia.monto,
          concepto: ejTransferencia.concepto,
        }
      : null,
  }, null, 2));

  await client.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
