use("BancoNexus");

db.clientes.drop();
db.cuentas.drop();
db.transacciones.drop();

// Datos base

const clientesBase = [
  { nombre: "Carlos Mendoza", curp: "MERC850312HDFNRS09", correo: "carlos.mendoza@nexus.mx", telefono: "5551234567", fechaRegistro: new Date("2026-03-15") },
  { nombre: "Laura Gutierrez", curp: "GUVL920708MDFTRR02", correo: "laura.gutierrez@nexus.mx", telefono: "5559876543", fechaRegistro: new Date("2025-07-22") },
  { nombre: "Jorge Herrera", curp: "HECJ780924HDFRSRR04", correo: "jorge.herrera@nexus.mx", telefono: "5553456789", fechaRegistro: new Date("2026-01-10") },
  { nombre: "Maria Lopez", curp: "LOSM910415MDFPNR06", correo: "maria.lopez@nexus.mx", telefono: "5552345678", fechaRegistro: new Date("2025-11-05") },
  { nombre: "Roberto Solis", curp: "SOPR870630HDFLRB08", correo: "roberto.solis@nexus.mx", telefono: "5554567890", fechaRegistro: new Date("2025-08-30") },
  { nombre: "Ana Ramirez", curp: "RAFA930120MDFMNN03", correo: "ana.ramirez@nexus.mx", telefono: "5556789012", fechaRegistro: new Date("2026-04-18") },
  { nombre: "Miguel Torres", curp: "TOBM800517HDFRRG01", correo: "miguel.torres@nexus.mx", telefono: "5557890123", fechaRegistro: new Date("2025-06-02") },
  { nombre: "Daniela Ruiz", curp: "RIED951103MDFZPN07", correo: "daniela.ruiz@nexus.mx", telefono: "5558901234", fechaRegistro: new Date("2025-12-14") },
  { nombre: "Fernando Cruz", curp: "CUMF760811HDFRRN05", correo: "fernando.cruz@nexus.mx", telefono: "5550123456", fechaRegistro: new Date("2025-09-27") },
  { nombre: "Sofia Perez", curp: "PEAS001228MDFRGF00", correo: "sofia.perez@nexus.mx", telefono: "5552109876", fechaRegistro: new Date("2026-03-08") },
  { nombre: "Eduardo Navarro", curp: "NALE890305HDFRDD02", correo: "eduardo.navarro@nexus.mx", telefono: "5553210987", fechaRegistro: new Date("2025-06-19") },
  { nombre: "Gabriela Vargas", curp: "VAMG970722MDFRRB04", correo: "gabriela.vargas@nexus.mx", telefono: "5554321098", fechaRegistro: new Date("2026-01-31") },
];

// Insertar clientes

const clientesInsertados = db.clientes.insertMany(clientesBase);
const clientesIds = Object.values(clientesInsertados.insertedIds);

// Generar cuentas (1 por cliente)

const tiposCuenta = ["ahorro", "corriente", "nomina"];


const cuentas = clientesIds.map((idCliente, index) => ({
  clienteId: idCliente,
  numeroCuenta: `NX${String(100 + index).padStart(4, "0")}1`,
  tipo: tiposCuenta[index % 3],
  tarjeta: `4321 9876 ${ (1000 + index * 111).toString().slice(0, 4)} ${(2000 + index * 222).toString().slice(0, 4)}`,
  saldo: parseFloat((1000 + (index * (48000 / 10))).toFixed(2)),
  status: "activa",
  fechaApertura: new Date(),
}));

const cuentasInsertadas = db.cuentas.insertMany(cuentas);
const cuentasIds = Object.values(cuentasInsertadas.insertedIds);

// Generar transacciones (1 por cuenta) 

const conceptos = {
  deposito: ["Deposito en ventanilla", "Transferencia recibida", "Abono de nomina"],
  retiro: ["Retiro en cajero", "Pago de servicio", "Transferencia enviada"],
  cargo: ["Comision mensual", "Cargo por servicio", "Pago con tarjeta"],
};

const transacciones = cuentasIds.map((idCuenta, index) => ({
  cuentaId: idCuenta,
  monto: parseFloat((1000 + (index * (5000 / 10))).toFixed(2)),
  tipo: index % 3 === 0 ? "deposito" : index % 3 === 1 ? "retiro" : "cargo",
  concepto: conceptos[index % 3 === 0 ? "deposito" : index % 3 === 1 ? "retiro" : "cargo"][index % 3],
  fecha: new Date(),
}));

db.transacciones.insertMany(transacciones);

// Resumen

print("\n=== Banco Nexus - Base de datos lista ===");
print(`  Clientes:      ${db.clientes.countDocuments()}`);
print(`  Cuentas:       ${db.cuentas.countDocuments()}`);
print(`  Transacciones: ${db.transacciones.countDocuments()}`);

// Ejemplo de registro encadenado
const ejCliente = db.clientes.findOne();
const ejCuenta = db.cuentas.findOne({ clienteId: ejCliente._id });
const ejTx = db.transacciones.findOne({ cuentaId: ejCuenta._id });

print("\n--- Ejemplo de registro encadenado ---");
printjson({ cliente: ejCliente.nombre, cuenta: ejCuenta.numeroCuenta, ultimaTx: ejTx.concepto });