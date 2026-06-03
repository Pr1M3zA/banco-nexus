export const usuario = {
  nombre: "Ernesto Gracia",
  tipoCuenta: "Cuenta Premium",
};

export const resumenCuenta = {
  saldo: 47892.56,
  ingresos: 2340,
  egresos: 1256.78,
  variacion: 4.2,
};

export const movimientos = [
  {
    concepto: "Depósito en ventanilla",
    fecha: "15 Ene 2026",
    tipo: "Depósito",
    monto: 2340,
  },
  {
    concepto: "Pago de servicio",
    fecha: "14 Ene 2026",
    tipo: "Retiro",
    monto: -1256.78,
  },
  {
    concepto: "Transferencia recibida",
    fecha: "13 Ene 2026",
    tipo: "Depósito",
    monto: 850,
  },
  {
    concepto: "Cargo por servicio",
    fecha: "12 Ene 2026",
    tipo: "Cargo",
    monto: -89.5,
  },
];

export const evolucionSaldo = [
  { fecha: "1 Ene", saldo: 38450 },
  { fecha: "5 Ene", saldo: 40100 },
  { fecha: "10 Ene", saldo: 43200 },
  { fecha: "15 Ene", saldo: 45280 },
  { fecha: "20 Ene", saldo: 46890 },
  { fecha: "25 Ene", saldo: 47892 },
];


export const cuentaDemo = {
  cliente: {
    nombre: "Ernesto Gracia",
    correo: "ernesto.gracia@nexus.mx",
  },

  cuenta: {
    numeroCuenta: "1234567890",
    tipo: "Cuenta Premium",
    saldo: 47892.56,
    status: "activa",
  },

  transacciones: [
    {
      tipo: "deposito",
      concepto: "Depósito en ventanilla",
      monto: 2340,
      fecha: "2026-05-01",
    },
    {
      tipo: "retiro",
      concepto: "Pago de servicio",
      monto: -1256.78,
      fecha: "2026-05-02",
    },
    {
      tipo: "deposito",
      concepto: "Transferencia recibida",
      monto: 850,
      fecha: "2026-05-03",
    },
  ],
};