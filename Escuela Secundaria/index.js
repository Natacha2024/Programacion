const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Configurar Handlebars
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Configurar Body-Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Servir archivos estáticos
app.use(express.static('public'));

// Configurar base de datos SQLite
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run("CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT, email TEXT, message TEXT)");
});

// Ruta principal
app.get('/', (req, res) => {
    res.render('home');
});

// Ruta para manejar el formulario de contacto
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    // Guardar en la base de datos
    db.run('INSERT INTO students (name, email, message) VALUES (?, ?, ?)', [name, email, message], function (err) {
        if (err) {
            return console.log(err.message);
        }
        console.log(`A row has been inserted with rowid ${this.lastID}`);
    });

    // Configurar Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'tuemail@gmail.com', // Reemplaza con tu email
            pass: 'tucontraseña' // Reemplaza con tu contraseña
        }
    });

    const mailOptions = {
        from: 'tuemail@gmail.com',
        to: email,
        subject: 'Contacto desde la página web',
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
        res.redirect('/');
    });
});

// Operaciones CRUD
app.get('/students', (req, res) => {
    db.all('SELECT * FROM students', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

app.put('/students/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, message } = req.body;

    db.run('UPDATE students SET name = ?, email = ?, message = ? WHERE id = ?', [name, email, message, id], function (err) {
        if (err) {
            return console.log(err.message);
        }
        res.send(`Fila actualizada ${this.changes}`);
    });
});

app.delete('/students/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM students WHERE id = ?', id, function (err) {
        if (err) {
            return console.error(err.message);
        }
        res.send(`Fila eliminada ${this.changes}`);
    });
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
