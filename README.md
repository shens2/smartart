# Smartart-2.0

A modern implementation of SmartArt components for React applications.

## Features

- List SmartArt component with interactive features
- CycleSmartArt component with dynamic node placement
- Clean, modern styling
- Fully responsive design

## Installation

```bash
npm install
npm start
```

## Usage

```jsx
import { ListSmartArt } from './components/SmartArt';

const nodes = [
  {
    id: 1,
    title: "Title",
    description: "Description",
    image: "/path/to/image" // optional
  }
];

function App() {
  return (
    <ListSmartArt nodes={nodes} />
  );
}
```
