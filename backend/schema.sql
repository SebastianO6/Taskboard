CREATE DATABASE IF NOT EXISTS taskboard;
USE taskboard;

CREATE TABLE IF NOT EXISTS tasks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  priority   ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  done       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, priority) VALUES
  ('Re-read the React hooks docs', 'high'),
  ('Wire Flask to MySQL', 'medium'),
  ('Write one parameterized query', 'low');
