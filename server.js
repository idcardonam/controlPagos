import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

// Configurar __dirname correctamente en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📌 Crear la base de datos SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  console.log("Base de datos utilizada:", dbPath);
  if (err) {
    console.error("Error al conectar con la base de datos:", err.message);
  } else {
    console.log("Conexión exitosa a la base de datos.");
  }
});
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compania TEXT,
      banco TEXT,
      jornada TEXT,
      subdivision TEXT,
      categoria TEXT,
      valor REAL,
      fecha TEXT,
      registroContable TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS lists (
      name TEXT PRIMARY KEY,
      data TEXT
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO lists (name, data) VALUES 
      ('companies', '["Compañía A", "Compañía B"]'),
      ('bancos', '["Banco A", "Banco B"]'),
      ('jornadas', '["Diurna", "Nocturna", "Mixta"]'),
      ('categorias', '["Servicios", "Logística", "Tecnología"]'),
      ('subdivisiones', '["Subdivisión I", "Subdivisión II"]'),
      ('registroContable', '["03450", "430599", "03451", "03452"]')
  `);
});

// 📌 Configurar Express
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 📌 Obtener listas
app.get("/api/lists", (req, res) => {
  const query = "SELECT * FROM lists";

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener las listas:", err.message);
      return res.status(500).json({ error: "Error al obtener las listas." });
    }

    const listas = {};
    rows.forEach((row) => {
      listas[row.name] = JSON.parse(row.data);
    });

    res.json(listas);
  });
});

// 📌 Registrar un nuevo pago
app.post("/api/payments", (req, res) => {
  const { compania, jornada, subdivision, banco, fecha, categoria, valor } = req.body;

  if (!compania || !jornada || !subdivision || !banco || !fecha || !categoria || !valor) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  const query = `
    INSERT INTO payments (compania, jornada, subdivision, banco, fecha, categoria, valor) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [compania, jornada, subdivision, banco, fecha, categoria, valor], function (err) {
    if (err) {
      console.error("Error al registrar el pago:", err.message);
      return res.status(500).json({ error: "Error al registrar el pago." });
    }

    res.status(201).json({ message: "Pago registrado exitosamente.", id: this.lastID });
  });
});

// 📌 Obtener todos los pagos
app.get('/api/payments', (req, res) => {
  const query = "SELECT * FROM payments";

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener los pagos:", err.message);
      return res.status(500).json({ error: "Error al obtener los pagos." });
    }

    res.json(rows);
  });
});

app.get('/api/payments/:id', (req, res) => {
  const { id } = req.params;

  const query = "SELECT * FROM payments WHERE id = ?";
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("Error al obtener el registro:", err.message);
      return res.status(500).json({ error: "Error interno del servidor." });
    }

    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: "Registro no encontrado." });
    }
  });
});

// 📌 Filtrar pagos por campos específicos
app.post('/api/payments/filter', (req, res) => {
  const { compania, fechaInicio, fechaFin, jornada, categoria, subdivision, valor, banco, registroContable } = req.body;

  let query = "SELECT * FROM payments WHERE 1=1";
  const params = [];

  if (compania) {
    query += " AND compania = ?";
    params.push(compania);
  }
  if (fechaInicio) {
    query += " AND fecha >= ?";
    params.push(fechaInicio);
  }
  if (fechaFin) {
    query += " AND fecha <= ?";
    params.push(fechaFin);
  }
  if (jornada) {
    query += " AND jornada = ?";
    params.push(jornada);
  }
  if (categoria) {
    query += " AND categoria = ?";
    params.push(categoria);
  }
  if (subdivision) {
    query += " AND subdivision = ?";
    params.push(subdivision);
  }
  if (valor) {
    query += " AND valor = ?";
    params.push(valor);
  }
  if (banco) {
    query += " AND banco = ?";
    params.push(banco);
  }
  if (registroContable) {
    query += " AND registroContable = ?";
    params.push(registroContable);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error al filtrar los registros:", err.message);
      return res.status(500).json({ error: "Error al filtrar los registros." });
    }

    res.json(rows || []);
  });
});

// 📌 Editar un registro (asignar número contable)
app.put("/api/payments/:id", (req, res) => {
  const id = req.params.id;
  const { compania, fecha, jornada, categoria, subdivision, valor, banco, registroContable } = req.body;

  const query = `
    UPDATE payments
    SET compania = ?, fecha = ?, jornada = ?, categoria = ?, subdivision = ?, valor = ?, banco = ?, registroContable = ?
    WHERE id = ?
  `;

  db.run(query, [compania, fecha, jornada, categoria, subdivision, valor, banco, registroContable, id], function (err) {
    if (err) {
      console.error("Error al actualizar el registro:", err.message);
      return res.status(500).json({ message: "Error al actualizar el registro." });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Registro no encontrado." });
    }

    res.json({ message: "Registro actualizado exitosamente." });
  });
});


app.post("/api/payments/validate-contable", (req, res) => {
  const { numeroContable } = req.body;

  if (!numeroContable) {
    return res.status(400).json({ valid: false, message: "El número contable no puede estar vacío." });
  }

  const query = "SELECT COUNT(*) AS count FROM payments WHERE registroContable = ?";
  db.get(query, [numeroContable], (err, row) => {
    if (err) {
      console.error("Error al validar el número contable:", err.message);
      return res.status(500).json({ valid: false, message: "Error interno del servidor." });
    }

    res.json({ valid: row.count === 0 });
  });
});

