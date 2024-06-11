## Branch Update

Please note that we have transitioned our default branch from `main` to `master`. All future updates and commits will be made to the `master` branch.

# Task Manager

A web application designed to help manage tasks with different priorities, enhanced by a real-time interactive interface using WebSockets. This application is ideal for tracking tasks and their completion status without the need to reload the page.

## Features

- **Real-Time Task Updates:** Leverages WebSockets for real-time communication between the client and server.
- **Task Prioritization:** Supports categorizing tasks into three levels of priority: High, Medium, and Low/New Features.
- **Persistent Storage:** Uses SQLite to store tasks and notes persistently.
- **Task Modification:** Allows tasks to be marked as completed and priority to be changed dynamically.
- **Notes Addition:** Tasks can have notes added to them, providing extra details without altering the original task description.

## Installation

To set up the Task Manager locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YourUsername/Task-Manager.git
   cd Task-Manager

2. **Install dependencies:**
   npm install

3. **Start the server:**
   node server.js
   This command will start the local server on port 3000.

4. **Accessing the application:**
   Open `http://localhost:3000` in your web browser to start using the Task Manager

Contributing

Contributions are welcome! For major changes, please open an issue first to discuss what you would like to change. Please ensure to update tests as appropriate.

