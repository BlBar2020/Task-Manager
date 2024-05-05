// Enforces strict mode to catch common JavaScript pitfalls
"use strict";

// TaskManager class definition for managing tasks and WebSocket communications
class TaskManager {
    constructor() {
        this.tasks = [];
        this.initializeWebSocket(); // Ensures WebSocket is only connected once
    }

    // WebSocket initialization
    initializeWebSocket() {
        if (!this.socket) {
            this.connectWebSocket();
        }
    }

    // WebSocket connection
    connectWebSocket() {
        console.log('Attempting to connect WebSocket');
        this.socket = new WebSocket('ws://localhost:3000');
        this.socket.onopen = () => console.log('WebSocket is open now.');
        this.socket.onerror = (event) => console.error('WebSocket error observed:', event);
        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.processMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
        this.socket.onclose = (event) => console.log('WebSocket is closed now:', event.reason);
    }

    // Fetch tasks from the server
    fetchTasks() {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.sendMessage({ type: 'fetchTasks' });
        } else {
            console.log('WebSocket not open. Fetching tasks delayed.');
            setTimeout(() => this.fetchTasks(), 100); // Retry after a short delay
        }
    }

    // WebSocket message handling
    handleMessage(event) {
        console.log("Received WebSocket message:", event.data); // Log the entire raw data
        let data;
        try {
            data = JSON.parse(event.data);
            console.log('Parsed WebSocket message:', data); // Log parsed data
        } catch (error) {
            console.error('Error parsing WebSocket message:', error, 'Received data:', event.data);
            return;
        }
        this.processMessage(data);
    }
    
    // Process WebSocket messages
    processMessage(data) {
        switch (data.type) {
            case 'connection':
                console.log('WebSocket connection established.');
                break;
            case 'update':
                this.updateTasks(data.tasks);
                break;
            case 'taskAdded':
                console.log(`Task added with ID: ${data.id}`);
                this.fetchTasks();  // Fetch all tasks again to update UI
                break;
            case 'priorityUpdated':
                console.log(`Priority updated for task ID ${data.taskId} to ${data.priority}`);
                this.fetchTasks();  // Optionally re-fetch tasks to update the display
                break;
            case 'taskDeleted':
                console.log(`Task deleted with ID: ${data.taskId}`);
                this.fetchTasks(); // Refresh the tasks list
                break;
            case 'taskUpdated':
                console.log(`Task completion status updated for ID: ${data.taskId}`);
                this.fetchTasks(); // Optionally refresh the tasks list
                break;
            case 'noteAdded':
                console.log(`Note added with ID: ${data.noteId} for Task ID: ${data.taskId}`);
                this.fetchTasks(); // Refresh the tasks list to show the new note
                break;
            case 'noteDeleted':
                console.log(`Note deleted with ID: ${data.noteId} for Task ID: ${data.taskId}`);
                this.fetchTasks(); // Refresh the tasks list to reflect the deletion
                break;
            case 'error':
                // Log the error or handle it as needed without showing it to the user
                console.warn('Server reported an error:', data.error);
                break;
            default:
                console.warn('Received unhandled message type:', data.type, 'with full data:', data);
                // Optionally send diagnostic data back to the server or to a logging service
                break;
        }
    }
    
    // Update tasks and display them
    updateTasks(tasks) {
        console.log("Tasks received for update:", tasks); // Log the tasks before processing
        this.tasks = tasks.map(task => {
            return {
                ...task,
                notes: Array.isArray(task.notes) ? task.notes : JSON.parse(task.notes || '[]') // Ensure notes are correctly parsed
            };
        });
        console.log("Tasks processed for display:", this.tasks); // Log tasks after processing
        this.displayTasks();
    }
    
    // Send messages to the server
    sendMessage(message) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open');
        }
    }
    // Additional functions interacting via WebSocket
    addTask(taskText, priority) {
        if (taskText.trim() === '') return;
        this.sendMessage({
            type: 'addTask',
            task: { text: taskText, priority: priority }
        });
    }

    // Display tasks in the UI
    displayTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = ''; // Clear current list before appending new items
    
        let completedTaskAdded = false; // Track when a separator is added, should be outside the task loop
    
        // Sort tasks by completion status and then by priority
        this.tasks.sort((a, b) => {
            if (a.is_completed !== b.is_completed) {
                return a.is_completed ? 1 : -1;
            }
            const priorities = ['🚨 High Priority', '🚧 Medium Priority', '📗 Low/New Feature'];
            return priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
        });
    
        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = task.is_completed ? 'completed-task' : '';
    
            // Combine priority and task text
            const fullTaskText = `${task.priority} - ${task.text}`;
            const timestampDiv = this.createDivWithClassAndContent('task-timestamp', task.timestamp);
            const taskDiv = this.createDivWithClassAndContent('task-text', fullTaskText);
            if (task.is_completed) {
                taskDiv.classList.add('completed-task-text');
            }
    
            li.appendChild(timestampDiv);
            li.appendChild(taskDiv);
    
            // Change Priority Button centered below the task text
            const changePriorityButton = this.createButtonWithClassAndOnClick('changePriorityButton', () => this.openChangePriorityModal(task.id), 'Change Priority');
            li.appendChild(changePriorityButton);
    
            // Container for Complete and Delete Buttons
            const actionButtonContainer = document.createElement('div');
            actionButtonContainer.style.display = 'flex';
            actionButtonContainer.style.justifyContent = 'space-between'; // Ensure alignment
            actionButtonContainer.appendChild(this.createButtonWithClassAndOnClick('deleteButton', () => this.deleteTask(task.id), 'Delete'));
            actionButtonContainer.appendChild(this.createButtonWithClassAndOnClick('toggleCompleteButton', () => this.toggleCompleteTask(task.id), task.is_completed ? 'Mark Incomplete' : 'Mark Complete'));
            li.appendChild(actionButtonContainer);
    
            // Add Notes Button centered below the action buttons
            const addNoteButton = this.createButtonWithClassAndOnClick('addNoteButton', () => this.openAddNoteModal(task.id), 'Add Note');
            li.appendChild(addNoteButton);
    
            // Add a section for notes
            const notesSection = this.createNotesSection(task);
            li.appendChild(notesSection);
    
            // Handle the completion separator
            if (!completedTaskAdded && task.is_completed) {
                const separator = document.createElement('div');
                separator.className = 'task-separator';
                taskList.appendChild(separator);
                completedTaskAdded = true;
            }
    
            taskList.appendChild(li);
        });
    
        console.log('Displayed tasks updated'); // Debug: Confirm tasks have been displayed
    }
    
    // Open Note Modal
    openAddNoteModal(taskId) {
        const modal = document.getElementById('addNoteModal');  // Make sure this ID matches your HTML
        if (modal) {
            modal.style.display = 'block';
        
            // Clear the input when opening the modal
            const noteInput = document.getElementById('noteInput'); // Correct ID for the input
            if (noteInput) noteInput.value = '';
        
            // Setup Save Note Button
            const saveButton = document.getElementById('saveNoteButton');
            if (saveButton) {
                saveButton.onclick = () => {
                    const noteContent = noteInput.value;
                    this.addNoteToTask(taskId, noteContent);
                    modal.style.display = 'none'; // Close modal after saving
                };
            }
    
            // Setup Close Button
            const closeButton = modal.querySelector('.close-button');
            if (closeButton) {
                closeButton.onclick = () => {
                    modal.style.display = 'none';
                };
            }
        } else {
            console.error('Modal element not found');
        }
    }
    
    // Create a section for notes
    createNotesSection(task) {
        const notesSection = document.createElement('div');
        notesSection.className = 'notes-section';
        
        // Iterate over notes if they exist
        if (task.notes && task.notes.length > 0) {
            task.notes.forEach(note => {
                if (note.id && note.content) { // Check if the note is valid
                    const noteDiv = document.createElement('div');
                    noteDiv.className = 'note-container'; // Add a class for styling
                    noteDiv.textContent = note.content;
    
                    const deleteNoteButton = this.createButtonWithClassAndOnClick('deleteNoteButton', () => this.deleteNote(task.id, note.id), 'Delete Note');
                    const deleteButtonContainer = document.createElement('div');
                    deleteButtonContainer.className = 'delete-note-button-container'; // Add a class for styling
                    deleteButtonContainer.appendChild(deleteNoteButton);
    
                    noteDiv.appendChild(deleteButtonContainer);
                    notesSection.appendChild(noteDiv);
                }
            });
        }
    
        return notesSection;
    }
    
    // Delete Task
    deleteTask(taskId) {
        this.sendMessage({
            type: 'deleteTask',
            taskId: taskId
        });
    }

    // Add Note to Task
    addNoteToTask(taskId, noteContent) {
        if (noteContent.trim() === '') {
            console.error('Note content is empty');
            return;
        }
        this.sendMessage({
            type: 'addNote',
            note: { taskId: taskId, content: noteContent }
        });
    }
    
    // Delete Note
    deleteNote(taskId, noteId) {
        this.sendMessage({
            type: 'deleteNote',
            taskId: taskId,
            noteId: noteId
        });
    }

    // Change Task Priority
    changeTaskPriority(taskId, newPriority) {
        if (!newPriority) {
            console.error('Priority is not provided');
            return;
        }
        this.sendMessage({
            type: 'changePriority',
            taskId: taskId,
            priority: newPriority
        });
    }

    // Toggle Task Completion
    toggleCompleteTask(taskId) {
        // Find the task to get its current completion status
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }
    
        // Toggle the completion status
        const newCompletedStatus = !task.is_completed;
    
        // Send the updated status to the server
        this.sendMessage({
            type: 'toggleCompleteTask',
            taskId: taskId,
            completed: newCompletedStatus ? 1 : 0  // Ensuring it sends 1 or 0
        });
    }
    
    
    // Helper methods
    createDivWithClassAndContent(className, content) {
        const div = document.createElement('div');
        div.className = className;
        div.textContent = content;
        return div;
    }

    // Helper method to create a button with a class and an onClick handler
    createButtonWithClassAndOnClick(className, onClick, text) {
        const button = document.createElement('button');
        button.className = className;
        button.textContent = text;
        button.onclick = onClick;
        return button;
    }

    // Method to append radio buttons to the modal
    appendRadioButtons(modal, task) {
        const container = modal.querySelector('.radios-container');
        container.innerHTML = ''; // Clear existing content
    
        const priorities = ['🚨 High Priority', '🚧 Medium Priority', '📗 Low/New Feature'];
        priorities.forEach(priority => {
            const wrapper = document.createElement('div');
            wrapper.className = 'radio-container';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'priority';
            radio.value = priority;
            radio.id = priority; // Unique ID for the label
            radio.checked = (task && task.priority === priority);

            const label = document.createElement('label');
            label.htmlFor = priority;
            label.textContent = priority;

            wrapper.appendChild(radio);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    }

    // Modification to the method that opens the modal
    openChangePriorityModal(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (!task) {
            console.error('Task not found');
            return;
        }

        const modal = document.getElementById('priorityModal');
        modal.style.display = 'block';

        this.appendRadioButtons(modal, task);

        const saveButton = document.getElementById('savePriorityButton');
        saveButton.onclick = () => {
            const selectedPriority = document.querySelector('input[name="priority"]:checked').value;
            this.changeTaskPriority(taskId, selectedPriority);
            modal.style.display = 'none'; // Close modal after saving
        };

        const closeButton = document.querySelector('.modal .close-button');
        closeButton.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // Close Modal
    closeModal() {
        document.getElementById('priorityModal').style.display = 'none';
    }
}

// Initialize the TaskManager and set up the event listener
document.addEventListener('DOMContentLoaded', () => {
    const myTaskManager = new TaskManager();
    document.getElementById('addTaskButton').addEventListener('click', () => {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value;
        const priority = document.getElementById('prioritySelect').value;
        if (taskText.trim() !== '') {
            myTaskManager.addTask(taskText, priority);
            taskInput.value = '';  // Clear the input field after sending the task
        }
    });    
});
