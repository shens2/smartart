import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';

// Types for the component props
interface Node {
  id: number;
  title: string;
  body: string;
  image: string;
}

/**
 * ListSmartArt - A SmartArt component that displays a horizontal list of nodes/cards
 * 
 * This component renders a series of cards in a horizontal layout, where each card contains:
 * - An image (with AI-generation capabilities)
 * - A title (editable)
 * - A description/body text (editable)
 * 
 * Features:
 * - Image insertion from device
 * - AI-powered image generation based on title
 * - Editable text fields
 * - Add/remove card functionality
 * - Interactive hover states and focus management
 * 
 * @param nodes - Array of node objects containing id, title, body and image properties
 */
interface SmartArtProps {
  nodes: Node[];
}

// Styled components for the SmartArt
const SmartArtContainer = styled.div<{ $isActive?: boolean; $nodeCount?: number; $menuOpen?: boolean }>`
  display: flex;
  justify-content: center;
  padding: 20px;
  pointer-events: ${props => props.$menuOpen ? 'none' : 'auto'};
  width: ${props => {
    const nodeCount = props.$nodeCount || 1; // Default to 1 if not provided
    const nodeWidth = 200; // Width of each node
    const nodeGap = 24; // Gap between nodes
    const padding = 40; // 20px * 2 for container padding
    // Calculate width based on number of nodes
    return (nodeCount * nodeWidth) + ((nodeCount - 1) * nodeGap) + padding;
  }}px;
  margin: 0 auto;
  border: 1px solid transparent;
  border-radius: 8px;
  position: relative;
  
  &:hover {
    border: ${props => props.$isActive ? '1px solid transparent' : '1px dashed #3498db'};
  }
`;

const NodesRow = styled.div`
  display: flex;
  gap: 24px;
  position: relative;
`;

const NodeContainer = styled.div<{ $isPressed?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 200px;
  min-height: 304px;
  position: relative;
  border-radius: 4px;
  border: ${props => props.$isPressed ? '1px solid #DC816A' : '1px solid transparent'};
  padding: 8px;
  box-sizing: border-box;
  transition: transform 0.2s ease, border 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const ImageContainer = styled.div<{ $isHovered?: boolean }>`
  height: 150px;
  background-color: #F0F0F0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
  position: relative;
  cursor: pointer;
`;

const NodeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const InsertPictureOverlay = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.2s ease;
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
  z-index: 850; // Above overlay but below menu
  /* Even when parent has pointer-events: none, this should still receive events */
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
`;

const InsertButton = styled.button`
  background: white;
  border: 1px solid #D1D1D1;
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 900; /* Higher than container but lower than menu */
  
  &:hover {
    border-color: #3498db;
    transform: scale(1.05);
  }
`;

const InsertIcon = styled.div`
  width: 20px;
  height: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    width: 14px;
    height: 14px;
    background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 2C0 0.89543 0.895431 0 2 0H12C13.1046 0 14 0.895431 14 2V6.25716C13.6929 6.00353 13.3578 5.78261 13 5.59971V2C13 1.44772 12.5523 1 12 1H2C1.44772 1 1 1.44772 1 2V9.29287L6.14642 4.14645C6.34169 3.95118 6.65827 3.95118 6.85353 4.14645L8.20659 5.49951C7.89087 5.64454 7.59125 5.8186 7.31114 6.01827L6.49998 5.20711L1 10.7071V12C1 12.5523 1.44772 13 2 13H5.59971C5.78261 13.3578 6.00353 13.6929 6.25716 14H2C0.89543 14 0 13.1046 0 12V2Z' fill='%233A3A38'/%3E%3Cpath d='M12 3C12 3.55228 11.5523 4 11 4C10.4477 4 10 3.55228 10 3C10 2.44772 10.4477 2 11 2C11.5523 2 12 2.44772 12 3Z' fill='%233A3A38'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    top: 3px;
    left: 3px;
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 9px;
    height: 9px;
    background-image: url("data:image/svg+xml,%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.5 9C6.98528 9 9 6.98528 9 4.5C9 2.01472 6.98528 0 4.5 0C2.01472 0 0 2.01472 0 4.5C0 6.98528 2.01472 9 4.5 9ZM2.14645 4.14645L4.14645 2.14645C4.34171 1.95118 4.65829 1.95118 4.85355 2.14645L6.85355 4.14645C7.04882 4.34171 7.04882 4.65829 6.85355 4.85355C6.65829 5.04882 6.34171 5.04882 6.14645 4.85355L5 3.70711V7.50015C5 7.77629 4.77614 8.00015 4.5 8.00015C4.22386 8.00015 4 7.77629 4 7.50015V3.70711L2.85355 4.85355C2.65829 5.04882 2.34171 5.04882 2.14645 4.85355C1.95118 4.65829 1.95118 4.34171 2.14645 4.14645Z' fill='%231E8BCD'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
    top: 9px;
    left: 9px;
  }
`;

const TextContainer = styled.div<{ $isPressed?: boolean }>`
  text-align: left;
  position: relative;
`;

const Title = styled.div<{ $isPressed?: boolean; $isEditing?: boolean }>`
  margin: 0 0 8px 0;
  color: ${props => props.$isPressed && props.$isEditing ? '#BDBDBD' : '#242424'};
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.375;
  text-align: left;
  position: relative;
  cursor: text;
  user-select: none;
  border-radius: 2px;
  padding: 2px 4px;
  margin: -2px -4px 6px -4px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
  
  ${props => props.$isPressed && props.$isEditing && `
    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 2px;
      width: 1px;
      height: 22px;
      background: black;
      animation: blink 1s infinite;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `}
`;

const TitleInput = styled.input<{ $isPressed?: boolean }>`
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.375;
  color: #242424;
  width: 100%;
  display: ${props => props.$isPressed ? 'block' : 'none'};
  border-radius: 2px;
  padding: 2px 4px;
  margin: -2px -4px 6px -4px;
  box-sizing: border-box;
`;

const Body = styled.div<{ $isPressed?: boolean }>`
  margin: -2px -4px;
  color: #000000;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.429;
  text-align: left;
  cursor: text;
  user-select: none;
  border-radius: 2px;
  padding: 2px 4px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
`;

const BodyInput = styled.textarea<{ $isPressed?: boolean }>`
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.429;
  color: #000000;
  width: 100%;
  min-height: auto;
  max-height: none;
  resize: none;
  overflow: hidden;
  display: ${props => props.$isPressed ? 'block' : 'none'};
  border-radius: 2px;
  padding: 2px 4px;
  margin: -2px -4px;
  box-sizing: border-box;
  transition: height 0.2s ease;
`;

const FloatingToolbar = styled.div<{ $show: boolean }>`
  position: absolute;
  top: -36px;
  left: 42px;
  background: white;
  border-radius: 8px;
  padding: 4px 0px;
  padding-left: 6px;
  padding-right: 6px;
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.12), 0px 4px 8px 0px rgba(0, 0, 0, 0.14);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  gap: 6px;
  z-index: 20;
