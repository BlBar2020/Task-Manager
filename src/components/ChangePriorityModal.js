import React, { useState, useEffect } from 'react';

const ChangePriorityModal = ({ changeTaskPriority, currentTask, closeModal }) => {
  const [newPriority, setNewPriority] = useState(currentTask.priority);

  useEffect(() => {
    console.log('ChangePriorityModal rendered for task:', currentTask);
  }, [currentTask]);

  const handleSave = () => {
    console.log('Saving new priority:', newPriority);
    changeTaskPriority(currentTask.id, newPriority);
  };

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close-button" onClick={closeModal}>×</span>
        <h2>Change Task Priority</h2>
        <div className="radios-container">
          {['🚨 High Priority', '🚧 Medium Priority', '📗 Low/New Feature'].map(priority => (
            <div key={priority} className="radio-container">
              <input
                type="radio"
                id={priority}
                name="priority"
                value={priority}
                checked={newPriority === priority}
                onChange={(e) => setNewPriority(e.target.value)}
              />
              <label htmlFor={priority}>{priority}</label>
            </div>
          ))}
        </div>
        <button type="button" id="savePriorityButton" onClick={handleSave}>OK</button>
      </div>
    </div>
  );
};

export default ChangePriorityModal;