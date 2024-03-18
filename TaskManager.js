// Enforces strict mode to catch common JavaScript pitfalls
"use strict";

// Fetch tasks when the document content has been loaded
document.addEventListener('DOMContentLoaded', fetchTasks);

// TaskManager class definition
class TaskManager {
    // Constructor for the TaskManager class
    constructor() {
        // Initialize tasks and completedTasks from localStorage or as empty arrays
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
    }

    // Method to save tasks and completedTasks to localStorage
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('completedTasks', JSON.stringify(this.completedTasks));
    }

    // Method to add a task
    addTask(taskText, priority) {
        // Create a new task object
        const task = {
            text: taskText,
            timestamp: new Date().toLocaleString(),
            notes: [],
            priority: priority
        };
        // Add the task to the tasks array
        this.tasks.push(task);
        // Save the tasks to localStorage
        this.saveTasks();
    }

    // Method to list all tasks
    listTasks() {
        // Return a new array that combines tasks and completedTasks
        return [...this.tasks, ...this.completedTasks];
    }

    // Method to delete a task
    deleteTask(task) {
        // Find the index of the task in the tasks array
        const index = this.tasks.indexOf(task);
        // If the task is found, remove it from the tasks array
        if (index > -1) {
            this.tasks.splice(index, 1);
        } else {
            // If the task is not found in the tasks array, find it in the completedTasks array
            const completedIndex = this.completedTasks.indexOf(task);
            // If the task is found, remove it from the completedTasks array
            if (completedIndex > -1) {
                this.completedTasks.splice(completedIndex, 1);
            }
        }
        // Save the tasks to localStorage
        this.saveTasks();
    }

    // Method to mark a task as completed
    completeTask(task) {
        // Find the index of the task in the tasks array
        const index = this.tasks.indexOf(task);
        // If the task is found, remove it from the tasks array and add it to the completedTasks array
        if (index > -1) {
            this.tasks.splice(index, 1);
            this.completedTasks.push(task);
        }
        // Save the tasks to localStorage
        this.saveTasks();
    }

    // Method to add a note to a task
    addNoteToTask(taskId, note) {
        // Find the task by its id
        const task = this.tasks.find(t => t.id === taskId);
        // If the task is found, add the note to its notes array
        if (task) {
            task.notes.push(note);
        }
        // Save the tasks to localStorage
        this.saveTasks();
    }

    // Method to delete a note from a task
    deleteNoteFromTask(taskText, noteId) {
        // Find the task by its text
        const task = this.tasks.find(t => t.text === taskText);
        // If the task is found, find the note by its id
        if (task) {
            const noteIndex = task.notes.findIndex(note => note.id === noteId);
            // If the note is found, remove it from the task's notes array
            if (noteIndex > -1) {
                task.notes.splice(noteIndex, 1);
            }
        }
        // Save the tasks to localStorage
        this.saveTasks();
    }

    // Method to toggle a task's completion status
    toggleCompleteTask(taskText) {
        // Find the task by its text
        const task = this.listTasks().find(t => t.text === taskText);
        // If the task is found in the tasks array, remove it and add it to the completedTasks array
        if (this.tasks.includes(task)) {
            this.tasks.splice(this.tasks.indexOf(task), 1);
            this.completedTasks.push(task);
        }
        // If the task is found in the completedTasks array, remove it and add it to the tasks array
        else if (this.completedTasks.includes(task)) {
            this.completedTasks.splice(this.completedTasks.indexOf(task), 1);
            this.tasks.push(task);
        }
        // Save the tasks to localStorage
        this.saveTasks();
    }
}

// Create a new instance of TaskManager
const myTaskManager = new TaskManager();
// Display tasks on page load
displayTasks();

// Function to fetch tasks from the server
function fetchTasks() {
    // Send a GET request to the server
    fetch('/api/tasks')
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            // If data is received, update the tasks and completedTasks in myTaskManager
            if (data && data.data) {
                myTaskManager.tasks = data.data.filter(task => !task.is_completed);
                myTaskManager.completedTasks = data.data.filter(task => task.is_completed);
                // Display the updated tasks
                displayTasks();
            }
        })
        .catch(error => console.error('Error fetching tasks:', error)); // Log any errors
}

