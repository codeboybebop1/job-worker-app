import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApiCall, useMutation } from '../hooks/useApiCall'
import { fetchIssueFabric, upsertIssueFabric, deleteIssueFabric } from '../features/issueFabric/api'
import { fetchFabrics } from '../features/masters/api'
import { fetchJobWorkers } from '../features/masters/jobWorkersApi'
import { fetchOrders } from '../features/orders/api'
import { showToast } from '../components/ui/Toast'
import { fmtDate, fmtNum, todayStr } from '../lib/format'
import { FiPlus, FiTrash2, FiEdit2, FiSave } from 'react-icons/fi'
import { IssueChallanCard } from '../components/ChallanCards'

const F = 'w-full px-3 py-2 border border-border-strong rounded-md text-sm'

export default function IssueFabric() {
  const { data: entries, loading, error, refetch } = useApiCall(fetchIssueFabric)
  const { data: fabrics } = useApiCall(fetchFabrics)
  const { data: jobWorkers } = useApiCall(fetchJobWorkers)
  const { data: orders } = useApiCall(fetchOrders)
  const { mutate: save, loading: saving } = useMutation(upsertIssueFabric)
  const { mutate: remove } = useMutation(deleteIssueFabric)
  const [form, setForm] = useState(null)
  const location = useLocation()

  // Support edit routing from History: if navigated here with an entry in
  // location.state, pre-fill the form with that entry's data (matches the
  // HTML's "Editing Issue Entry - Challan #X" banner behavior).
  useEffect(() => {
    const editEntry = location.state?.editEntry
    if (editEntry) startEdit(editEntry)
  }, [location.state])

  function startNew() { setForm({ id: null, challanNo: '', date: todayStr(), jobWorkerId: '', orderId: '', fabricBlocks: [{ id: null, fabricId: '', lumps: [{ id: null, lumpNo: '1', metres: '' }] }] }) }
  function startEdit(e) { setForm({ id: e.id, challanNo: e.challan_no, date: e.date, jobWorkerId: e.job_worker_id, orderId: e.order_id || '', fabricBlocks: e.issue_fabric_blocks?.map((b) => ({ id: b.id, fabricId: b.fabric_id, lumps: b.issue_fabric_lumps?.map((l) => ({ id: l.id, lumpNo: l.lump_no, metres: l.metres })) || [{ id: null, lumpNo: '1', metres: '' }] })) || [{ id: null, fabricId: '', lumps: [{ id: null, lumpNo: '1', metres: '' }] }] }) }
  function addBlock() { setForm({ ...form, fabricBlocks: [...form.fabricBlocks, { id: null, fabricId: '', lumps: [{ id: null, lumpNo: '1', metres: '' }] }] }) }
  function rmBlock(i) { setForm({ ...form, fabricBlocks: form.fabricBlocks.filter((_, idx) => idx !== i) }) }
  function addLump(bi) { const fb = [...form.fabricBlocks]; fb[bi].lumps.push({ id: null, lumpNo: String(fb[bi].lumps.length + 1), metres: '' }); setForm({ ...form, fabricBlocks: fb }) }
  function rmLump(bi, li) { const fb = [...form.fabricBlocks]; fb[bi].lumps = fb[bi].lumps.filter((_, idx) => idx !== li); setForm({ ...form, fabricBlocks: fb }) }

  async function handleSave() {
    if (!form.challanNo.trim()) return showToast('Enter challan number')
    if (!form.jobWorkerId) return showToast('Select job worker')
    try { await save({ id: form.id, challanNo: form.challanNo, date: form.date, jobWorkerId: form.jobWorkerId, orderId: form.orderId, fabricBlocks: form.fabricBlocks }); showToast(form.id ? 'Updated' : 'Saved'); setForm(null); refetch() }
    catch (err) { showToast('Failed: ' + err.message) }
  }
  async function handleDelete(id) {
    if (!confirm('Delete?')) return
    try { await remove(id); showToast('Deleted'); refetch() }
    catch (err) { showToast('Failed: ' + err.message) }
  }
  if (loading) return <div className="text-text-soft p-8">Loading...</div>
  if (error) return <div className="text-red p-8">Error: {error}</div>

  return (
    <div>
      {form && (<div className="bg-panel border border-border rounded-lg p-4 mb-4">
        <h2 className="text-base font-bold mb-3">{form.id ? 'Edit Issue Entry' : 'New Issue Entry'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Challan No.</label><input className={F} value={form.challanNo} onChange={(e) => setForm({ ...form, challanNo: e.target.value })} /></div>
          <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Date</label><input type="date" className={F} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Job Worker</label><select className={F} value={form.jobWorkerId} onChange={(e) => setForm({ ...form, jobWorkerId: e.target.value })}><option value="">Select...</option>{jobWorkers?.map((jw) => <option key={jw.id} value={jw.id}>{jw.name}</option>)}</select></div>
          <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Order (optional)</label><select className={F} value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}><option value="">None</option>{orders?.map((o) => <option key={o.id} value={o.id}>{'Order ' + o.id.slice(0, 8) + ' (' + fmtDate(o.date_created) + ')'}</option>)}</select></div>
        </div>
        <div className="mb-4"><div className="flex justify-between items-center mb-2"><h3 className="font-bold">Fabric Blocks</h3><button className="btn btn-sm flex items-center gap-1" onClick={addBlock}><FiPlus size={14} /> Add Block</button></div>
          {form.fabricBlocks.map((block, bIdx) => (
            <div key={bIdx} className="section-block">
              <button className="absolute top-2 right-2 text-text-faint hover:text-red" onClick={() => rmBlock(bIdx)}><FiTrash2 size={14} /></button>
              <div className="mb-3"><select className={F} value={block.fabricId} onChange={(e) => { const fb = [...form.fabricBlocks]; fb[bIdx].fabricId = e.target.value; setForm({ ...form, fabricBlocks: fb }) }}><option value="">Select fabric...</option>{fabrics?.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
              <div className="space-y-2">{block.lumps.map((lump, lIdx) => (
                <div key={lIdx} className="flex gap-2 items-center"><span className="text-xs text-text-soft w-12">Lump {lIdx + 1}</span><input type="number" step="0.01" className="flex-1 px-2 py-1.5 border border-border-strong rounded text-sm" value={lump.metres} onChange={(e) => { const fb = [...form.fabricBlocks]; fb[bIdx].lumps[lIdx].metres = e.target.value; setForm({ ...form, fabricBlocks: fb }) }} placeholder="Metres" /><button className="text-text-faint hover:text-red" onClick={() => rmLump(bIdx, lIdx)}><FiTrash2 size={14} /></button></div>
              ))}<button className="text-xs text-accent hover:underline" onClick={() => addLump(bIdx)}>+ Add lump</button></div>
            </div>
          ))}
        </div>
        <div className="flex gap-2"><button className="btn btn-primary flex items-center gap-1.5" onClick={handleSave} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save'}</button><button className="btn" onClick={() => setForm(null)}>Cancel</button></div>
      </div>)}
      <div className="bg-panel border border-border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3"><h2 className="text-base font-bold">Issue Entries ({entries?.length || 0})</h2>{!form && <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber text-white shadow-sm hover:bg-amber-600 transition-colors" onClick={startNew}><FiPlus size={16} /> New Entry</button>}</div>
        {!entries?.length ? (<div className="empty-state"><div className="msg">No issue entries yet.</div></div>) : (<div className="space-y-3">{entries.map((e) => <IssueChallanCard key={e.id} e={e} jobWorkers={jobWorkers} fabrics={fabrics} onEdit={startEdit} onDelete={(ent) => handleDelete(ent.id)} />)}</div>)}
      </div>
    </div>
  )
}
