import React from 'react';
import type { Connector, CanvasObject } from '../types';

interface ConnectorLineProps {
  connector: Connector;
  objects: CanvasObject[];
}

export const connectorMidpoint = (connector: Connector, objects: CanvasObject[]) => {
  const fromObj = objects.find(o => o.id === connector.fromId);
  const toObj = objects.find(o => o.id === connector.toId);
  if (!fromObj || !toObj) return null;
  return {
    x: (fromObj.x + fromObj.width / 2 + toObj.x + toObj.width / 2) / 2,
    y: (fromObj.y + fromObj.height / 2 + toObj.y + toObj.height / 2) / 2,
  };
};

const ConnectorLine: React.FC<ConnectorLineProps> = ({ connector, objects }) => {
  const fromObj = objects.find(o => o.id === connector.fromId);
  const toObj = objects.find(o => o.id === connector.toId);
  if (!fromObj || !toObj) return null;

  return (
    <line
      x1={fromObj.x + fromObj.width / 2}
      y1={fromObj.y + fromObj.height / 2}
      x2={toObj.x + toObj.width / 2}
      y2={toObj.y + toObj.height / 2}
      stroke="#6D5BD0"
      strokeWidth={3}
      strokeLinecap="round"
    />
  );
};

export default ConnectorLine;
