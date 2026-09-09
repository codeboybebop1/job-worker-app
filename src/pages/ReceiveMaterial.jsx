import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApiCall, useMutation } from '../hooks/useApiCall'
import { fetchReceiveMaterial, upsertReceiveMaterial, deleteReceiveMaterial } from '../features/receiveMaterial/api'
import { fetchJobWorkers } from '../features/masters/jobWorkersApi'
import { fetchItemTypes, fetchParties, fetchFabrics } from '../features/masters/api'
import { showToast } from '../components/ui/Toast'
import { fmtDate, fmtNum, todayStr } from '../lib/format'
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'
import ReceiveMaterialForm from '../components/receiveMaterial/ReceiveMaterialForm'
import { ReceiveChallanCard } from '../components/ChallanCards'

export default function ReceiveMaterial() {
  const { data: entries, loading, error, refetch } = useApiCall(fetchReceiveMaterial)
  const { data: jobWorkers } = useApiCall(fetchJobWorkers)
  const { data: itemTypes } = useApiCall(fetchItemTypes)
  const { data: parties } = useApiCall(fetchParties)
  const { data: fabrics } = useApiCall(fetchFabrics)
  const { mutate: save } = useMutation(upsertReceiveMaterial)
  const { mutate: remove } = useMutation(deleteReceiveMaterial)
  const [form, setForm] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const editEntry = location.state?.editEntry
    if (editEntry) startEdit(editEntry)
  }, [location.state])

  function startNew() { setForm({ id: null, challanNo: '', date: todayStr(), jobWorkerId: '', orderId: '', items: [{ id: null, itemTypeId: '', partyId: '', groupId: '', partFabric: {}, sizeWise: {} }] }) }
  function startEdit(e) { setForm({ id: e.id, challanNo: e.challan_no, date: e.date, jobWorkerId: e.job_worker_id, orderId: e.order_id || '', items: e.receive_items?.map((it) => ({ id: it.id, itemTypeId: it.item_type_id, partyId: it.party_id, groupId: it.group_id, partFabric: Object.fromEntries((it.receive_item_part_fabric || []).map((pf) => [pf.part_id, pf.fabric_id])), sizeWise: Object.fromEntries((it.receive_item_sizes || []).map((s) => [s.size_id, s.pieces])) })) || [{ id: null, itemTypeId: '', partyId: '', groupId: '', partFabric: {}, sizeWise: {} }] }) }

  async function handleSave(payload) {
    try { await save(payload); showToast(form.id ? 'Updated' : 'Saved'); setForm(null); refetch() } catch (err) { showToast('Failed: ' + err.message) }
  }
  async function handleDelete(id) { if (!confirm('Delete?')) return; try { await remove(id); showToast('Deleted'); refetch() } catch (err) { showToast('Failed: ' + err.message) } }
  if (loading) return <div className="text-text-soft p-8">Loading...</div>
  if (error) return <div className="text-red p-8">Error: {error}</div>

  return (
    <div>
      {form && <ReceiveMaterialForm form={form} setForm={setForm} jobWorkers={jobWorkers} itemTypes={itemTypes} parties={parties} fabrics={fabrics} onSave={handleSave} onCancel={() => setForm(null)} />}
      <div className="bg-panel border border-border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3"><h2 className="text-base font-bold">Receive Entries ({entries?.length || 0})</h2>{!form && <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber text-white shadow-sm hover:bg-amber-600 transition-colors" onClick={startNew}><FiPlus size={16} /> New Entry</button>}</div>
        {!entries?.length ? (<div className="empty-state"><div className="msg">No receive entries yet.</div></div>) : (<div className="space-y-3">{entries.map((e) => <ReceiveChallanCard key={e.id} e={e} jobWorkers={jobWorkers} itemTypes={itemTypes} parties={parties} fabrics={fabrics} onEdit={startEdit} onDelete={(ent) => handleDelete(ent.id)} />)}</div>)}
      </div>
    </div>
  )
}
