// Import necessary modules
const fs = require('fs'); // Only required if you intend to write an automation script to the file system
const cors = require('cors');
const WebSocket = require('ws');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http'); 

// Create an express application
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
// Define the port on which the server will run
const port = 3000;

// Use cors middleware to enable Cross Origin Resource Sharing
app.use(cors());
// Use express.json middleware to parse JSON request bodies
app.use(express.json());
// Use express.static middleware to serve static files from a specific directory
app.use(express.static('/Users/Blake/Desktop/Portfolio/Productivity/Task_Manager'));

// Create a new SQLite database connection
let db = new sqlite3.Database('./tasks.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected to the tasks database.');
});

// WebSocket connection setup
wss.on('connection', function connection(ws, req) {
    const ip = req.socket.remoteAddress;

    ws.on('message', function incoming(message) {
        let data;
        try {
            data = JSON.parse(message);
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON message' }));
            return;
        }

        switch (data.type) {
            case 'fetchTasks':
                fetchTasksFromDB(ws);
                break;
            case 'addTask':
                addTaskToDB(data.task, ws);
                break;
            case 'toggleCompleteTask':
                toggleTaskCompletion(data.taskId, data.completed, ws);
                break;
            case 'changePriority':
                changeTaskPriority(data.taskId, data.priority, ws);
                break;
            case 'deleteTask':
                deleteTaskFromDB(data.taskId, ws);
                break;
                case 'addNote':
                    // Adjust these lines to correctly access the taskId and noteContent
                    addNoteToTask(data.note.taskId, data.note.content, ws);
                    break;
            case 'deleteNote':
                deleteNoteFromDB(data.taskId, data.noteId, ws);
                break;
            default:
                console.error('Unhandled message type:', data.type);
                ws.send(JSON.stringify({ type: 'error', error: 'Unhandled message type' }));
                break;
        }
    });

    ws.on('close', () => {
        console.log(`Client ${ip} has disconnected`);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error from ${ip}:`, error);
    });

    ws.send(JSON.stringify({ type: 'connection', message: 'Connection established' }));
});



// Function to add a task to the database with logging
function addTaskToDB(task, ws) {
    const sql = 'INSERT INTO tasks (text, priority, is_completed) VALUES (?, ?, ?)';
    db.run(sql, [task.text, task.priority, 0], function (err) {
        if (err) {
            console.error("Error adding task:", err.message);
            ws.send(JSON.stringify({ type: 'error', error: 'Failed to add task' }));
            return;
        }
        const addedTask = {
            id: this.lastID,
            text: task.text,
            priority: task.priority,
            is_completed: 0,
            notes: []  // Assuming new tasks start without notes
        };
        console.log(`Task added with ID: ${this.lastID}`);
        ws.send(JSON.stringify({ type: 'taskAdded', task: addedTask }));
    });
}

// Function to fetch tasks from the database with logging
function fetchTasksFromDB(ws) {
    const sql = `SELECT tasks.*, json_group_array(json_object('id', notes.id, 'content', notes.note)) as notes
                 FROM tasks
                 LEFT JOIN notes ON tasks.id = notes.task_id
                 GROUP BY tasks.id`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching tasks:", err.message);
            ws.send(JSON.stringify({ type: 'error', error: 'Failed to fetch tasks' }));
            return;
        }
        // Send tasks to client
        ws.send(JSON.stringify({ type: 'update', tasks: rows }));
    });
}

// Function to delete a task from the database with logging
function toggleTaskCompletion(taskId, completed, ws) {
    const sql = 'UPDATE tasks SET is_completed = ? WHERE id = ?';
    db.run(sql, [completed, taskId], function(err) {
        if (err) {
            ws.send(JSON.stringify({ type: 'error', error: 'Failed to update task completion status', details: err.message }));
            console.error("Error updating task completion:", err.message);
        } else {
            console.log(`Task completion status successfully updated for ID: ${taskId} to ${completed}`);
            ws.send(JSON.stringify({ type: 'taskUpdated', taskId: taskId, completed: completed }));
        }
    });
}

// Function to change the priority of a task in the database with logging
    function changeTaskPriority(taskId, newPriority, ws) {
        const sql = 'UPDATE tasks SET priority = ? WHERE id = ?';
        db.run(sql, [newPriority, taskId], function(err) {
            if (err) {
                console.error("Error updating task priority:", err.message);
                ws.send(JSON.stringify({ type: 'error', error: 'Failed to update task priority' }));
            } else {
                console.log(`Priority updated for task ID: ${taskId} to ${newPriority}`);
                ws.send(JSON.stringify({
                    type: 'priorityUpdated',
                    taskId: taskId,
                    priority: newPriority
                }));
            }
        });
    }

    // Function to delete a task from the database with logging
    function deleteTaskFromDB(taskId, ws) {
        const sql = 'DELETE FROM tasks WHERE id = ?';
        db.run(sql, [taskId], function(err) {
            if (err) {
                console.error("Error deleting task:", err.message);
                ws.send(JSON.stringify({ type: 'error', error: 'Failed to delete task' }));
            } else {
                console.log(`Task deleted with ID: ${taskId}`);
                ws.send(JSON.stringify({ type: 'taskDeleted', taskId: taskId }));
            }
        });
    }

    // Function to add a note to a task in the database with logging
    function toggleTaskCompletion(taskId, completed, ws) {
        console.log(`Toggling completion for task ID ${taskId} to ${completed}`);  // Log the values received
    
        const sql = 'UPDATE tasks SET is_completed = ? WHERE id = ?';
        db.run(sql, [completed, taskId], function(err) {
            if (err) {
                console.error("Error updating task completion:", err.message);
                ws.send(JSON.stringify({ type: 'error', error: 'Failed to update task completion status', details: err.message }));
            } else {
                console.log(`Task completion status successfully updated for ID: ${taskId} to ${completed}`);
                ws.send(JSON.stringify({ type: 'taskUpdated', taskId: taskId, completed: completed }));
            }
        });
    }

    // Function to change the priority of a task in the database with logging
    function addNoteToTask(taskId, noteContent, ws) {
        const sql = 'INSERT INTO notes (task_id, note) VALUES (?, ?)';
        db.run(sql, [taskId, noteContent], function(err) {
            if (err) {
                console.error("Error adding note:", err.message);
                ws.send(JSON.stringify({ type: 'error', error: 'Failed to add note' }));
                return;
            }
            console.log(`Note added for task ID: ${taskId}`);
            ws.send(JSON.stringify({ type: 'noteAdded', taskId: taskId, noteId: this.lastID }));
        });
    }

    // Function to delete a note from a task in the database with logging
    function deleteNoteFromDB(taskId, noteId, ws) {
        const sql = 'DELETE FROM notes WHERE task_id = ? AND id = ?';
        db.run(sql, [taskId, noteId], function(err) {
            if (err) {
                console.error("Error deleting note:", err.message);
                ws.send(JSON.stringify({ type: 'error', error: 'Failed to delete note' }));
                return;
            }
            console.log(`Note deleted with ID: ${noteId} for Task ID: ${taskId}`);
            ws.send(JSON.stringify({ type: 'noteDeleted', taskId: taskId, noteId: noteId }));
        });
    }
    

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

// Define a PUT endpoint for '/api/task/:id/priority'
app.put('/api/task/:id/priority', (req, res) => {
    const id = req.params.id;
    const { priority } = req.body;
    // SQL query to update the priority field of a specific task
    const sql = 'UPDATE tasks SET priority = ? WHERE id = ?';
    // Execute the SQL query
    db.run(sql, [priority, id], (err) => {
        if (err) {
            console.error("Error updating task priority:", err.message);
            return res.status(400).json({ "error": err.message });
        }
        res.json({ "message": "priority updated", id: id });
    });
});


// Catch-all handler to serve index.html for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join('/Users/Blake/Desktop/Portfolio/Productivity/Task_Manager', 'index.html'));
});

// Start the server on the specified port
server.listen(3000, () => {
    console.log(`HTTP and WebSocket server running on port ${port}`);

    try {
        fs.writeFileSync('/Users/Blake/Desktop/Portfolio/Productivity/Task_Manager/server-ready.tmp', 'ready');
        console.log('Server is ready and file written.');
    } catch (error) {
        console.error('Failed to write server-ready file:', error);
    }
});
