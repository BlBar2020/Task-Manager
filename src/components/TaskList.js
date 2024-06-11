import React, { useEffect } from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, deleteTask, toggleCompleteTask, setShowPriorityModal, setShowNoteModal, setCurrentTask, deleteNote }) => {
  useEffect(() => {
    console.log('TaskList rendered with tasks:', tasks);
  }, [tasks]);

  const openPriorityModal = (task) => {
    setCurrentTask(task);
    setShowPriorityModal(true);
  };

  const openNoteModal = (task) => {
    setCurrentTask(task);
    setShowNoteModal(true);
  };

  return (
    <ul id="taskList">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          deleteTask={deleteTask}
          toggleCompleteTask={toggleCompleteTask}
          openPriorityModal={openPriorityModal}
          openNoteModal={openNoteModal}
          deleteNoteFromTask={deleteNote}
        />
      ))}
    </ul>
  );
};

export default TaskList;