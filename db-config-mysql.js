let mysql;
try {
    mysql = require('mysql2/promise');
} catch (e) {
    console.warn('mysql2/promise not available; MySQL features disabled.');
    mysql = null;
}

// Single connection for testing/development
let connection = null;

async function getConnection() {
    if (!mysql) {
        throw new Error('MySQL library not available');
    }

    // If connection doesn't exist, create it
    if (!connection) {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cryptonest'
        });
    }
    
    // Check if connection is still valid
    try {
        await connection.ping();
    } catch (err) {
        console.log('Connection lost, reconnecting...');
        connection = null;
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cryptonest'
        });
    }
    
    return connection;
}

async function runAsync(query, params = []) {
    const conn = await getConnection();
    const result = await conn.query(query, params);
    // result[0] contains the ResultSetHeader for INSERT/UPDATE/DELETE
    const header = result[0];
    return { id: header.insertId, changes: header.affectedRows };
}

async function getAsync(query, params = []) {
    const conn = await getConnection();
    const result = await conn.query(query, params);
    // result[0] contains the rows array
    const rows = result[0] || [];
    return rows[0] || null;
}

async function allAsync(query, params = []) {
    const conn = await getConnection();
    const result = await conn.query(query, params);
    // result[0] contains the rows array
    const rows = result[0] || [];
    return rows;
}

// Test connection on startup
(async () => {
    try {
        const conn = await getConnection();
        console.log('✓ MySQL database connected (cryptonest)');
    } catch (err) {
        console.error('✗ MySQL connection failed:', err.message);
        console.warn('Continuing without MySQL. Some features may be limited.');
    }
})();

module.exports = {
    runAsync,
    getAsync,
    allAsync
};
