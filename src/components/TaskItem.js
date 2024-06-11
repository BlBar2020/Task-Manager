import React from 'react';

const TaskItem = ({ task, deleteTask, toggleCompleteTask, openPriorityModal, openNoteModal, deleteNoteFromTask }) => (
  <li className={task.is_completed ? 'completed-task' : ''}>
    <div className="task-timestamp">{task.timestamp}</div>
    <div className={`task-text ${task.is_completed ? 'completed-task-text' : ''}`}>
      {task.priority} - {task.text}
    </div>
    <button className="changePriorityButton" onClick={() => openPriorityModal(task)}>Change Priority</button>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <button className="deleteButton" onClick={() => deleteTask(task.id)}>Delete</button>
      <button className="toggleCompleteButton" onClick={() => toggleCompleteTask(task.id)}>
        {task.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
      </button>
    </div>
    <button className="addNoteButton" onClick={() => openNoteModal(task)}>Add Note</button>
    {task.notes && task.notes.length > 0 ? (
      <div className="notes-section">
        {task.notes.map(note => (
          <div key={note.id} className="note-container">
            {note.content}
            <div className="delete-note-button-container">
              <button className="deleteNoteButton" onClick={() => deleteNoteFromTask(task.id, note.id)}>Delete Note</button>
            </div>
          </div>
        ))}
      </div>
    ) : null}
  </li>
);

export default TaskItem;