// Function to add a new task
function addTask() {
    // Get the task input and priority select elements
    const taskInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');
    // If the task input has a value, send a POST request to the server
    if (taskInput.value) {
        fetch('/api/task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: taskInput.value, priority: prioritySelect.value })
        })
            .then(response => response.json()) // Parse the response as JSON
            .then(() => {
                // Clear the task input and fetch the updated tasks
                taskInput.value = '';
                fetchTasks();
            })
            .catch(error => console.error('Error adding task:', error)); // Log any errors
    }
}

// Function to delete a task
function deleteTask(taskText) {
    // Find the task by its text
    const task = myTaskManager.listTasks().find(t => t.text === taskText);
    // If the task is found, send a DELETE request to the server
    if (task) {
        fetch(`/api/task/${task.id}`, { method: 'DELETE' })
            .then(() => fetchTasks()) // Fetch the updated tasks
            .catch(error => console.error('Error deleting task:', error)); // Log any errors
    }
}

// Function to add a note to a task
function addNoteToTask(taskId, noteContent) {
    // If the note content is empty, log an error and return
    if (noteContent.trim() === '') {
        console.error('Note content is empty');
        return;
    }
    // Send a POST request to the server
    fetch(`/api/task/${taskId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteContent })
    })
        .then(response => response.json()) // Parse the response as JSON
        .then(data => {
            // If data is received, add the note to the task and display the updated tasks
            if (data && data.id) {
                myTaskManager.addNoteToTask(taskId, { id: data.id, content: noteContent });
                displayTasks();
            }
        })
        .catch(error => console.error('Error adding note:', error)); // Log any errors
}

// Function to delete a note
function deleteNote(taskId, noteId) {
    // Send a DELETE request to the server
    fetch(`/api/note/${taskId}/${noteId}`, { method: 'DELETE' })
        .then(() => {
            // Remove the note element from the DOM and fetch the updated tasks
            const noteElement = document.getElementById(`note-${taskId}-${noteId}`);
            if (noteElement) noteElement.remove();
            fetchTasks();
        })
        .catch(error => console.error('Error deleting note:', error)); // Log any errors
}

// Function to mark a task as completed
function completeTask(taskText) {
    // Find the task by its text
    const task = myTaskManager.listTasks().find(t => t.text === taskText);
    // If the task is found, mark it as completed and display the updated tasks
    if (task) myTaskManager.completeTask(task);
    displayTasks();
}

// Function to toggle a task's completion status
function toggleCompleteTask(taskText) {
    // Find the task by its text
    const task = myTaskManager.listTasks().find(t => t.text === taskText);
    // If the task is found, send a PUT request to the server
    if (task) {
        fetch(`/api/task/${task.id}/complete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: task.is_completed ? 0 : 1 })
        })
            .then(() => fetchTasks()) // Fetch the updated tasks
            .catch(error => console.error('Error updating task:', error)); // Log any errors
    }
}

/**
 * Creates a div element with a specified class and content.
 *
 * @param {string} className - The class to be assigned to the div.
 * @param {string} content - The text content to be added to the div.
 * @returns {HTMLElement} The created div element.
 */
function createDivWithClassAndContent(className, content) {
    // Create a new div element
    const div = document.createElement('div');

    // Assign the specified class to the div
    div.className = className;

    // Set the text content of the div
    div.textContent = content;

    // Return the created div
    return div;
}

/**
 * Creates a button element with a specified class and onclick event handler.
 *
 * @param {string} className - The class to be assigned to the button.
 * @param {Function} onClick - The function to be executed when the button is clicked.
 * @returns {HTMLElement} The created button element.
 */
function createButtonWithClassAndOnClick(className, onClick) {
    // Create a new button element
    const button = document.createElement('button');

    // Assign the specified class to the button
    button.className = className;

    // Set the onclick event handler of the button
    button.onclick = onClick;

    // Return the created button
    return button;
}

