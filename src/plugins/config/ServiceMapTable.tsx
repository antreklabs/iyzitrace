import React, { useEffect, useState } from 'react';
import { Input } from '@grafana/ui';
import type { ServiceMapItem } from '../../interfaces/options';

type Props = {
  value: ServiceMapItem[];
  onChange: (next: ServiceMapItem[]) => void;
};

export const ServiceMapTable: React.FC<Props> = ({ value, onChange }) => {
  const [rows, setRows] = useState<ServiceMapItem[]>(value ?? []);
  
  // keep local rows in sync if parent jsonData.serviceMap changes externally
  useEffect(() => {
    setRows(value ?? []);
  }, [value]);

  return (
    <div>
      <table className="filter-table">
        <thead>
          <tr>
            <th hidden>id</th>
            <th>layer</th>
            <th>name</th>
            <th hidden>position</th>
            <th hidden>groupPosition</th>
            <th hidden>groupSize</th>
            <th>imageUrl</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td hidden>{r.id}</td>
              <td>{r.layer}</td>
              <td>{r.name}</td>
              <td hidden>{r.position}</td>
              <td hidden>{r.groupPosition}</td>
              <td hidden>{r.groupSize}</td>
              <td>
                <Input style={{ width: '100%' }}
                  value={r.imageUrl ?? ''}
                  onChange={(e) => {
                    const copy = rows.slice();
                    (copy[i] as any).imageUrl = e.currentTarget.value;
                    setRows(copy);
                    onChange(copy);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


