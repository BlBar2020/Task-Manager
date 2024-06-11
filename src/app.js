import React, { useState, useEffect, useRef } from 'react';
import TaskList from './components/TaskList';
import AddTask from './components/AddTask';
import ChangePriorityModal from './components/ChangePriorityModal';
import AddNoteModal from './components/AddNoteModal';
import './style.css';
import bannerImage from './images/TaskManagerBanner.png';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [ws, setWs] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let socket;
    let heartbeatInterval;

    const connectWebSocket = () => {
      console.log('Attempting to connect WebSocket');
      socket = new WebSocket('ws://localhost:3000');
      socketRef.current = socket;
      setWs(socket);

      socket.onopen = () => {
        console.log('WebSocket is open now.');
        fetchTasks(socket);

        // Start heartbeat
        heartbeatInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000); // Send a heartbeat every 30 seconds
      };

      socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        const message = JSON.parse(event.data);
        handleSocketMessage(message);
      };

      socket.onerror = (event) => console.error('WebSocket error observed:', event);

      socket.onclose = (event) => {
        console.log('WebSocket is closed now:', event.reason);
        clearInterval(heartbeatInterval);
        setWs(null);
        // Reconnect after a delay
        setTimeout(connectWebSocket, 1000);
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearInterval(heartbeatInterval);
    };
  }, []);

  const fetchTasks = (socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      console.log('Fetching tasks');
      socket.send(JSON.stringify({ type: 'fetchTasks' }));
    } else {
      console.log('WebSocket not open. Retrying fetch tasks.');
      setTimeout(() => fetchTasks(socket), 100);
    }
  };

  const handleSocketMessage = (data) => {
    console.log('Received WebSocket message:', data);
    switch (data.type) {
      case 'connection':
        console.log('Connection established:', data.message);
        break;
      case 'update':
        setTasks(data.tasks.map(task => ({
          ...task,
          notes: Array.isArray(task.notes) ? task.notes : []
        })));
        break;
      case 'taskAdded':
      case 'taskDeleted':
      case 'taskUpdated':
      case 'priorityUpdated':
      case 'noteAdded':
      case 'noteDeleted':
        fetchTasks(socketRef.current);
        break;
      default:
        console.warn('Unhandled message type:', data.type);
    }
  };

  const sendMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket readyState:', socketRef.current.readyState);
      console.log('Sending message:', message);
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open. Message not sent:', message);
      // Retry sending the message after a delay if the socket is not open
      setTimeout(() => sendMessage(message), 100);
    }
  };

  const addTask = (taskText, priority) => {
    if (taskText.trim() === '') return;
    console.log('Adding task:', taskText, priority);
    sendMessage({ type: 'addTask', task: { text: taskText, priority: priority } });
  };

  const deleteTask = (taskId) => {
    console.log('Deleting task:', taskId);
    sendMessage({ type: 'deleteTask', taskId: taskId });
  };

  const toggleCompleteTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    console.log('Toggling complete for task:', taskId);
    sendMessage({ type: 'toggleCompleteTask', taskId: taskId, completed: !task.is_completed });
  };

  const changeTaskPriority = (taskId, newPriority) => {
    console.log('Changing priority for task:', taskId, newPriority);
    sendMessage({ type: 'changePriority', taskId: taskId, priority: newPriority });
    setShowPriorityModal(false);
  };

  const addNoteToTask = (taskId, noteContent) => {
    if (noteContent.trim() === '') return;
    console.log('Adding note to task:', taskId, noteContent);
    sendMessage({ type: 'addNote', note: { taskId: taskId, content: noteContent } });
    setShowNoteModal(false);
  };

  const deleteNote = (taskId, noteId) => {
    console.log('Deleting note:', noteId, 'from task:', taskId);
    sendMessage({ type: 'deleteNote', taskId: taskId, noteId: noteId });
  };

  // Sort tasks and group by completion status
  const sortedTasks = tasks.sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }
    const priorityOrder = {
      '🚨 High Priority': 1,
      '🚧 Medium Priority': 2,
      '📗 Low/New Feature': 3
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const incompleteTasks = sortedTasks.filter(task => !task.is_completed);
  const completedTasks = sortedTasks.filter(task => task.is_completed);

  return (
    <div className="App">
      <header>
        <img src="images/favicon.ico" alt="Favicon" className="logo" />
        <img src={bannerImage} alt="Task Manager Banner" className="banner" />
      </header>
      <main className="container">
        <div className="main-content">
          <AddTask addTask={addTask} />
          <TaskList
            tasks={incompleteTasks}
            deleteTask={deleteTask}
            toggleCompleteTask={toggleCompleteTask}
            setShowPriorityModal={setShowPriorityModal}
            setShowNoteModal={setShowNoteModal}
            setCurrentTask={setCurrentTask}
            deleteNote={deleteNote}
          />
          <div className="task-separator"></div>
          <TaskList
            tasks={completedTasks}
            deleteTask={deleteTask}
            toggleCompleteTask={toggleCompleteTask}
            setShowPriorityModal={setShowPriorityModal}
            setShowNoteModal={setShowNoteModal}
            setCurrentTask={setCurrentTask}
            deleteNote={deleteNote}
          />
        </div>
      </main>
      {showPriorityModal && <ChangePriorityModal changeTaskPriority={changeTaskPriority} currentTask={currentTask} closeModal={() => setShowPriorityModal(false)} />}
      {showNoteModal && <AddNoteModal addNoteToTask={addNoteToTask} currentTask={currentTask} closeModal={() => setShowNoteModal(false)} />}
    </div>
  );
};

export default App;