`;

const ToolbarButton = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #242424;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f5f5f5;
  }
`;

const ToolbarIcon = styled.div<{ icon: 'arrow-left' | 'arrow-right' | 'delete' }>`
  width: 16px;
  height: ${props => props.icon === 'delete' ? '17px' : '14px'};
  background-image: ${props => {
    switch (props.icon) {
      case 'arrow-left':
        return `url("data:image/svg+xml,%3Csvg width='16' height='14' viewBox='0 0 16 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7.16289 13.8666C7.36683 14.0528 7.68308 14.0384 7.86926 13.8345C8.05544 13.6305 8.04105 13.3143 7.83711 13.1281L1.66925 7.49736H15.5C15.7761 7.49736 16 7.2735 16 6.99736C16 6.72122 15.7761 6.49736 15.5 6.49736H1.67214L7.83711 0.86927C8.04105 0.68309 8.05544 0.366835 7.86926 0.162895C7.68308 -0.0410457 7.36683 -0.0554433 7.16289 0.130737L0.246538 6.44478C0.106589 6.57254 0.0267601 6.74008 0.00704861 6.91323C0.00241375 6.94058 0 6.96869 0 6.99736C0 7.02423 0.00211954 7.05061 0.00620079 7.07633C0.0243754 7.25224 0.104488 7.4229 0.246538 7.55258L7.16289 13.8666Z' fill='%23242424'/%3E%3C/svg%3E")`;
      case 'arrow-right':
        return `url("data:image/svg+xml,%3Csvg width='16' height='14' viewBox='0 0 16 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.83711 0.130737C8.63317 -0.0554432 8.31692 -0.0410458 8.13074 0.162894C7.94456 0.366834 7.95895 0.683089 8.16289 0.869269L14.3307 6.5H0.5C0.223858 6.5 0 6.72386 0 7C0 7.27614 0.223858 7.5 0.5 7.5H14.3279L8.16289 13.1281C7.95895 13.3143 7.94456 13.6305 8.13074 13.8345C8.31692 14.0384 8.63317 14.0528 8.83711 13.8666L15.7535 7.55258C15.8934 7.42482 15.9732 7.25728 15.993 7.08414C15.9976 7.05678 16 7.02867 16 7C16 6.97313 15.9979 6.94675 15.9938 6.92103C15.9756 6.74512 15.8955 6.57446 15.7535 6.44478L8.83711 0.130737Z' fill='%23242424'/%3E%3C/svg%3E")`;
      case 'delete':
        return `url("data:image/svg+xml,%3Csvg width='16' height='17' viewBox='0 0 16 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6.5 2.5H9.5C9.5 1.67157 8.82843 1 8 1C7.17157 1 6.5 1.67157 6.5 2.5ZM5.5 2.5C5.5 1.11929 6.61929 0 8 0C9.38071 0 10.5 1.11929 10.5 2.5H15.5C15.7761 2.5 16 2.72386 16 3C16 3.27614 15.7761 3.5 15.5 3.5H14.4456L13.2521 13.8439C13.0774 15.3576 11.7957 16.5 10.2719 16.5H5.72813C4.20431 16.5 2.92256 15.3576 2.7479 13.8439L1.55437 3.5H0.5C0.223858 3.5 0 3.27614 0 3C0 2.72386 0.223858 2.5 0.5 2.5H5.5ZM3.74131 13.7292C3.85775 14.7384 4.71225 15.5 5.72813 15.5H10.2719C11.2878 15.5 12.1422 14.7384 12.2587 13.7292L13.439 3.5H2.56101L3.74131 13.7292ZM6.5 6C6.77614 6 7 6.22386 7 6.5V12.5C7 12.7761 6.77614 13 6.5 13C6.22386 13 6 12.7761 6 12.5V6.5C6 6.22386 6.22386 6 6.5 6ZM10 6.5C10 6.22386 9.77614 6 9.5 6C9.22386 6 9 6.22386 9 6.5V12.5C9 12.7761 9.22386 13 9.5 13C9.77614 13 10 12.7761 10 12.5V6.5Z' fill='%23242424'/%3E%3C/svg%3E")`;
      default:
        return 'none';
    }
  }};
  background-size: contain;
  background-repeat: no
  background-position: center;
`;

const ToolbarDivider = styled.div`
  width: 1px;
  height: 20px;
  background: #ECECEC;
`;

// Add Button Component - matching Figma exactly
const AddButton = styled.button<{ $containerActive?: boolean }>`
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
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.12), 0px 1px 2px 0px rgba(0, 0, 0, 0.14);
  padding: 0;
  
  &:hover {
    color: #3498db;
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.12), 0px 2px 4px 0px rgba(0, 0, 0, 0.14);
    border-color: #3498db;
  }
`;

// Container-level floating toolbar
const ContainerFloatingToolbar = styled.div<{ $show: boolean }>`
  position: absolute;
  top: -36px;
  left: 0;
  background: white;
  border-radius: 8px;
  padding: 4px 6px;
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.12), 0px 4px 8px 0px rgba(0, 0, 0, 0.14);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  gap: 6px;
  z-index: 20;
`;