app.post("/api/payments/assign-auto", (req, res) => {
  const { ids } = req.body;

  if (!ids || ids.length === 0) {
    return res.status(400).json({ message: "No se proporcionaron registros para asignar." });
  }

  const placeholders = ids.map(() => "?").join(",");
  const queryCheck = `SELECT id FROM payments WHERE id IN (${placeholders}) AND registroContable IS NOT NULL`;

  console.log("IDs recibidos para asignar:", ids);

  // Verificar si algún registro ya tiene un número contable asignado
  db.all(queryCheck, ids, (err, rows) => {
    if (err) {
      console.error("Error al verificar los registros:", err.message);
      return res.status(500).json({ message: "Error interno del servidor." });
    }

    console.log("Registros con número contable asignado:", rows);

    if (rows.length > 0) {
      const idsConNumero = rows.map((row) => row.id).join(", ");
      return res.status(400).json({
        message: `Los siguientes registros ya tienen un número contable asignado: ${idsConNumero}.`,
      });
    }

    // Si no hay conflictos, asignar el número contable automáticamente
    const queryUpdate = `UPDATE payments SET registroContable = ? WHERE id IN (${placeholders}) AND registroContable IS NULL`;
    const numeroContable = `NC-${Date.now()}`; // Generar un número contable único basado en la fecha actual

    console.log("Asignando número contable:", numeroContable);

    db.run(queryUpdate, [numeroContable, ...ids], function (err) {
      if (err) {
        console.error("Error al asignar número contable automáticamente:", err.message);
        return res.status(500).json({ message: "Error interno del servidor." });
      }

      if (this.changes === 0) {
        return res.status(400).json({
          message: "No se pudieron asignar números contables. Verifica que los registros no tengan ya un número asignado.",
        });
      }

      res.json({ message: "Número contable asignado automáticamente correctamente.", numeroContable });
    });
  });
});


app.post('/api/payments/delete-multiple', (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Se requiere una lista de IDs válida." });
  }

  const placeholders = ids.map(() => "?").join(",");
  const query = `DELETE FROM payments WHERE id IN (${placeholders})`;

  db.run(query, ids, function (err) {
    if (err) {
      console.error("Error al eliminar los registros:", err.message);
      return res.status(500).json({ error: "Error interno del servidor." });
    }

    res.json({ message: `${this.changes} registros eliminados correctamente.` });
  });
});

// 📌 Obtener todos los pagos
app.get('/api/payments', (req, res) => {
  const query = "SELECT * FROM payments";

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener los pagos:", err.message);
      return res.status(500).json({ error: "Error al obtener los pagos." });
    }

    res.json(rows);
  });
});

// 📌 Obtener una lista específica aqui inicia todo de listas

// Obtener todas las listas
app.get('/api/lists', (req, res) => {
  const query = 'SELECT * FROM listas';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error al obtener las listas:", err.message);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
    res.json(rows);
  });
});

// Agregar un registro a una lista
app.post('/api/lists', (req, res) => {
  const { nombre, descripcion } = req.body;
  const query = 'INSERT INTO listas (nombre, descripcion) VALUES (?, ?)';
  db.run(query, [nombre, descripcion], function (err) {
    if (err) {
      console.error("Error al agregar el registro a la lista:", err.message);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
    res.json({ message: "Registro agregado exitosamente.", id: this.lastID });
  });
});

// Editar un registro en una lista
app.put("/api/payments/:id", (req, res) => {
  const id = req.params.id;
  const { compania, fecha, jornada, categoria, subdivision, valor, banco, registroContable } = req.body;

  const query = `
    UPDATE payments
    SET compania = ?, fecha = ?, jornada = ?, categoria = ?, subdivision = ?, valor = ?, banco = ?, registroContable = ?
    WHERE id = ?
  `;

  db.run(query, [compania, fecha, jornada, categoria, subdivision, valor, banco, registroContable, id], function (err) {
    if (err) {
      console.error("Error al actualizar el registro:", err.message);
      return res.status(500).json({ message: "Error al actualizar el registro." });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Registro no encontrado." });
    }

    res.json({ message: "Registro actualizado exitosamente." });
  });
});

// Eliminar un registro de una lista
app.delete('/api/lists/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM listas WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) {
      console.error("Error al eliminar el registro de la lista:", err.message);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
    if (this.changes > 0) {
      res.json({ message: "Registro eliminado exitosamente." });
    } else {
      res.status(404).json({ error: "Registro no encontrado." });
    }
  });
});

app.get("/api/lists/:field", (req, res) => {
  const { field } = req.params;

  const query = "SELECT data FROM lists WHERE name = ?";
  db.get(query, [field], (err, row) => {
    if (err) {
      console.error(`Error al obtener la lista ${field}:`, err.message);
      return res.status(500).json({ error: "Error interno del servidor." });
    }

    if (!row) {
      return res.status(404).json({ error: `La lista ${field} no existe.` });
    }

    res.json(JSON.parse(row.data));
  });
});

// Endpoint para Agregar un Elemento
app.post('/api/lists/:field', (req, res) => {
  const { field } = req.params;
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === "") {
    return res.status(400).json({ message: "El nombre no puede estar vacío." });
  }

  const query = `INSERT INTO ${field} (nombre) VALUES (?)`;
  db.run(query, [nombre], function (err) {
    if (err) {
      console.error(`Error al agregar un elemento a la lista ${field}:`, err.message);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
    res.json({ message: "Elemento agregado exitosamente.", id: this.lastID });
  });
});

//Endpoint para Eliminar un Elemento
app.delete('/api/lists/:field/:id', (req, res) => {
  const { field, id } = req.params;

  const query = `DELETE FROM ${field} WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      console.error(`Error al eliminar un elemento de la lista ${field}:`, err.message);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
    if (this.changes > 0) {
      res.json({ message: "Elemento eliminado exitosamente." });
    } else {
      res.status(404).json({ message: "Elemento no encontrado." });
    }
  });
});


// 📌 Iniciar servidor
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});