// Function to display tasks
function displayTasks() {
    // Get the task list element
    const taskList = document.getElementById('taskList');
    // Clear the task list
    taskList.innerHTML = '';

    // Sort the tasks by completion status and priority
    const sortedTasks = myTaskManager.listTasks().sort((a, b) => {
        // Completed tasks go to the end
        if (myTaskManager.completedTasks.includes(a)) return 1;
        if (myTaskManager.completedTasks.includes(b)) return -1;
        // High priority tasks go to the start
        if (a.priority === '🚨 High Priority' && b.priority !== '🚨 High Priority') return -1;
        if (b.priority === '🚨 High Priority' && a.priority !== '🚨 High Priority') return 1;
        // Medium priority tasks go before low priority tasks
        if (a.priority === '🚧 Medium Priority' && b.priority === '📗 Low/New Feature') return -1;
        if (b.priority === '🚧 Medium Priority' && a.priority === '📗 Low/New Feature') return 1;
        // If none of the above conditions are met, don't change the order
        return 0;
    });

    let completedTaskAdded = false; // Define the completedTaskAdded variable

// For each task
sortedTasks.forEach(taskObj => {
    // Create a list item
    const li = document.createElement('li');
    // If the task is completed, add a 'completed-task' class
    li.className = taskObj.is_completed ? 'completed-task' : '';

    // Create a div for the timestamp and a div for the task text
    const timestampDiv = createDivWithClassAndContent('task-timestamp', taskObj.timestamp);
    const taskDiv = createDivWithClassAndContent('task-text', taskObj.priority + ' ' + taskObj.text);
    // If the task is completed, add a 'completed-task-text' class
    if (taskObj.is_completed) taskDiv.classList.add('completed-task-text');

    // Append the timestamp and task divs to the list item
    li.appendChild(timestampDiv);
    li.appendChild(taskDiv);

    // If the task has notes
    if (taskObj.notes && taskObj.notes.length > 0) {
        // Create a list for the notes
        const notesUl = document.createElement('ul');
        // For each note
        taskObj.notes.forEach(note => {
            // Create a list item
            const noteLi = document.createElement('li');
            // Set the id and text content
            noteLi.id = `note-${taskObj.id}-${note.id}`;
            noteLi.textContent = note.content;

            // If the task is not completed
            if (!taskObj.is_completed) {
                // Create a delete button for the note
                const deleteNoteButton = createButtonWithClassAndOnClick('note-delete-button', () => deleteNote(taskObj.id, note.id));
                deleteNoteButton.textContent = 'Delete Note';
                // Append the delete button to the note list item
                noteLi.appendChild(deleteNoteButton);
            }

            // Append the note list item to the notes list
            notesUl.appendChild(noteLi);
        });

        // Append the notes list to the task list item
        li.appendChild(notesUl);
    }

    // If the task is not completed
    if (!taskObj.is_completed) {
        // Create an input field and a button for adding notes
        const notesInput = document.createElement('input');
        notesInput.type = 'text';
        notesInput.placeholder = 'Add a note';

        const notesButton = createButtonWithClassAndOnClick('notesButton', () => {
            // If the input field has a value
            if (notesInput.value) {
                // Add a note to the task
                addNoteToTask(taskObj.id, notesInput.value);
                // Clear the input field
                notesInput.value = '';
            }
        });
        notesButton.textContent = 'Add Note';

        // Append the input field and button to the task list item
        li.appendChild(notesInput);
        li.appendChild(notesButton);
    }

    // Create a div for the task buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'task-buttons';

    // Create a delete button
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete'; // Set the button text
    deleteButton.className = 'deleteButton'; // Set the class name
    deleteButton.onclick = () => deleteTask(taskObj.text); // Set the onclick function to delete the task
    buttonsDiv.appendChild(deleteButton); // Add the delete button to the buttons div

    // Create a complete button
    const completeButton = document.createElement('button');
    completeButton.className = 'completeButton'; // Set the class name
    completeButton.textContent = taskObj.is_completed ? 'Incomplete' : 'Complete'; // Set the button text based on the task completion status
    completeButton.onclick = () => toggleCompleteTask(taskObj.text); // Set the onclick function to toggle the task completion status
    buttonsDiv.appendChild(completeButton); // Add the complete button to the buttons div

    li.appendChild(buttonsDiv); // Add the buttons div to the list item

    // If the task is completed and the completed task separator has not been added yet
    if (taskObj.is_completed && !completedTaskAdded) {
        const separator = document.createElement('div'); // Create a new div element for the separator
        separator.className = 'task-separator'; // Set the class name
        taskList.appendChild(separator); // Add the separator to the task list
        completedTaskAdded = true; // Set the flag to indicate that the completed task separator has been added
    }

    // Append the task list item to the task list
    taskList.appendChild(li);
});
}