// Container toolbar icon component
const ContainerToolbarIcon = styled.div<{ icon: 'copilot' | 'color' | 'text-panel' | 'comment' }>`
  width: 20px;
  height: 20px;
  background-image: ${props => {
    switch (props.icon) {
      case 'copilot':
        return `url("data:image/svg+xml,%3Csvg width='19' height='16' viewBox='0 0 19 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M4.9282 0H11.14C12.1934 0 13.1209 0.693927 13.4183 1.70449L13.8874 3.29881C14.0482 3.84522 14.5272 4.23174 15.0866 4.28042H15.3756C16.2632 4.28042 16.9483 4.53205 17.4027 5.04801C17.8453 5.5505 17.9916 6.218 18.0013 6.88665C18.0204 8.20751 17.5037 9.84836 17.092 11.1548C16.7338 12.2916 16.2735 13.4721 15.6557 14.3769C15.0405 15.2779 14.2005 15.9996 13.0736 15.9996H6.87588L6.86799 15.9996H6.86168C5.80827 15.9996 4.88075 15.3056 4.58341 14.2951L4.1143 12.7008C3.9536 12.1546 3.47493 11.7682 2.91585 11.7192H2.62618C1.73863 11.7192 1.05349 11.4676 0.599088 10.9516C0.156543 10.4491 0.0101817 9.78164 0.00051422 9.11298C-0.0185829 7.79212 0.498085 6.15127 0.909787 4.84487C1.26806 3.70803 1.7283 2.52756 2.3461 1.62278C2.96134 0.721738 3.80131 0 4.9282 0ZM1.86349 5.14543C1.43603 6.50184 0.984076 7.97304 1.00035 9.09852C1.00837 9.65304 1.13069 10.0423 1.3495 10.2907C1.55646 10.5257 1.92535 10.7193 2.62618 10.7193H5.25327C5.8625 10.7193 6.39922 10.3189 6.57318 9.7346C7.04275 8.15748 7.83892 5.49596 8.46732 3.45913L8.50031 3.35212C8.64945 2.86823 8.79377 2.40001 8.94918 1.98463C9.08157 1.63078 9.22975 1.29327 9.41044 0.999939H4.9282C4.28431 0.999939 3.70766 1.402 3.17189 2.18664C2.63868 2.96756 2.21353 4.03468 1.86349 5.14543ZM4.73563 11.7192C4.88309 11.928 4.99845 12.1632 5.07358 12.4185L5.54268 14.0128C5.71483 14.5979 6.25181 14.9996 6.86168 14.9996H6.88782C7.24677 14.996 7.49055 14.8266 7.64166 14.6217C7.80878 14.3951 7.96133 14.0783 8.11611 13.6646C8.2607 13.2781 8.39662 12.8373 8.54874 12.3439L8.579 12.2457C8.64401 12.035 8.71082 11.8176 8.7789 11.5953C8.54394 11.6726 8.29421 11.714 8.03709 11.714H5.41187C5.35937 11.7174 5.30648 11.7192 5.25327 11.7192H4.73563ZM7.19453 10.714H8.03709C8.5901 10.714 9.0841 10.3835 9.29945 9.884C9.73677 8.43816 10.1701 6.98802 10.4703 5.97969C10.5457 5.72633 10.6607 5.49296 10.8073 5.28556H9.96461C9.412 5.28556 8.91831 5.61558 8.70271 6.11449C8.26528 7.56072 7.83184 9.01135 7.53155 10.0199C7.45612 10.2733 7.34113 10.5066 7.19453 10.714ZM9.22296 4.40422C9.45786 4.32696 9.70755 4.28562 9.96461 4.28562H12.5909C12.6431 4.28217 12.6957 4.28042 12.7485 4.28042H13.2661C13.1186 4.07158 13.0033 3.83643 12.9281 3.58106L12.459 1.98675C12.2869 1.40168 11.7499 0.999939 11.14 0.999939H11.1252C10.7601 1.00017 10.5128 1.17092 10.3602 1.37795C10.193 1.60457 10.0405 1.92134 9.88571 2.33503C9.74112 2.7215 9.6052 3.16237 9.45308 3.65578L9.42282 3.75392C9.35782 3.96459 9.29102 4.18199 9.22296 4.40422ZM16.1383 10.8542C16.5658 9.4978 17.0177 8.0266 17.0015 6.90111C16.9935 6.34659 16.8711 5.95734 16.6523 5.70889C16.4454 5.47389 16.0765 5.28036 15.3756 5.28036H12.7485C12.1393 5.28036 11.6026 5.68074 11.4286 6.26503C10.9591 7.84215 10.1629 10.5037 9.5345 12.5405L9.50151 12.6475C9.35237 13.1314 9.20806 13.5996 9.05265 14.015C8.92025 14.3689 8.77207 14.7064 8.59138 14.9997H13.0736C13.7175 14.9997 14.2942 14.5976 14.8299 13.813C15.3631 13.0321 15.7883 11.965 16.1383 10.8542Z' fill='%23242424'/%3E%3C/svg%3E")`;
      case 'color':
        return `url("data:image/svg+xml,%3Csvg width='17' height='17' viewBox='0 0 17 17' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.11335 4.65233C8.54158 4.65233 8.88874 4.30518 8.88874 3.87695C8.88874 3.44871 8.54158 3.10156 8.11335 3.10156C7.68511 3.10156 7.33796 3.44871 7.33796 3.87695C7.33796 4.30518 7.68511 4.65233 8.11335 4.65233ZM11.2149 5.68619C11.6431 5.68619 11.9903 5.33903 11.9903 4.9108C11.9903 4.48256 11.6431 4.13541 11.2149 4.13541C10.7867 4.13541 10.4395 4.48256 10.4395 4.9108C10.4395 5.33903 10.7867 5.68619 11.2149 5.68619ZM13.7995 7.23696C13.7995 7.6652 13.4524 8.01235 13.0241 8.01235C12.5959 8.01235 12.2488 7.6652 12.2488 7.23696C12.2488 6.80873 12.5959 6.46158 13.0241 6.46158C13.4524 6.46158 13.7995 6.80873 13.7995 7.23696ZM13.0241 11.1139C13.4524 11.1139 13.7995 10.7668 13.7995 10.3385C13.7995 9.91028 13.4524 9.56313 13.0241 9.56313C12.5959 9.56313 12.2488 9.91028 12.2488 10.3385C12.2488 10.7668 12.5959 11.1139 13.0241 11.1139ZM11.7318 12.4062C11.7318 12.8345 11.3847 13.1816 10.9564 13.1816C10.5282 13.1816 10.1811 12.8345 10.1811 12.4062C10.1811 11.978 10.5282 11.6308 10.9564 11.6308C11.3847 11.6308 11.7318 11.978 11.7318 12.4062ZM12.1942 1.02526C9.34628 -0.437703 6.45212 -0.297331 3.99865 1.20585C2.74668 1.9729 1.3967 3.5867 0.634479 5.23024C0.251305 6.05647 -0.00330535 6.93189 3.24276e-05 7.74684C0.00342382 8.57487 0.276542 9.36537 0.969805 9.93042C1.60064 10.4446 2.14969 10.7035 2.68119 10.7298C3.21673 10.7562 3.63471 10.5393 3.96166 10.3464C4.03355 10.304 4.10084 10.2631 4.16517 10.224C4.41555 10.0719 4.62102 9.94705 4.87787 9.86565C5.16882 9.77345 5.53717 9.73942 6.07227 9.90293C6.26955 9.9632 6.38845 10.0526 6.47168 10.1554C6.56038 10.265 6.63141 10.4185 6.6844 10.6369C6.73782 10.8571 6.7669 11.1167 6.78862 11.4231C6.79671 11.5372 6.80424 11.6675 6.81213 11.8041C6.8236 12.0028 6.83585 12.2149 6.85174 12.41C6.90821 13.1035 7.02747 13.895 7.44505 14.6142C7.87309 15.3515 8.5834 15.9616 9.72306 16.3512C11.3795 16.9175 12.8929 16.458 14.071 15.5253C15.2356 14.6032 16.0938 13.2086 16.5228 11.8141C17.8823 7.39594 16.3043 3.13664 12.1942 1.02526ZM4.53876 2.0874C6.67302 0.779791 9.18273 0.640567 11.7218 1.94487C15.3475 3.80742 16.7599 7.52811 15.5347 11.51C15.1563 12.7398 14.4031 13.9437 13.4292 14.7147C12.4689 15.4751 11.3168 15.8035 10.0575 15.3729C9.12332 15.0536 8.62685 14.5907 8.33913 14.0951C8.04095 13.5816 7.93548 12.9806 7.88218 12.3261C7.86623 12.1302 7.85622 11.9535 7.84604 11.7739C7.83831 11.6375 7.83048 11.4994 7.81988 11.35C7.79721 11.0302 7.76362 10.7003 7.68911 10.3932C7.61416 10.0843 7.492 9.7727 7.27523 9.50493C7.05299 9.2304 6.75413 9.03023 6.37438 8.9142C5.6491 8.69259 5.0662 8.72144 4.56554 8.88011C4.17776 9.003 3.84367 9.20757 3.5869 9.36481C3.53327 9.39765 3.48301 9.42842 3.43633 9.45596C3.14146 9.62992 2.94775 9.70782 2.73226 9.69716C2.51272 9.6863 2.17138 9.57602 1.62298 9.12904C1.22435 8.80413 1.03632 8.33992 1.03388 7.7426C1.03138 7.13219 1.22623 6.41159 1.57238 5.66521C2.2688 4.16353 3.49687 2.72574 4.53876 2.0874Z' fill='%23242424'/%3E%3C/svg%3E")`;
      case 'text-panel':
        return `url("data:image/svg+xml,%3Csvg width='16' height='13' viewBox='0 0 16 13' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 3C0 1.34315 1.34315 0 3 0H13C14.6569 0 16 1.34315 16 3V10C16 11.6569 14.6569 13 13 13H3C1.34315 13 0 11.6569 0 10V3ZM6.5 1V12H13C14.1046 12 15 11.1046 15 10V3C15 1.89543 14.1046 1 13 1H6.5ZM5.5 1H3C1.89543 1 1 1.89543 1 3V10C1 11.1046 1.89543 12 3 12H5.5V1Z' fill='%23242424'/%3E%3C/svg%3E")`;
      case 'comment':
        return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17 4.5C17 6.98528 14.9853 9 12.5 9C10.0147 9 8 6.98528 8 4.5C8 2.01472 10.0147 0 12.5 0C14.9853 0 17 2.01472 17 4.5ZM13 2.5C13 2.22386 12.7761 2 12.5 2C12.2239 2 12 2.22386 12 2.5V4H10.5C10.2239 4 10 4.22386 10 4.5C10 4.77614 10.2239 5 10.5 5H12V6.5C12 6.77614 12.2239 7 12.5 7C12.7761 7 13 6.77614 13 6.5V5H14.5C14.7761 5 15 4.77614 15 4.5C15 4.22386 14.7761 4 14.5 4H13V2.5ZM15 11.2764V9.40029C15.3578 9.21739 15.6929 8.99647 16 8.74284V11.2764C16 12.6935 14.8359 13.8423 13.4 13.8423H8.80999L4.79895 16.8034C4.35668 17.1298 3.73 17.0406 3.39921 16.6042C3.26989 16.4335 3.2 16.2262 3.2 16.0133L3.19937 13.8423H2.6C1.16406 13.8423 0 12.6935 0 11.2764V4.56582C0 3.14876 1.34315 2 3 2H7.59971C7.43777 2.31679 7.30564 2.65136 7.20703 3H2.6C1.70383 3 1 3.71348 1 4.56582V11.2764C1 12.1288 1.70383 12.8423 2.6 12.8423H4.19908L4.2 16L4.20346 15.9997L4.20502 15.9988L8.48086 12.8423H13.4C14.2962 12.8423 15 12.1288 15 11.2764Z' fill='%23424242'/%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M17 4.5C17 6.98528 14.9853 9 12.5 9C10.0147 9 8 6.98528 8 4.5C8 2.01472 10.0147 0 12.5 0C14.9853 0 17 2.01472 17 4.5ZM12.9091 6.59091L12.9096 4.9091H14.5913C14.817 4.9091 15 4.72594 15 4.50001C15 4.27407 14.817 4.09092 14.5913 4.09092H12.9095L12.9091 2.40909C12.9091 2.18316 12.7259 2 12.5 2C12.2741 2 12.0909 2.18316 12.0909 2.40909L12.0913 4.09092L10.4087 4.09091C10.183 4.09091 10 4.27407 10 4.5C10 4.72593 10.183 4.90909 10.4087 4.90909L12.0914 4.9091L12.0909 6.59091C12.0909 6.81684 12.2741 7 12.5 7C12.7259 7 12.9091 6.81684 12.9091 6.59091Z' fill='%2337A660'/%3E%3C/svg%3E")`;
      default:
        return 'none';
    }
  }};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;

