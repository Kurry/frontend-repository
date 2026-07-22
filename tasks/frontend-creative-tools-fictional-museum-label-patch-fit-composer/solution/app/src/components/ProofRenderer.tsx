import React from 'react';
import { FORMATS, Token } from '../store/data';
import { computeLayout } from '../utils/metrics';

interface ProofRendererProps {
  formatId: string;
  tokens: Token[];
  rendererType: 'svg' | 'canvas';
  zoom: number;
  brushedLine?: number | null;
}

export const ProofRenderer: React.FC<ProofRendererProps> = ({ formatId, tokens, rendererType, zoom, brushedLine }) => {
  const format = FORMATS[formatId];
  if (!format) return <div>Unknown format {formatId}</div>;

  const lines = computeLayout(tokens, formatId);
  const scale = zoom / 100;

  const renderSVG = () => {
    return (
      <svg
        width={format.box.width * scale}
        height={format.box.height * scale}
        viewBox={`0 0 ${format.box.width} ${format.box.height}`}
        className="bg-white shadow-md border border-gray-300"
      >
        <g transform={`translate(${format.padding}, ${format.padding})`}>
          {lines.map((line, idx) => (
            <text
              key={idx}
              y={(idx + 1) * format.font.lineHeight}
              fontSize={format.font.size}
              fontFamily="sans-serif"
              fill={brushedLine === line.lineNumber ? 'blue' : 'black'}
              fontWeight={brushedLine === line.lineNumber ? 'bold' : 'normal'}
            >
              {line.tokens.map(t => t.value).join('')}
            </text>
          ))}
        </g>
      </svg>
    );
  };

  const renderCanvas = () => {
    return (
      <div
        style={{
          width: format.box.width * scale,
          height: format.box.height * scale,
          padding: format.padding * scale,
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #d1d5db',
          fontSize: format.font.size * scale,
          lineHeight: `${format.font.lineHeight * scale}px`,
          fontFamily: 'sans-serif'
        }}
      >
        {lines.map((line, idx) => (
          <div key={idx} style={{ color: brushedLine === line.lineNumber ? 'blue' : 'black', fontWeight: brushedLine === line.lineNumber ? 'bold' : 'normal', whiteSpace: 'pre' }}>
            {line.tokens.map(t => t.value).join('')}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="absolute -top-6 left-0 text-xs font-semibold text-gray-500">
        {format.name} ({lines.length}/{format.maxLines} lines)
      </div>
      {rendererType === 'svg' ? renderSVG() : renderCanvas()}
    </div>
  );
};
