import React from 'react';
import { AssetData } from '../types';

interface DataTableProps {
  data: AssetData[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (data.length === 0) return null;

  const headers = Object.keys(data[0]) as (keyof AssetData)[];

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold text-xs whitespace-nowrap w-12 bg-slate-50">#</th>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-4 py-3 font-semibold text-xs whitespace-nowrap min-w-[150px]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{index + 1}</td>
                {headers.map((header) => (
                  <td key={`${index}-${header}`} className="px-4 py-3 whitespace-nowrap">
                    <div className="truncate max-w-[250px]" title={row[header]}>
                       {row[header] || <span className="text-slate-300 italic">--</span>}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500">
        Showing {data.length} records
      </div>
    </div>
  );
};