// Resize handles
const ResizeHandles = styled.div<{ $show: boolean }>`
  position: absolute;
  top: -6px;
  left: -6px;
  width: calc(100% + 12px);
  height: calc(100% + 12px);
  pointer-events: none;
  display: ${props => props.$show ? 'block' : 'none'};
`;

const ResizeHandle = styled.div<{ position: string }>`
  position: absolute;
  width: 12px;
  height: 12px;
  background: white;
  border: 1px solid #979593;
  border-radius: ${props => props.position.includes('center') ? '6px' : '50%'};
  box-shadow: 0px 0px 2px 0px rgba(0, 0, 0, 0.12), 0px 2px 4px 0px rgba(0, 0, 0, 0.14);
  cursor: ${props => {
    if (props.position.includes('top') && props.position.includes('left')) return 'nw-resize';
    if (props.position.includes('top') && props.position.includes('right')) return 'ne-resize';
    if (props.position.includes('bottom') && props.position.includes('left')) return 'sw-resize';
    if (props.position.includes('bottom') && props.position.includes('right')) return 'se-resize';
    if (props.position.includes('top') || props.position.includes('bottom')) return 'n-resize';
    return 'e-resize';
  }};
  pointer-events: auto;
  
  ${props => {
    const { position } = props;
    if (position === 'top-left') return 'top: 0; left: 0;';
    if (position === 'top-center') return 'top: 0; left: 50%; transform: translateX(-50%);';
    if (position === 'top-right') return 'top: 0; right: 0;';
    if (position === 'bottom-left') return 'bottom: 0; left: 0;';
    if (position === 'bottom-center') return 'bottom: 0; left: 50%; transform: translateX(-50%);';
    if (position === 'bottom-right') return 'bottom: 0; right: 0;';
    return '';
  }}
`;

