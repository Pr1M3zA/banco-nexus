const { MongoClient } = require('mongodb');

const URI = 'mongodb://localhost:27017';
const DB_NAME = 'BancoNexus';

const clientesBase = [
  { nombre: "Carlos Mendoza", curp: "MERC850312HDFNRS09", correo: "carlos.mendoza@nexus.mx", telefono: "5551234567", fechaRegistro: new Date() },
  { nombre: "Laura Gutierrez", curp: "GUVL920708MDFTRR02", correo: "laura.gutierrez@nexus.mx", telefono: "5559876543", fechaRegistro: new Date() },
  { nombre: "Jorge Herrera", curp: "HECJ780924HDFRSRR04", correo: "jorge.herrera@nexus.mx", telefono: "5553456789", fechaRegistro: new Date() },
  { nombre: "Maria Lopez", curp: "LOSM910415MDFPNR06", correo: "maria.lopez@nexus.mx", telefono: "5552345678", fechaRegistro: new Date() }
];

async function seed() {
  const client = new MongoClient(URI);
  try {
    await client.connect();
    console.log('Conectado a MongoDB...');
    const db = client.db(DB_NAME);

    // Limpiar colecciones
    await db.collection('clientes').deleteMany({});
    await db.collection('cuentas').deleteMany({});
    await db.collection('transacciones').deleteMany({});

    // Insertar clientes
    const resultClientes = await db.collection('clientes').insertMany(clientesBase);
    const clientesIds = Object.values(resultClientes.insertedIds);

    // Generar cuentas
    const tipos = ["ahorro", "nomina", "corriente"];
    const cuentas = clientesIds.map((id, i) => ({
      clienteId: id,
      numeroCuenta: `NX0100${i + 1}`,
      tipo: tipos[i % 3],
      tarjeta: `4321 9876 5432 ${1000 + i}`,
      saldo: 42567.89 + (i * 1500),
      status: "activa",
      fechaApertura: new Date()
    }));

    await db.collection('cuentas').insertMany(cuentas);
    const cuentasDocs = await db.collection('cuentas').find().toArray();

    // Generar transacciones para la primera cuenta (Dashboard inicial)
    const txs = [
      { cuentaId: cuentasDocs[0]._id, monto: 5000, tipo: "deposito", concepto: "Abono de Nómina", fecha: new Date(Date.now() - 86400000 * 2) },
      { cuentaId: cuentasDocs[0]._id, monto: 1200, tipo: "retiro", concepto: "Pago de Servicios", fecha: new Date(Date.now() - 86400000) },
      { cuentaId: cuentasDocs[0]._id, monto: 850, tipo: "deposito", concepto: "Transferencia Recibida", fecha: new Date() }
    ];

    await db.collection('transacciones').insertMany(txs);

    console.log('✅ Base de Datos "BancoNexus" poblada con éxito.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

seed();
