import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>Farm Management Dashboard</h1>
      <ul>
        <li>Animals</li>
        <li>Vaccinations</li>
        <li>Inventory</li>
        <li>Biosecurity</li>
        <li>Reporting</li>
      </ul>
      <p>Backend API expected at http://localhost:4000</p>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
