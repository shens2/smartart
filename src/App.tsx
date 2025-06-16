import React from 'react';
import './App.css';
import SmartArt from './components/SmartArt';

// Sample data for the SmartArt component
const nodes = [
  {
    id: 1,
    title: 'Dogs',
    body: 'Dogs are loyal, intelligent companions known for their unconditional love and protective nature.',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    title: 'Cats',
    body: 'Cats are independent, curious creatures with a playful spirit and soothing purr that brings joy to many homes.',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    title: 'Birds',
    body: 'Birds are fascinating winged creatures that fill our skies with beautiful songs and vibrant colors.',
    image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80'
  }
];

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <main>
        <SmartArt nodes={nodes} />
      </main>
    </div>
  );
}

export default App;
