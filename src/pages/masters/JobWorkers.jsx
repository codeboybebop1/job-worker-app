import { useState } from 'react'
import { useApiCall, useMutation } from '../../hooks/useApiCall'
import { fetchJobWorkers, upsertJobWorker, deleteJobWorker } from '../../features/masters/jobWorkersApi'
import { fetchItemTypes } from '../../features/masters/api'
import { showToast } from '../../components/ui/Toast'
import { FiPlus, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import GroupEditor from '../../components/jobWorkers/GroupEditor'

export default function JobWorkers() {
  const { data: workers, loading, error, refetch } = useApiCall(fetchJobWorkers)
  const { data: itemTypes } = useApiCall(fetchItemTypes)
  const { mutate: save, loading: saving } = useMutation(upsertJobWorker)
  const { mutate: remove } = useMutation(deleteJobWorker)
  const [expanded, setExpanded] = useState({})
  const [editing, setEditing] = useState(null)

  function toggle(id) { setExpanded({ ...expanded, [id]: !expanded[id] }) }
  function startNew() { setEditing({ id: null, name: '', phone: '', groups: [] }) }
  function startEdit(jw) { setEditing({ id: jw.id, name: jw.name, phone: jw.phone || '', groups: (jw.groups || []).map((g) => ({ id: g.id, itemTypeId: g.item_type_id, groupName: g.group_name, pieceRate: g.piece_rate, sizes: (g.group_sizes || []).map((s) => ({ id: s.id, name: s.name })), parts: (g.group_parts || []).map((p) => ({ id: p.id, partName: p.part_name, bom: Object.fromEntries((p.group_part_bom || []).map((b) => [b.size_id, b.cm_per_piece])) })) })) }) }
  function addGroup() { setEditing({ ...editing, groups: [...editing.groups, { id: null, itemTypeId: '', groupName: '', pieceRate: '', sizes: [], parts: [] }] }) }
  function addSize(gi) { const g = [...editing.groups]; g[gi].sizes.push({ id: null, name: '' }); setEditing({ ...editing, groups: g }) }
  function addPart(gi) { const g = [...editing.groups]; g[gi].parts.push({ id: null, partName: '', bom: {} }); setEditing({ ...editing, groups: g }) }
  async function handleSave() { if (!editing.name.trim()) return showToast('Enter name'); try { await save({ id: editing.id, name: editing.name, phone: editing.phone, groups: editing.groups }); showToast(editing.id ? 'Updated' : 'Created'); setEditing(null); refetch() } catch (err) { showToast('Failed: ' + err.message) } }
  async function handleDelete(id, name) { if (!confirm('Delete "' + name + '"?')) return; try { await remove(id); showToast('Deleted'); refetch() } catch (err) { showToast('Failed: ' + err.message) } }
  if (loading) return <div className="text-text-soft p-8">Loading...</div>
  if (error) return <div className="text-red p-8">Error: {error}</div>

  return (
    <div>
      {editing && (<div className="bg-panel border border-border rounded-lg p-4 mb-4">
        <h2 className="text-base font-bold mb-3">{editing.id ? 'Edit' : 'Add'} Job Worker</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Name</label><input className="w-full px-3 py-2 border border-border-strong rounded-md text-sm" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
          <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Phone</label><input className="w-full px-3 py-2 border border-border-strong rounded-md text-sm" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
        </div>
        <div className="mb-4"><div className="flex justify-between items-center mb-2"><h3 className="font-bold">Groups</h3><button className="btn btn-sm flex items-center gap-1" onClick={addGroup}><FiPlus size={14} /> Add Group</button></div>
          {editing.groups.map((group, gi) => (<GroupEditor key={gi} group={group} gi={gi} editing={editing} setEditing={setEditing} itemTypes={itemTypes} addSize={addSize} addPart={addPart} />))}
        </div>
        <div className="flex gap-2"><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button><button className="btn" onClick={() => setEditing(null)}>Cancel</button></div>
      </div>)}
      <div className="bg-panel border border-border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3"><h2 className="text-base font-bold">Job Workers ({workers?.length || 0})</h2>{!editing && <button className="btn btn-primary flex items-center gap-1.5" onClick={startNew}><FiPlus size={14} /> Add</button>}</div>
        {!workers?.length ? (<div className="empty-state"><div className="msg">No job workers yet.</div></div>) : (<div className="space-y-2">{workers.map((jw) => (<div key={jw.id} className="border border-border rounded-lg"><div className="flex justify-between items-center p-3 cursor-pointer" onClick={() => toggle(jw.id)}><div className="flex items-center gap-2">{expanded[jw.id] ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}<b>{jw.name}</b> <span className="text-xs text-text-soft">({jw.groups?.length || 0} groups)</span></div><div><button className="text-text-soft hover:text-accent p-1.5" onClick={(e) => { e.stopPropagation(); startEdit(jw) }}>Edit</button><button className="text-text-soft hover:text-red p-1.5" onClick={(e) => { e.stopPropagation(); handleDelete(jw.id, jw.name) }}>Delete</button></div></div>{expanded[jw.id] && (<div className="px-3 pb-3 border-t border-border pt-2">{jw.groups?.map((g) => (<div key={g.id} className="mb-1 text-sm"><b>{g.group_name}</b> &middot; ₹{g.piece_rate}/pc</div>))}</div>)}</div>))}</div>)}
      </div>
    </div>
  )
}
