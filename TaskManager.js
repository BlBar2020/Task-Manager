'use strict';

class TaskManager {
  constructor() {
    this.socket = null;
    this.initializeWebSocket();
    this.onMessageCallback = null; // Callback to handle messages
  }

  initializeWebSocket() {
    if (!this.socket) {
      this.connectWebSocket();
    }
  }

  connectWebSocket() {
    console.log('Attempting to connect WebSocket');
    this.socket = new WebSocket('ws://localhost:3000');
    this.socket.onopen = () => {
      console.log('WebSocket is open now.');
      if (this.onOpenCallback) {
        this.onOpenCallback();
      }
    };
    this.socket.onerror = (event) => console.error('WebSocket error observed:', event);
    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(message);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    this.socket.onclose = (event) => {
      console.log('WebSocket is closed now:', event.reason);
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  setOnMessageCallback(callback) {
    this.onMessageCallback = callback;
  }

  setOnOpenCallback(callback) {
    this.onOpenCallback = callback;
  }

  sendMessage(message) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open');
    }
  }
}

export default TaskManager;