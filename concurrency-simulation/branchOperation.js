const { MongoClient } = require('mongodb');

const registerTransaction = async (account, amount, type, branch) => {
    const uri = 'mongodb://localhost:27017'; 
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('banco_nexus');
        const transactions = db.collection('transacciones');
        const accounts = db.collection('cuentas');

        // 1. Register transaction history
        const newTransaction = { 
            cuenta: account, 
            monto: amount, 
            tipo: type, 
            sucursal: branch, 
            fecha: new Date().toISOString() 
        };
        await transactions.insertOne(newTransaction);

        // 2. Update balance using atomic operator $inc
        const operator = type === 'deposito' ? 1 : -1;
        await accounts.updateOne(
            { numeroCuenta: account }, 
            { $inc: { saldo: operator * amount } } 
        );

        return `✅ [${branch}] ${type.toUpperCase()} of $${amount} processed successfully.`;
    } catch (error) {
        return `❌ [${branch}] Error: ${error.message}`;
    } finally {
        await client.close();
    }
};

module.exports = registerTransaction;
