import React, { useState, useEffect } from 'react';

const AddNoteModal = ({ addNoteToTask, currentTask, closeModal }) => {
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    console.log('AddNoteModal rendered for task:', currentTask);
  }, [currentTask]);

  const handleSave = () => {
    console.log('Adding note:', noteContent);
    addNoteToTask(currentTask.id, noteContent);
    setNoteContent('');
  };

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <span className="close-button" onClick={closeModal}>×</span>
        <h2>Add Note</h2>
        <textarea
          id="noteInput"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Add note here..."
          className="modal-input"
          rows="5"
        />
        <button type="button" id="saveNoteButton" onClick={handleSave}>OK</button>
      </div>
    </div>
  );
};

export default AddNoteModal;