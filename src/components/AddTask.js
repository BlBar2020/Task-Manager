import React, { useState } from 'react';

const AddTask = ({ addTask }) => {
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState('📗 Low/New Feature');

  const handleAddTask = () => {
    console.log('Adding task:', taskText, priority);
    addTask(taskText, priority);
    setTaskText('');
  };

  return (
    <div className="center-container">
      <textarea
        id="taskInput"
        value={taskText}
        onChange={(e) => setTaskText(e.target.value)}
        placeholder="New task"
        rows="5"
      />
      <div className="priority-container">
        <span style={{ color: 'white', marginRight: '10px' }}>Choose a Priority Level</span>
        <select id="prioritySelect" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="🚨 High Priority">🚨 High Priority</option>
          <option value="🚧 Medium Priority">🚧 Medium Priority</option>
          <option value="📗 Low/New Feature">📗 Low/New Feature</option>
        </select>
      </div>
      <div id="addTaskButton-container">
        <button id="addTaskButton" onClick={handleAddTask}>Add Task</button>
      </div>
    </div>
  );
};

export default AddTask;