const { MongoClient } = require('mongodb');

const URI = 'mongodb://localhost:27017';
const DB_NAME = 'BancoNexus';

const clientesBase = [
  { nombre: "Carlos Mendoza", curp: "MERC850312HDFNRS09", correo: "carlos.mendoza@nexus.mx", telefono: "5551234567", fechaRegistro: new Date("2026-03-15") },
  { nombre: "Laura Gutierrez", curp: "GUVL920708MDFTRR02", correo: "laura.gutierrez@nexus.mx", telefono: "5559876543", fechaRegistro: new Date("2025-07-22") },
  { nombre: "Jorge Herrera", curp: "HECJ780924HDFRSRR04", correo: "jorge.herrera@nexus.mx", telefono: "5553456789", fechaRegistro: new Date("2026-01-10") },
  { nombre: "Maria Lopez", curp: "LOSM910415MDFPNR06", correo: "maria.lopez@nexus.mx", telefono: "5552345678", fechaRegistro: new Date("2025-11-05") },
];

const conceptosDeposito = ["Depósito en ventanilla", "Transferencia recibida", "Abono de nómina", "Pago de cliente"];
const conceptosRetiro = ["Retiro en cajero", "Pago de servicio", "Transferencia enviada", "Compra con tarjeta"];

function randomBetween(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomDateInLastMonths(months) {
  const now = new Date();
  const past = new Date();
  past.setMonth(past.getMonth() - months);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function seed() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log(`✅ Conectado a ${DB_NAME}`);

    // Limpiar colecciones
    await db.collection('clientes').drop().catch(() => {});
    await db.collection('cuentas').drop().catch(() => {});
    await db.collection('transacciones').drop().catch(() => {});
    console.log('🗑️  Colecciones limpiadas');

    // Insertar clientes
    const resClientes = await db.collection('clientes').insertMany(clientesBase);
    const clientesIds = Object.values(resClientes.insertedIds);
    console.log(`👤 ${clientesIds.length} clientes insertados`);

    // Crear 3 cuentas por cliente (nomina, ahorro, credito)
    const cuentas = [];
    clientesIds.forEach((idCliente, index) => {
      const base = 100 + index;
      cuentas.push({
        clienteId: idCliente,
        numeroCuenta: `NX${String(base).padStart(4, '0')}1`,
        tipo: 'nomina',
        tarjeta: `4321 9876 ${String(Math.floor(Math.random()*9000+1000))} ${String(Math.floor(Math.random()*9000+1000))}`,
        saldo: randomBetween(5000, 35000),
        status: 'activa',
        fechaApertura: new Date(),
      });
      cuentas.push({
        clienteId: idCliente,
        numeroCuenta: `NX${String(base).padStart(4, '0')}2`,
        tipo: 'ahorro',
        tarjeta: `4321 8876 ${String(Math.floor(Math.random()*9000+1000))} ${String(Math.floor(Math.random()*9000+1000))}`,
        saldo: randomBetween(10000, 60000),
        status: 'activa',
        fechaApertura: new Date(),
      });
      cuentas.push({
        clienteId: idCliente,
        numeroCuenta: `NX${String(base).padStart(4, '0')}3`,
        tipo: 'credito',
        tarjeta: `4321 7876 ${String(Math.floor(Math.random()*9000+1000))} ${String(Math.floor(Math.random()*9000+1000))}`,
        saldo: randomBetween(1000, 20000), // saldo positivo = lo que ha consumido
        status: 'activa',
        fechaApertura: new Date(),
      });
    });

    const resCuentas = await db.collection('cuentas').insertMany(cuentas);
    const cuentasIds = Object.values(resCuentas.insertedIds);
    console.log(`💳 ${cuentasIds.length} cuentas insertadas`);

    // Generar 15 transacciones por cuenta
    const transacciones = [];
    cuentasIds.forEach((idCuenta) => {
      for (let i = 0; i < 15; i++) {
        const esDeposito = Math.random() > 0.4;
        transacciones.push({
          cuentaId: idCuenta,
          monto: randomBetween(100, 5000),
          tipo: esDeposito ? 'deposito' : 'retiro',
          concepto: esDeposito
            ? conceptosDeposito[Math.floor(Math.random() * conceptosDeposito.length)]
            : conceptosRetiro[Math.floor(Math.random() * conceptosRetiro.length)],
          fecha: randomDateInLastMonths(3),
        });
      }
    });

    await db.collection('transacciones').insertMany(transacciones);
    console.log(`📋 ${transacciones.length} transacciones insertadas`);

    console.log('\n=== Base de Datos Banco Nexus Lista ===');
    console.log(`  Clientes:      ${await db.collection('clientes').countDocuments()}`);
    console.log(`  Cuentas:       ${await db.collection('cuentas').countDocuments()}`);
    console.log(`  Transacciones: ${await db.collection('transacciones').countDocuments()}`);
    console.log('\nCuentas de prueba:');
    console.log('  NX01001 (Nómina) | NX01002 (Ahorro) | NX01003 (Crédito)');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.close();
  }
}

seed();
