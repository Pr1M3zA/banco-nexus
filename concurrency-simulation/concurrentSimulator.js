const registerTransaction = require('./branchOperation');
const { MongoClient } = require('mongodb');

async function runSimulation() {
    console.log("Starting concurrency simulation for Banco Nexus...");

    // NOTA: Cambia 'NX1001' por cualquier número de cuenta real que exista en tu BD local
    const targetAccount = 'NX01001';

    // Create 5 parallel actions targeting the SAME account
    const operations = [
        registerTransaction(targetAccount, 100, 'deposito', 'CDMX Branch'),
        registerTransaction(targetAccount, 200, 'deposito', 'GDL Branch'),
        registerTransaction(targetAccount, 300, 'deposito', 'MTY Branch'),
        registerTransaction(targetAccount, 50, 'retiro', 'TIJ Branch'),
        registerTransaction(targetAccount, 150, 'deposito', 'CUN Branch')
    ];

    console.log("Launching simultaneous operations via Promise.all...\n");

    // Execute all promises in parallel
    const results = await Promise.all(operations);

    results.forEach(result => console.log(result));

    // Fetch the final result to check for inconsistencies
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const finalAccount = await client.db('BancoNexus').collection('cuentas').findOne({ numeroCuenta: targetAccount });
        console.log(`\n💰 Final DB balance for account ${targetAccount}: $${finalAccount.saldo}`);
    } finally {
        await client.close();
    }
}

runSimulation();