// Container border for active state
const ContainerBorder = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid #979593;
  border-radius: 8px;
  pointer-events: none;
  display: ${props => props.$show ? 'block' : 'none'};
`;

// Menu backdrop to capture clicks outside the menu
const MenuBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  background-color: transparent;
`;

// We've moved the portal functionality directly into the renderImageMenu function

// Create a styled dropdown menu for the insert picture button
const InsertPictureMenu = styled.div<{ $show: boolean }>`
  background: white;
  border-radius: 4px;
  min-width: 160px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

// Create an overlay to block all mouse events when a menu is open
const EventBlockingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 850; // Above container and insert button, below menu
  cursor: default;
  background: transparent;
  touch-action: none; // Disable touch actions too
`;

const InsertPictureMenuItem = styled.div`
  padding: 10px 16px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  color: #242424;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

// Create a styled overlay for the loading state
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 15;
  
  & > div {
    margin-top: 10px;
    font-size: 14px;
  }
`;

// Create a pulsing animation for the loading indicator
const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// List SmartArt Component
const ListSmartArt: React.FC<SmartArtProps> = ({ nodes: initialNodes }) => {
  const [nodes, setNodes] = useState(initialNodes);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [pressedNode, setPressedNode] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<number | null>(null);
  const [editingBody, setEditingBody] = useState<number | null>(null);
  const [containerActive, setContainerActive] = useState(false);
  const [containerHovered, setContainerHovered] = useState(false);
  const [insertPictureMenuOpen, setInsertPictureMenuOpen] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatingImageForNode, setGeneratingImageForNode] = useState<number | null>(null);

  // Auto-resize textarea function with minimal expansion
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const lineHeight = 20; // Approximate line height (14px font * 1.429 line-height)
    const contentHeight = textarea.scrollHeight;
    const minHeight = contentHeight + lineHeight; // Add space for one more line
    textarea.style.height = `${minHeight}px`;
  };

  // Auto-focus the input when entering edit mode
  useEffect(() => {
    if (editingTitle !== null && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingBody !== null && bodyInputRef.current) {
      bodyInputRef.current.focus();
      bodyInputRef.current.select();
      // Auto-resize on focus
      autoResizeTextarea(bodyInputRef.current);
    }
  }, [editingBody]);

  // Handle clicking outside the component to exit pressed state
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // If a menu is open, handle its dismissal
      if (insertPictureMenuOpen !== null) {
        const isClickOnButton = target.closest('[data-insert-button]') !== null;
        const isClickOnMenu = menuRef.current && menuRef.current.contains(target);
        
        if (!isClickOnButton && !isClickOnMenu) {
          setInsertPictureMenuOpen(null);
          setButtonRect(null);
        }
        
        // Don't process any other interactions while menu is open
        return;
      }
      
      // Normal click outside handling when no menu is open
      if (containerRef.current && !containerRef.current.contains(target)) {
        setPressedNode(null);
        setEditingTitle(null);
        setEditingBody(null);
        setContainerActive(false);
        setHoveredNode(null);
      }
    };

    // Add listeners
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pressedNode, containerActive, insertPictureMenuOpen]);

  const handleContainerClick = (event: React.MouseEvent) => {
    // Only activate container if clicking on empty space (not on nodes)
    if (event.target === event.currentTarget) {
      setContainerActive(true);
      // Clear node active states when activating container
      setPressedNode(null);
      setEditingTitle(null);
      setEditingBody(null);
    }
  };

  const handleAddClick = (position: number) => {
    // Generate a new unique ID
    const newId = nodes.length > 0 ? Math.max(...nodes.map(n => n.id)) + 1 : 1;
    
    // Create a new node with default values
    const newNode: Node = {
      id: newId,
      title: 'Heading 4',
      body: 'Description',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80' // Default nature image
    };
    
    // Insert the new node at the specified position
    const newNodes = [...nodes];
    newNodes.splice(position, 0, newNode);
    setNodes(newNodes);
    
    // Set the new node as active and enter title editing mode
    setPressedNode(newId);
    setEditingTitle(newId);
    setEditingBody(null);
    setContainerActive(false);
    
    // Use a timeout to ensure the DOM has updated before focusing
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 0);
  };

  const handleNodeClick = (nodeId: number) => {
    // Only set pressed state without entering edit mode
    setPressedNode(pressedNode === nodeId ? null : nodeId);
    // Clear container active state when clicking on a node
    setContainerActive(false);
  };

  const handleTitleClick = (nodeId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the node click
    setPressedNode(nodeId);
    setEditingTitle(nodeId);
    setEditingBody(null); // Clear body editing if active
    setContainerActive(false); // Clear container active state
  };

  const handleBodyClick = (nodeId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the node click
    setPressedNode(nodeId);
    setEditingBody(nodeId);
    setEditingTitle(null); // Clear title editing if active
    setContainerActive(false); // Clear container active state
  };

  const handleTitleChange = (nodeId: number, newTitle: string) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, title: newTitle } : node
      )
    );
  };

  const handleBodyChange = (nodeId: number, newBody: string) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, body: newBody } : node
      )
    );
    
    // Auto-resize textarea after content change
    if (bodyInputRef.current) {
      autoResizeTextarea(bodyInputRef.current);
    }
  };
  
  // Global variable to track if menu is open
  const isAnyMenuOpen = insertPictureMenuOpen !== null;
  
  const handleInsertPictureClick = (nodeId: number, event: React.MouseEvent) => {
    // Completely isolate this event
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    
    // Toggle the menu open/closed
    const isOpening = insertPictureMenuOpen !== nodeId;
    
    // Get the button element before the timeout
    const buttonElement = event.currentTarget as HTMLElement;
    
    // Store the rect safely before the timeout
    let rect: DOMRect | null = null;
    try {
      if (buttonElement && typeof buttonElement.getBoundingClientRect === 'function') {
        rect = buttonElement.getBoundingClientRect();
      }
    } catch (error) {
      console.error("Failed to get button position:", error);
    }
    
    // Create a fallback rect if needed
    if (!rect) {
      rect = new DOMRect(0, 0, 0, 0);
      
      // Try to get the component position as a fallback
      try {
        const containerElem = containerRef.current;
        if (containerElem) {
          const containerRect = containerElem.getBoundingClientRect();
          rect = new DOMRect(
            containerRect.left + 100,  // Approximate position
            containerRect.top + 100,   // Approximate position
            0, 
            0
          );
        }
      } catch (e) {
        console.error("Fallback positioning failed:", e);
      }
    }
    
    // Set these in a timeout to break the React event flow
    setTimeout(() => {
      if (isOpening) {
        // Set the stored position for menu positioning - rect should never be null now
        setButtonRect(rect);
        
        // Set this node as the active node
        setHoveredNode(nodeId);
        
        // Clear other interactive states
        setPressedNode(null);
        setEditingTitle(null);
        setEditingBody(null);
        setContainerActive(false);
        
        // Open the menu
        setInsertPictureMenuOpen(nodeId);
      } else if (!isOpening) {
        // Clear everything when closing
        setButtonRect(null);
        setInsertPictureMenuOpen(null);
      }
    }, 0);
  };
  
  const handlePictureSourceSelect = (nodeId: number, source: string, event: React.MouseEvent) => {
    // Stop propagation to completely isolate this event
    event.stopPropagation();
    event.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    
    // Store the nodeId for use with file input
    const targetNodeId = nodeId;
    
    // Find the current node to access its title
    const currentNode = nodes.find(node => node.id === nodeId);
    if (!currentNode) return;
    
    // Do this in a timeout to ensure it happens after all event handling
    setTimeout(async () => {
      // Close the menu
      setInsertPictureMenuOpen(null);
      setButtonRect(null);
      // Clear hover state too
      setHoveredNode(null);
      
      // Handle different source types
      switch (source) {
        case 'This Device':
          // Trigger the file browser for "This Device" option
          if (fileInputRef.current) {
            // Set up the onchange handler before clicking
            fileInputRef.current.onchange = () => handleFileSelection(targetNodeId);
            fileInputRef.current.click();
          }
          break;
          
        case 'Stock Images':
          // For demonstration purposes
          alert('Stock Images feature would open a library of stock images');
          break;
          
        case 'Generate with AI':
          try {
            // Set generating state to show loading indicator
            setGeneratingImageForNode(targetNodeId);
            
            // Get the title text from the card
            const title = currentNode.title;
            console.log(`Generating image for title: "${title}"`);
            
            // We don't need to set a placeholder image here
            // as the LoadingOverlay will show on top of the current image
            
            // Call the Freepik Mystic API with the title as prompt
            const generatedImageUrl = await generateImageForTitle(title);
            
            // Update the node with the generated image
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === targetNodeId ? { ...node, image: generatedImageUrl } : node
              )
            );
            
            console.log('Image generated successfully:', generatedImageUrl);
          } catch (error: unknown) {
            console.error('Error generating image:', error);
            
            // Show error message to user with proper type handling
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate image: ${errorMessage}. Please try again.`);
            
            // Revert to a fallback image from Unsplash
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === targetNodeId ? { 
                  ...node, 
                  image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=600&q=80' 
                } : node
              )
            );
          } finally {
            setGeneratingImageForNode(null); // Clear loading state
          }
          break;
          
        default:
          console.log(`Unhandled source: ${source}`);
      }
    }, 0);
  };

  const handleFileSelection = (nodeId: number) => {
    // Find the node to update
    const nodeToUpdate = nodes.find(node => node.id === nodeId);
    if (!nodeToUpdate) return;

    // Make sure we have a file input ref
    if (!fileInputRef.current) return;
    
    // Get the selected file
    const file = fileInputRef.current.files?.[0];
    if (!file) return;
    
    // Only accept image files
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }
    
    // Create a URL for the selected image file
    const imageUrl = URL.createObjectURL(file);
    
    // Update the node with the new image
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId ? { ...node, image: imageUrl } : node
      )
    );
    
    // Reset the file input for future selections
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMoveLeft = (nodeId: number, event: React.MouseEvent) => {
    // Stop event propagation to prevent triggering other click handlers
    event.stopPropagation();
    
    const currentIndex = nodes.findIndex(node => node.id === nodeId);
    if (currentIndex > 0) {
      // Swap with previous node
      const newNodes = [...nodes];
      [newNodes[currentIndex], newNodes[currentIndex - 1]] = [newNodes[currentIndex - 1], newNodes[currentIndex]];
      setNodes(newNodes);
      
      // Ensure this node stays active after the swap and container isn't active
      setPressedNode(nodeId);
      setContainerActive(false);
      
      // Clear any editing state
      setEditingTitle(null);
      setEditingBody(null);
    }
  };

  const handleMoveRight = (nodeId: number, event: React.MouseEvent) => {
    // Stop event propagation to prevent triggering other click handlers
    event.stopPropagation();
    
    const currentIndex = nodes.findIndex(node => node.id === nodeId);
    if (currentIndex < nodes.length - 1) {
      // Swap with next node
      const newNodes = [...nodes];
      [newNodes[currentIndex], newNodes[currentIndex + 1]] = [newNodes[currentIndex + 1], newNodes[currentIndex]];
      setNodes(newNodes);
      
      // Ensure this node stays active after the swap and container isn't active
      setPressedNode(nodeId);
      setContainerActive(false);
      
      // Clear any editing state
      setEditingTitle(null);
      setEditingBody(null);
    }
  };
  
  const handleDeleteNode = (nodeId: number, event: React.MouseEvent) => {
    // Stop event propagation to prevent triggering other click handlers
    event.stopPropagation();
    
    // Don't delete if this is the last node
    if (nodes.length <= 1) {
      return;
    }
    
    // Filter out the node with the given ID
    const newNodes = nodes.filter(node => node.id !== nodeId);
    setNodes(newNodes);
    
    // Clear active states since the node is being deleted
    setPressedNode(null);
    setEditingTitle(null);
    setEditingBody(null);
  };

  // Disable all mouse handlers when menu is open
  const mouseHandlersDisabled = insertPictureMenuOpen !== null;

  // Create conditional props for hover events
  const containerHoverProps = isAnyMenuOpen ? {} : {
    onMouseEnter: () => setContainerHovered(true),
    onMouseLeave: () => setContainerHovered(false)
  };
  
  // Create menu component outside of main JSX
  const renderImageMenu = () => {
    if (insertPictureMenuOpen === null) return null;
    
    // Default position if buttonRect is missing
    const menuLeft = buttonRect ? buttonRect.left : 0;
    const menuTop = buttonRect ? buttonRect.bottom + 5 : 0;
    
    return ReactDOM.createPortal(
      <>
        {/* Backdrop to handle clicks outside */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 900,
            cursor: 'default',
          }}
          onClick={() => {
            setInsertPictureMenuOpen(null);
            setButtonRect(null);
          }}
        />
        
        {/* Menu itself */}
        <div 
          ref={menuRef}
          style={{
            position: 'fixed',
            left: `${menuLeft}px`,
            top: `${menuTop}px`,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <InsertPictureMenu $show={true}>
            <InsertPictureMenuItem onClick={(e) => handlePictureSourceSelect(insertPictureMenuOpen, 'This Device', e)}>
              This Device
            </InsertPictureMenuItem>
            <InsertPictureMenuItem onClick={(e) => handlePictureSourceSelect(insertPictureMenuOpen, 'Stock Images', e)}>
              Stock Images
            </InsertPictureMenuItem>
            <InsertPictureMenuItem onClick={(e) => handlePictureSourceSelect(insertPictureMenuOpen, 'Generate with AI', e)}>
              Generate with AI
            </InsertPictureMenuItem>
          </InsertPictureMenu>
        </div>
      </>,
      document.body
    );
  };

  // Function to generate an image based on the title using Unsplash API
  const generateImageForTitle = async (title: string): Promise<string> => {
    // Unsplash API Access Key (not a Bearer token)
    const accessKey = 'Y0wlbVtEzDm_Y6YYWAPRNobo-fE4U_qUkOZKRAf5Fss';
    
    try {
      // Use the title as the search query, fallback to abstract if empty
      const query = title.trim() || 'abstract';
      
      console.log(`Searching Unsplash for images related to: "${query}"`);
      
      // Build the exact URL format as specified with client_id as a query parameter
      const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${accessKey}`;
      
      // Make the fetch request without any headers
      const response = await fetch(endpoint);
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Unsplash API error (${response.status}): ${response.statusText}`);
      }
      
      // Parse the response as JSON
      const data = await response.json();
      console.log('Unsplash API Response:', data);
      
      // Check if we got any results
      if (data && data.results && data.results.length > 0) {
        // Get the first result as specified in the example
        const imageUrl = data.results[0].urls.regular;
        console.log('Unsplash image URL:', imageUrl);
        return imageUrl;
      } else {
        // If no results found, use a fallback abstract image
        console.log('No results found, using fallback image');
        
        // Use a reliable fallback from Unsplash
        return 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=600&q=80';
      }
    } catch (error: unknown) {
      console.error('Unsplash API fetch error:', error);
      // Rethrow the error to be handled by the caller
      throw error;
    }
  };

  return (
    <>
      {/* Hidden file input for image uploading */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={() => {
          // The actual handling is set up in handlePictureSourceSelect
          // This is just a fallback in case the handler isn't properly set
          if (insertPictureMenuOpen !== null) {
            handleFileSelection(insertPictureMenuOpen);
          }
        }}
      />
      
      {/* Render menu outside component hierarchy */}
      {renderImageMenu()}
      
      <SmartArtContainer 
        ref={containerRef} 
        onClick={mouseHandlersDisabled ? undefined : handleContainerClick} 
        onMouseEnter={mouseHandlersDisabled ? undefined : () => setContainerHovered(true)} 
        onMouseLeave={mouseHandlersDisabled ? undefined : () => setContainerHovered(false)}
        $isActive={containerActive} 
        $nodeCount={nodes.length}
        $menuOpen={isAnyMenuOpen}
        style={{ userSelect: mouseHandlersDisabled ? 'none' : 'auto' }}
      >
      {/* Container-level floating toolbar */}
      <ContainerFloatingToolbar $show={containerActive}>
        <ToolbarButton title="Copilot GPTs">
          <ContainerToolbarIcon icon="copilot" />
        </ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton title="Color">
          <ContainerToolbarIcon icon="color" />
        </ToolbarButton>
        <ToolbarButton title="Text Panel">
          <ContainerToolbarIcon icon="text-panel" />
        </ToolbarButton>
        <ToolbarButton title="Leave Comment">
          <ContainerToolbarIcon icon="comment" />
        </ToolbarButton>
      </ContainerFloatingToolbar>

      {/* Container border and resize handles */}
      <ContainerBorder $show={containerActive} />
      <ResizeHandles $show={containerActive}>
        <ResizeHandle position="top-left" />
        <ResizeHandle position="top-center" />
        <ResizeHandle position="top-right" />
        <ResizeHandle position="bottom-left" />
        <ResizeHandle position="bottom-center" />
        <ResizeHandle position="bottom-right" />
      </ResizeHandles>

      <NodesRow>
        {nodes.map((node, index) => (
          <NodeContainer 
            key={node.id} 
            $isPressed={pressedNode === node.id}
            onClick={() => handleNodeClick(node.id)}
          >
            <div style={{ position: 'relative' }}>
              {/* Menu backdrop - captures clicks outside the menu */}
              {insertPictureMenuOpen === node.id && (
                <MenuBackdrop onClick={(e) => handleInsertPictureClick(node.id, e)} />
              )}
              
              <ImageContainer 
                $isHovered={hoveredNode === node.id || insertPictureMenuOpen === node.id}
                onMouseEnter={mouseHandlersDisabled ? undefined : () => setHoveredNode(node.id)}
                onMouseLeave={mouseHandlersDisabled ? undefined : () => setHoveredNode(null)}
              >
                <NodeImage 
                  src={node.image} 
                  alt={node.title}
                  onError={(e) => {
                    console.error('Failed to load image:', node.image);
                    
                    // Only show error if this node isn't currently generating an image
                    if (generatingImageForNode !== node.id) {
                      // Replace with a guaranteed-to-work fallback image from Unsplash
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=600&q=80';
                    }
                  }}
                />
                <InsertPictureOverlay 
                  $show={(hoveredNode === node.id && pressedNode !== node.id) || insertPictureMenuOpen === node.id}
                >
                  <div 
                    style={{ position: 'relative', zIndex: 900 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InsertButton 
                      data-insert-button="true"
                      id={`insert-button-${node.id}`} // Add an ID for easier reference
                      onClick={(e) => {
                        try {
                          handleInsertPictureClick(node.id, e);
                        } catch (err) {
                          console.error("Error handling insert button click:", err);
                          // Safe fallback
                          setInsertPictureMenuOpen(node.id);
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        if (insertPictureMenuOpen !== null) e.preventDefault();
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        if (insertPictureMenuOpen !== null) e.preventDefault();
                      }}
                    >
                      <InsertIcon />
                    </InsertButton>
                  </div>
                </InsertPictureOverlay>
                
                {/* Loading overlay - shown when generating image */}
                {generatingImageForNode === node.id && (
                  <LoadingOverlay>
                    <LoadingSpinner />
                    <div>Generating image...</div>
                  </LoadingOverlay>
                )}
              </ImageContainer>

            </div>
            
            <TextContainer $isPressed={pressedNode === node.id}>
              {editingTitle === node.id ? (
                <TitleInput 
                  ref={titleInputRef}
                  $isPressed={true}
                  value={node.title}
                  onChange={(e) => handleTitleChange(node.id, e.target.value)}
                  placeholder="Heading 4"
                />
              ) : (
                <Title 
                  $isPressed={pressedNode === node.id}
                  $isEditing={editingTitle === node.id}
                  onClick={(e) => handleTitleClick(node.id, e)}
                >
                  {node.title}
                </Title>
              )}
              
              {editingBody === node.id ? (
                <BodyInput 
                  ref={bodyInputRef}
                  $isPressed={true}
                  value={node.body}
                  onChange={(e) => handleBodyChange(node.id, e.target.value)}
                  onInput={(e) => autoResizeTextarea(e.target as HTMLTextAreaElement)}
                  placeholder="Description"
                  rows={3}
                />
              ) : (
                <Body 
                  $isPressed={pressedNode === node.id}
                  onClick={(e) => handleBodyClick(node.id, e)}
                >
                  {node.body}
                </Body>
              )}
            </TextContainer>
            
            {/* Floating toolbar for pressed state */}
            <FloatingToolbar $show={pressedNode === node.id}>
              <ToolbarButton title="Move Left" onClick={(e) => handleMoveLeft(node.id, e)}>
                <ToolbarIcon icon="arrow-left" />
              </ToolbarButton>
              <ToolbarButton title="Move Right" onClick={(e) => handleMoveRight(node.id, e)}>
                <ToolbarIcon icon="arrow-right" />
              </ToolbarButton>
              <ToolbarDivider />
              <ToolbarButton title="Delete" onClick={(e) => handleDeleteNode(node.id, e)}>
                <ToolbarIcon icon="delete" />
              </ToolbarButton>
            </FloatingToolbar>
          </NodeContainer>
        ))}
      </NodesRow>

      {/* Add buttons - positioned at beginning, between columns, and at end */}
      {/* Left edge "+" button - only show when container hovered and no node is pressed */}
      {containerHovered && pressedNode === null && (
        <AddButton 
          key="add-left-edge"
          onClick={() => handleAddClick(0)} 
          style={{ 
            left: "-12px",
            opacity: 1 // Force opacity to ensure visibility
          }}
          $containerActive={containerActive}
        >
          +
        </AddButton>
      )}

      {/* Between-column "+" buttons - only render when container hovered and no node is pressed */}
      {containerHovered && pressedNode === null && nodes.length > 1 && 
        Array.from({ length: nodes.length - 1 }, (_, idx) => {
          const nodeWidth = 200;
          const nodeGap = 24;
          const position = idx + 1;
          
          // Calculate exact position including container padding (20px)
          // Container padding + first node width + first node ending position + half the gap
          const containerPadding = 20;
          // Adding additional 6px left padding for fine-tuning as requested
          const leftPos = containerPadding + (position * nodeWidth) + ((position - 1) * nodeGap) + (nodeGap / 2) + 6;
          
          return (
            <AddButton 
              key={`add-between-${idx}`}
              onClick={() => handleAddClick(position)} 
              style={{ 
                left: `${leftPos}px`,
                opacity: 1 // Force opacity to ensure visibility
              }}
              $containerActive={containerActive}
            >
              +
            </AddButton>
          );
        })
      }
      
      {/* Right edge "+" button - only show when container hovered and no node is pressed */}
      {containerHovered && pressedNode === null && (
        <AddButton 
          key="add-right-edge"
          onClick={() => handleAddClick(nodes.length)} 
          style={{ 
            right: "-12px",
            left: "auto",
            opacity: 1 // Force opacity to ensure visibility
          }}
          $containerActive={containerActive}
        >
          +
        </AddButton>
      )}
    </SmartArtContainer>
    </>
  );
};

// Export the component with both names for flexibility
export { ListSmartArt };
export default ListSmartArt;
