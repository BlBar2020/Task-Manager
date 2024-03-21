// Import necessary modules
const cors = require('cors');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

// Create an express application
const app = express();
// Define the port on which the server will run
const port = 3000;

// Use cors middleware to enable Cross Origin Resource Sharing
app.use(cors());
// Use express.json middleware to parse JSON request bodies
app.use(express.json());
// Use express.static middleware to serve static files from a specific directory
app.use(express.static('/Users/Blake/Desktop/Portfolio/Productivity/Task manager'));

// Create a new SQLite database connection
let db = new sqlite3.Database('./tasks.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected to the tasks database.');
});


// Define a GET endpoint for '/api/tasks'
app.get('/api/tasks', (req, res) => {
    // SQL query to select all tasks and their associated notes
    const sql = `SELECT tasks.*, json_group_array(json_object('id', notes.id, 'content', notes.note)) as notes
                 FROM tasks
                 LEFT JOIN notes ON tasks.id = notes.task_id
                 GROUP BY tasks.id`;
    // Execute the SQL query
    db.all(sql, [], (err, rows) => {
        // If there's an error, log it and return a 400 status code
        if (err) {
            console.error("Error fetching tasks:", err.message);
            return res.status(400).json({ "error": err.message });
        }
        // Map over the rows to parse the notes JSON and filter out any invalid notes
        const tasksWithValidNotes = rows.map(row => ({
            ...row,
            notes: JSON.parse(row.notes).filter(note => note.id !== null && note.content !== null)
        }));
        // Send a success response with the tasks data
        res.json({
            "message": "success",
            "data": tasksWithValidNotes
        });
    });
});

// Define a GET endpoint for '/cleanup-null-notes'
app.get('/cleanup-null-notes', (req, res) => {
    // SQL query to delete notes where id or note is null
    const deleteSql = 'DELETE FROM notes WHERE id IS NULL OR note IS NULL';
    // Execute the SQL query
    db.run(deleteSql, [], (err) => {
        // If there's an error, log it and return a 400 status code
        if (err) {
            console.error("Error cleaning up notes:", err.message);
            return res.status(400).json({ "error": err.message });
        }
        // Send a success response
        res.json({ "message": "Null notes cleaned up successfully" });
    });
});

// Define a POST endpoint for '/api/task'
app.post('/api/task', (req, res) => {
    // Extract text and priority from the request body
    const { text, priority } = req.body;
    // Initialize isCompleted to 0
    const isCompleted = 0;
    // Validate the text field
    if (typeof text !== 'string' || text.length > 5000) {
        return res.status(400).json({ "error": "Invalid 'text' field" });
    }
    // Define valid priorities
    const validPriorities = ["🚨 High Priority", "🚧 Medium Priority", "📗 Low/New Feature"];
    // Validate the priority field
    if (!validPriorities.includes(priority)) {
        return res.status(400).json({ "error": "Invalid 'priority' field" });
    }
    // SQL query to insert a new task
    const sql = 'INSERT INTO tasks (text, priority, is_completed) VALUES (?, ?, ?)';
    // Execute the SQL query
    db.run(sql, [text, priority, isCompleted], function (err) {
        // If there's an error, log it and return a 400 status code
        if (err) {
            console.error("Error adding task:", err.message);
            return res.status(400).json({ "error": err.message });
        }
        // Send a success response with the id of the new task
        res.json({
            "message": "success",
            "id": this.lastID
        });
    });
});

// Define a DELETE endpoint for '/api/task/:id'
app.delete('/api/task/:id', (req, res) => {
    // Extract id from the request parameters
    const id = req.params.id;
    // SQL query to delete notes for a specific task
    const deleteNotesSql = 'DELETE FROM notes WHERE task_id = ?';
    // SQL query to delete a specific task
    const deleteTaskSql = 'DELETE FROM tasks WHERE id = ?';
    // Execute the SQL query to delete notes
    db.run(deleteNotesSql, id, (err) => {
        // If there's an error, log it and return a 400 status code
        if (err) {
            console.error("Error deleting notes for task:", err.message);
            return res.status(400).json({ "error": err.message });
        }
        // Execute the SQL query to delete the task
        db.run(deleteTaskSql, id, (err) => {
            // If there's an error, log it and return a 400 status code
            if (err) {
                console.error("Error deleting task:", err.message);
                return res.status(400).json({ "error": err.message });
            }
            // Send a success response with the id of the deleted task
            res.json({ "message": "task and its notes deleted", id: id });
        });
    });
});

// Define a DELETE endpoint for '/api/note/:taskId/:noteId'
app.delete('/api/note/:taskId/:noteId', (req, res) => {
    // Extract taskId and noteId from the request parameters
    const { taskId, noteId } = req.params;
    // SQL query to delete a specific note for a specific task
    const sql = 'DELETE FROM notes WHERE task_id = ? AND id = ?';
    // Execute the SQL query
    db.run(sql, [taskId, noteId], (err) => {
        // If there's an error, log it and return a 400 status code
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        // Send a success response with the id of the deleted note
        res.json({ "message": "note deleted", noteId: noteId });
    });
});

// Define a PUT endpoint for '/api/task/:id/complete'
app.put('/api/task/:id/complete', (req, res) => {
    // Extract id from the request parameters
    const id = req.params.id;
    // Extract completed from the request body
    const { completed } = req.body;
    // SQL query to update the is_completed field of a specific task
    const sql = 'UPDATE tasks SET is_completed = ? WHERE id = ?';
    // Execute the SQL query
    db.run(sql, [completed, id], (err) => {
        // If there's an error, log it and return a 400 status code
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        // Send a success response with the id of the updated task
        res.json({ "message": "updated", id: id });
    });
});

// Define a POST endpoint for '/api/task/:id/note'
app.post('/api/task/:id/note', (req, res) => {
    // Extract id from the request parameters
    const id = req.params.id;
    // Extract note from the request body
    const { note } = req.body;
    // Validate the note field
    if (!note || note.trim() === '') {
        return res.status(400).json({ "error": "Note Content Empty" });
    }
    // SQL query to insert a new note for a specific task
    const sql = 'INSERT INTO notes (task_id, note) VALUES (?, ?)';
    // Execute the SQL query
    db.run(sql, [id, note], function (err) {
        // If there's an error, log it and return a 400 status code
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        // Send a success response with the id of the new note
        res.json({ "message": "note added", id: this.lastID });
    });
});

// Start the server and listen on the specified port
app.listen(port, () => {
    // Log a message to the console indicating that the server is running and on which port
    console.log(`Server running on port ${port}`);
});