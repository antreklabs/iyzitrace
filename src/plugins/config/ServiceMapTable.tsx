import React, { useEffect, useMemo, useState } from 'react';
import { Button, Field, Input } from '@grafana/ui';
import type { ServiceMapItem } from '../../interfaces/options';

type Props = {
  value: ServiceMapItem[];
  onChange: (next: ServiceMapItem[]) => void;
};

const emptyRow = (): ServiceMapItem => ({
  id: '',
  name: '',
  layer: '',
  position: '',
  groupPosition: '',
  groupSize: 1,
  imageUrl: '',
});

export const ServiceMapTable: React.FC<Props> = ({ value, onChange }) => {
  const [rows, setRows] = useState<ServiceMapItem[]>(value ?? []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const current = useMemo(() => {
    if (editingIndex == null) return emptyRow();
    const picked = rows[editingIndex];
    return picked ? picked : emptyRow();
  }, [editingIndex, rows]);

  const setField = (k: keyof ServiceMapItem, v: string) => {
    if (editingIndex == null) {
      const draft = { ...current, [k]: k === 'groupSize' ? Number(v) : v } as ServiceMapItem;
      const next = [...rows, draft];
      setRows(next);
      onChange(next);
      setEditingIndex(rows.length);
    } else {
      const copy = rows.slice();
      (copy[editingIndex] as any)[k] = k === 'groupSize' ? Number(v) : v;
      setRows(copy);
      onChange(copy);
    }
  };

  const add = () => {
    const next = [...rows, emptyRow()];
    setRows(next);
    onChange(next);
    setEditingIndex(rows.length);
  };

  const save = () => {
    onChange(rows);
    setEditingIndex(null);
  };

  const remove = (idx: number) => {
    const copy = rows.slice();
    copy.splice(idx, 1);
    setRows(copy);
    onChange(copy);
    if (editingIndex === idx) setEditingIndex(null);
    else if (editingIndex != null && editingIndex > idx) setEditingIndex(editingIndex - 1);
  };

  // keep local rows in sync if parent jsonData.serviceMap changes externally
  useEffect(() => {
    setRows(value ?? []);
  }, [value]);

  const canSaveRow = current.id.trim().length > 0 && current.name.trim().length > 0 && current.layer.trim().length > 0;

  return (
    <div>
      <div className="gf-form-group">
        <h4>Edit Selected Row</h4>
        <div className="gf-form" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Field label="id"><Input width={20} value={current.id} onChange={(e) => setField('id', e.currentTarget.value)} /></Field>
          <Field label="name"><Input width={20} value={current.name} onChange={(e) => setField('name', e.currentTarget.value)} /></Field>
          <Field label="layer"><Input width={20} value={current.layer} onChange={(e) => setField('layer', e.currentTarget.value)} /></Field>
          <Field label="position"><Input width={20} value={current.position} onChange={(e) => setField('position', e.currentTarget.value)} /></Field>
          <Field label="groupPosition"><Input width={20} value={current.groupPosition} onChange={(e) => setField('groupPosition', e.currentTarget.value)} /></Field>
          <Field label="groupSize"><Input width={20} type="number" value={current.groupSize} onChange={(e) => setField('groupSize', e.currentTarget.value)} /></Field>
          <Field label="imageUrl"><Input width={20} value={current.imageUrl} onChange={(e) => setField('imageUrl', e.currentTarget.value)} /></Field>
        </div>
        <div className="gf-form"><Button disabled={!canSaveRow} onClick={save}>Save Row</Button></div>
      </div>
      <table className="filter-table">
        <thead>
          <tr>
            <th>id</th><th>name</th><th>layer</th><th>position</th>
            <th>groupPosition</th><th>groupSize</th><th>imageUrl</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} onClick={() => setEditingIndex(i)} style={{ cursor: 'pointer' }}>
              <td>{r.id}</td><td>{r.name}</td><td>{r.layer}</td><td>{r.position}</td>
              <td>{r.groupPosition}</td><td>{r.groupSize}</td><td>{r.imageUrl}</td>
              <td><Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); remove(i); }}>Delete</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="gf-form-group">
        <div className="gf-form">
          <Button onClick={add} variant="secondary">+ Add Row</Button>
          <Button className="ml-2" onClick={save}>Save Table</Button>
        </div>
      </div>
    </div>
  );
};


