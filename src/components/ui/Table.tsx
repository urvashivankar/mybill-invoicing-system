// src/components/ui/Table.tsx
import React from 'react';

interface TableProps {
  columns: { header: string; accessor: string; align?: 'left' | 'center' | 'right'; width?: string }[];
  data: any[]; // array of row objects
  renderRow?: (row: any, index: number) => React.ReactNode; // optional custom row renderer
  className?: string;
}

export const Table: React.FC<TableProps> = ({ columns, data, renderRow, className = '' }) => {
  return (
    <div className={`table-responsive ${className}`}> 
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {columns.map(col => (
              <th
                key={col.accessor}
                style={{ textAlign: col.align || 'left', width: col.width }}
                className="px-4 py-2 text-xs font-medium text-gray-600 uppercase"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <React.Fragment key={idx}>
              {renderRow ? (
                renderRow(row, idx)
              ) : (
                <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columns.map(col => (
                    <td
                      key={col.accessor}
                      style={{ textAlign: col.align || 'left' }}
                      className="px-4 py-2 text-sm text-gray-700"
                    >
                      {row[col.accessor]}
                    </td>
                  ))}
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
