-- Seed data for Todo app example
-- Run this after creating the schema to add sample data

INSERT INTO todos (text, completed) VALUES 
  ('Check out the frontend code in src/App.tsx', 0),
  ('Look at the backend API in worker/index.ts', 0),
  ('Explore the database schema in db/schema.sql', 1),
  ('Try adding a new todo above', 0),
  ('Deploy to Cloudflare Workers when ready', 0);