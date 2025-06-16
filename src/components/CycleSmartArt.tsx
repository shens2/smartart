import React, { useState } from 'react';
import styled from 'styled-components';

// Types for the component props
interface CycleNode {
  id: number;
  title: string;
  description: string;
}

interface CycleSmartArtProps {
  nodes: CycleNode[];
  onNodesChange?: (nodes: CycleNode[]) => void;
}

// Styled components
const CycleContainer = styled.div`
  position: relative;
  width: 800px;
  height: 800px;
  margin: 20px auto;
  display: flex;
  justify-content: center;
  align-items: center;
  
  &:hover .add-button {
    opacity: 1;
  }
`;

const CircleTrack = styled.div`
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  border: 1px dashed #e0e0e0;
`;

const NodeMarker = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  font-size: 32px;
  font-weight: bold;
  color: #50B2C0;
  text-align: center;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: translate(-50%, -50%);
  z-index: 2;
`;

const NodeContent = styled.div<{ $position: string; $x: number; $y: number }>`
  position: absolute;
  width: 200px;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: translate(-50%, -50%);
  text-align: ${props => {
    switch(props.$position) {
      case 'left':
      case 'top-left':
      case 'bottom-left':
        return 'right';
      case 'right':
      case 'top-right':
      case 'bottom-right':
        return 'left';
      default:
        return 'center';
    }
  }};
`;

const NodeTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
`;

const NodeDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: #666666;
  line-height: 1.4;
`;

const AddButtonWrapper = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: translate(-50%, -50%);
  z-index: 3;
`;

const AddButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: white;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #424242;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
  padding: 0;
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.14);
  
  &:hover {
    color: #3498db;
    transform: scale(1.1);
    box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.12), 0px 2px 4px 0px rgba(0, 0, 0, 0.14);
    border-color: #3498db;
  }
  
  &:focus {
    outline: none;
  }
`;

// CycleSmartArt Component
const CycleSmartArt: React.FC<CycleSmartArtProps> = ({ nodes: initialNodes, onNodesChange }) => {
  // State for managing nodes internally if no onNodesChange is provided
  const [internalNodes, setInternalNodes] = useState<CycleNode[]>(initialNodes);
  const [isHovered, setIsHovered] = useState(false);
  
  // Use provided nodes or internal state
  const nodes = onNodesChange ? initialNodes : internalNodes;
  
  // Calculate positions for nodes along the circle - clockwise
  const calculateNodePosition = (index: number, total: number, radius: number = 250) => {
    // Calculate the angle for this node (in radians)
    // We start from the top (90 degrees) and go clockwise
    const angleInDegrees = 90 - (index * (360 / total));
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    
    // Calculate x and y coordinates on the circle
    const centerX = 400; // center of the container
    const centerY = 400;
    
    const x = centerX + radius * Math.cos(angleInRadians);
    const y = centerY - radius * Math.sin(angleInRadians); // minus because y is flipped in the browser
    
    // Determine position name for content placement
    let position;
    const normalizedAngle = ((angleInDegrees % 360) + 360) % 360; // Normalize to 0-360
    
    if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) position = 'right';
    else if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) position = 'bottom-right';
    else if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) position = 'bottom';
    else if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) position = 'bottom-left';
    else if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) position = 'left';
    else if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) position = 'top-left';
    else if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) position = 'top';
    else position = 'top-right';
    
    // Calculate offset for content outside the circle
    const contentOffsetX = 30 * Math.cos(angleInRadians);
    const contentOffsetY = -30 * Math.sin(angleInRadians); // minus because y is flipped
    
    // Calculate position for text content (outside the circle)
    const textX = x + contentOffsetX;
    const textY = y + contentOffsetY;
    
    return { x, y, textX, textY, position };
  };
  
  // Calculate position for add button between nodes
  const calculateAddButtonPosition = (indexBefore: number, total: number, radius: number = 250) => {
    if (total <= 1) return { x: 0, y: 0 };
    
    // Calculate the angles of adjacent nodes
    const angleBefore = 90 - (indexBefore * (360 / total));
    const angleAfter = 90 - (((indexBefore + 1) % total) * (360 / total));
    
    // Calculate the exact midpoint angle between nodes
    let midAngle;
    
    // Handle the case when we need to wrap around the circle (between last and first node)
    if (Math.abs(angleBefore - angleAfter) > 180) {
      const adjustedAngleBefore = angleBefore < 0 ? angleBefore + 360 : angleBefore;
      const adjustedAngleAfter = angleAfter < 0 ? angleAfter + 360 : angleAfter;
      midAngle = (adjustedAngleBefore + adjustedAngleAfter + 360) / 2;
      if (midAngle >= 360) midAngle -= 360;
    } else {
      midAngle = (angleBefore + angleAfter) / 2;
    }
    
    // Ensure there is a button between the last and first node
    if (indexBefore === total - 1) {
      midAngle = (angleBefore + 360 + angleAfter) / 2;
      if (midAngle >= 360) midAngle -= 360;
    }
    
    const midAngleRad = (midAngle * Math.PI) / 180;
    
    // Calculate x and y coordinates for the add button
    const centerX = 400;
    const centerY = 400;
    
    const x = centerX + radius * Math.cos(midAngleRad);
    const y = centerY - radius * Math.sin(midAngleRad); // minus because y is flipped in the browser
    
    return { x, y };
  };
  
  // Handle adding a new node
  const handleAddNode = (indexToInsertAfter: number) => {
    // Generate a new ID
    const maxId = Math.max(...nodes.map(node => node.id), 0);
    const newId = maxId + 1;
    
    // Create the new node with default data
    const newNode: CycleNode = {
      id: newId,
      title: "New Step",
      description: "Add details here"
    };
    
    // Create a new array with the inserted node
    const updatedNodes = [...nodes];
    updatedNodes.splice(indexToInsertAfter + 1, 0, newNode);
    
    // Update the nodes
    if (onNodesChange) {
      onNodesChange(updatedNodes);
    } else {
      setInternalNodes(updatedNodes);
    }
  };

  return (
    <CycleContainer 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Circular track */}
      <CircleTrack />
      
      {/* Add buttons between nodes */}
      {nodes.length > 0 && nodes.map((_, index) => {
        const { x, y } = calculateAddButtonPosition(index, nodes.length);
        
        return (
          <AddButtonWrapper key={`add-${index}`} $x={x} $y={y}>
            <AddButton 
              onClick={() => handleAddNode(index)} 
              className="add-button"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              +
            </AddButton>
          </AddButtonWrapper>
        );
      })}
      
      {/* Nodes */}
      {nodes.map((node, index) => {
        const { x, y, textX, textY, position } = calculateNodePosition(index, nodes.length);
        
        return (
          <React.Fragment key={node.id}>
            {/* Numbered marker - directly on the circle */}
            <NodeMarker 
              $x={x} 
              $y={y}
              style={{ 
                transform: `translate(-50%, -50%)`,
                left: `${x}px`,
                top: `${y}px`
              }}
            >
              {index + 1}
            </NodeMarker>
            
            {/* Node content (title and description) - outside the circle */}
            <NodeContent 
              $x={textX} 
              $y={textY} 
              $position={position}
            >
              <NodeTitle>{node.title}</NodeTitle>
              <NodeDescription>{node.description}</NodeDescription>
            </NodeContent>
          </React.Fragment>
        );
      })}
    </CycleContainer>
  );
};

export { CycleSmartArt };
export default CycleSmartArt;
