import React from 'react';
import ResourceIcon from './ResourceIcon';

interface PatternVisualizerProps {
  pattern: (string[] | null)[][];
  size?: number;
}

export default function PatternVisualizer({ pattern, size = 48 }: PatternVisualizerProps) {
  const cellSize = size / 3;

  return (
    <div
      className="inline-grid grid-cols-3 gap-[1px] bg-gray-600 rounded"
      style={{ width: size, height: size }}
    >
      {pattern.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="bg-gray-800 flex flex-wrap items-center justify-center p-[1px]"
            style={{ width: cellSize - 1, height: cellSize - 1 }}
          >
            {cell && cell.length > 0 && (
              <div className="flex flex-wrap gap-[1px] items-center justify-center">
                {cell.map((resource, idx) => (
                  <div key={idx}>
                    <ResourceIcon
                      resourceType={resource}
                      size={cell.length === 1 ? cellSize * 0.7 : cellSize * 0.4}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
