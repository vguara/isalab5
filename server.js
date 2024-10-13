const { Client } = require('pg');
const http = require('http');
require('dotenv').config();


// Admin connection pool
const adminClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT, 
    connectionTimeoutMillis: 5000,
    ssl: {
        rejectUnauthorized: false 
      }
});

// Regular user connection pool
const regUserClient = new Client({
    host: process.env.DB_HOST,
    user: process.env.NEW_REG_USER,
    password: process.env.REG_USER_PW,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT, 
    connectionTimeoutMillis: 5000,
    ssl: {
        rejectUnauthorized: false 
      }
});


adminClient.connect()
    .then(() => console.log('Admin connected to the database successfully!'))
    .catch(err => console.error('Error connecting admin to the database:', err));

regUserClient.connect()
    .then(() => console.log('Regular user connected to the database successfully!'))
    .catch(err => console.error('Error connecting regular user to the database:', err));


// function createPatientTable() {
//     const createTableQuery = `
//         CREATE TABLE IF NOT EXISTS patient (
//             PatientID SERIAL PRIMARY KEY,
//             name VARCHAR(100),
//             dateOfBirth DATE
//         );
//     `;

//     adminClient.query(createTableQuery)
//         .then(() => {
//             return adminClient.query(`GRANT SELECT ON TABLE patient TO limited_user;`);
//         })
//         .then(() => {
//             return adminClient.query(`GRANT INSERT ON TABLE patient TO limited_user;`); 
//         })
//         .then(() => console.log('Patient table created or already exists.'))
//         .catch(error => console.error('Error creating patient table:', error));
// }

function createPatientTable() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS patient (
            PatientID SERIAL PRIMARY KEY,
            name VARCHAR(100),
            dateOfBirth DATE
        );
    `;

    adminClient.query(createTableQuery)
        .then(() => {
            console.log('Patient table created or already exists.');
            // Grant privileges on the table
            return adminClient.query(`GRANT SELECT, INSERT ON patient TO limited_user;`);
        })
        .then(() => {
            console.log('Granted SELECT and INSERT on patient to limited_user.');
            // Grant privileges on the sequence
            return adminClient.query(`GRANT USAGE, SELECT ON SEQUENCE patient_patientid_seq TO limited_user;`);
        })
        .then(() => {
            console.log('Granted USAGE and SELECT on patient_patientid_seq to limited_user.');
        })
        .catch(error => console.error('Error creating patient table:', error));
}


createPatientTable();

const server = http.createServer((req, res) => {
 
    if (req.method === 'GET' && req.url.startsWith('/patient/')) {
        const query = decodeURIComponent(req.url.split('/patient/')[1]);

        regUserClient.query(query)
            .then(results => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results.rows)); 
            })
            .catch(error => {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            });
    }


    if (req.method === 'POST' && req.url === '/patient') {
        let body = '';
    
        req.on('data', chunk => {
            body += chunk.toString();
        });
    
        req.on('end', () => {
            const { query } = JSON.parse(body);  
    
            regUserClient.query(query) 
                .then(results => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(results));
                })
                .catch(error => {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                });
        });
    }
}).listen(3000, () => {
    console.log('Server listening on port 3000');
});