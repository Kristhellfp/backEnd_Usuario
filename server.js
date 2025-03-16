const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3000;

// Habilitar CORS para permitir solicitudes desde el frontend
app.use(cors());

// Configuración de la conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '2007',
    database: 'todo_list'
});

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
    } else {
        console.log('Conexión exitosa a la base de datos');
    }
});

app.use(bodyParser.json()); // Para que el servidor pueda leer JSON en las solicitudes

// Ruta raíz para asegurarnos de que el servidor está corriendo
app.get('/', (req, res) => {
    res.send('Servidor está corriendo, accede a /tareas para obtener tareas');
});

// Ruta para obtener las tareas (requiere autenticación)
app.get('/tareas', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    jwt.verify(token, 'secreto', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token no válido' });
        }
        
        // Obtener tareas del usuario desde la base de datos
        db.query('SELECT * FROM tareas WHERE correo_usuario = ?', [decoded.correo], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al obtener las tareas' });
            }
            res.json(result); // Responde con los datos JSON
        });
    });
});

// Ruta para agregar una nueva tarea (requiere autenticación)
app.post('/tareas', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    const { nombre_tarea } = req.body;
    
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    if (!nombre_tarea) {
        return res.status(400).json({ message: 'El nombre de la tarea es requerido' });
    }

    jwt.verify(token, 'secreto', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token no válido' });
        }
        
        // Insertar la nueva tarea en la base de datos
        const nuevaTarea = { nombre_tarea, correo_usuario: decoded.correo };
        db.query('INSERT INTO tareas SET ?', nuevaTarea, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error al agregar la tarea' });
            }
            res.status(201).json({ message: 'Tarea agregada exitosamente' });
        });
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
