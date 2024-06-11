const fs = require('fs');
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
// Use express.static middleware to serve static files from the "dist" directory
app.use(express.static(path.join(__dirname, 'dist')));

// Create a new SQLite database connection
let db = new sqlite3.Database('./tasks.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    console.log('Connected to the tasks database.');
});

// Catch-all handler to serve index.html for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
          addNoteToTask(data.note.taskId, data.note.content, ws);
          break;
        case 'deleteNote':
          deleteNoteFromDB(data.taskId, data.noteId, ws);
          break;
        case 'heartbeat':
          console.log('Received heartbeat');
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
            notes: [] // Ensure new tasks have an empty notes array
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
        // Ensure notes is always an array and filter out null notes
        const tasks = rows.map(row => ({
            ...row,
            notes: row.notes ? JSON.parse(row.notes).filter(note => note.id && note.content) : []
        }));
        ws.send(JSON.stringify({ type: 'update', tasks }));
    });
}

// Function to update task completion status
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

// Function to change task priority in the database with logging
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

// Start the server on the specified port
server.listen(port, () => {
    console.log(`HTTP and WebSocket server running on port ${port}`);

    try {
        fs.writeFileSync('/Users/Blake/Desktop/Portfolio/Productivity/Task_Manager/server-ready.tmp', 'ready');
        console.log('Server is ready and file written.');
    } catch (error) {
        console.error('Failed to write server-ready file:', error);
    }
});