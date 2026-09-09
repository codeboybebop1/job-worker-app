import { showToast } from '../ui/Toast'
import { FiSave, FiPlus } from 'react-icons/fi'
import ItemRow from './ItemRow'

const F = 'w-full px-3 py-2 border border-border-strong rounded-md text-sm'

export default function ReceiveMaterialForm({ form, setForm, jobWorkers, itemTypes, parties, fabrics, onSave, onCancel }) {
  function addItem() { setForm({ ...form, items: [...form.items, { id: null, itemTypeId: '', partyId: '', groupId: '', partFabric: {}, sizeWise: {} }] }) }
  function rmItem(i) { setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) }) }
  const getGroups = (jwId, itId) => { if (!jwId || !jobWorkers) return []; const jw = jobWorkers.find((j) => j.id === jwId); return jw?.groups?.filter((g) => !itId || g.item_type_id === itId) || [] }
  const getSizes = (jwId, grpId) => { if (!jwId || !grpId) return []; const jw = jobWorkers.find((j) => j.id === jwId); return jw?.groups?.find((g) => g.id === grpId)?.group_sizes || [] }
  const getParts = (jwId, grpId) => { if (!jwId || !grpId) return []; const jw = jobWorkers.find((j) => j.id === jwId); return jw?.groups?.find((g) => g.id === grpId)?.group_parts || [] }

  async function handleSave() {
    if (!form.challanNo.trim()) return showToast('Enter challan number')
    if (!form.jobWorkerId) return showToast('Select job worker')
    for (const it of form.items) {
      if (!it.itemTypeId || !it.partyId || !it.groupId) return showToast('Fill all fields in every row')
      if (Object.values(it.sizeWise).reduce((s, v) => s + (Number(v) || 0), 0) <= 0) return showToast('Enter pieces for at least one size')
    }
    try { await onSave({ id: form.id, challanNo: form.challanNo, date: form.date, jobWorkerId: form.jobWorkerId, orderId: form.orderId, items: form.items }) }
    catch (err) { showToast('Failed: ' + err.message) }
  }

  return (
    <div className="bg-panel border border-border rounded-lg p-4 mb-4">
      <h2 className="text-base font-bold mb-3">{form.id ? 'Edit' : 'New'} Receive Entry</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Challan No.</label><input className={F} value={form.challanNo} onChange={(e) => setForm({ ...form, challanNo: e.target.value })} /></div>
        <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Date</label><input type="date" className={F} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Job Worker</label><select className={F} value={form.jobWorkerId} onChange={(e) => setForm({ ...form, jobWorkerId: e.target.value })}><option value="">Select...</option>{jobWorkers?.map((jw) => <option key={jw.id} value={jw.id}>{jw.name}</option>)}</select></div>
        <div><label className="block text-[11px] font-bold text-text-soft mb-1 uppercase">Order</label><select className={F} value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}><option value="">None</option></select></div>
      </div>
      <div className="mb-4"><div className="flex justify-between items-center mb-2"><h3 className="font-bold">Items</h3><button className="btn btn-sm flex items-center gap-1" onClick={addItem}><FiPlus size={14} /> Add Row</button></div>
        {form.items.map((item, iIdx) => (
          <ItemRow key={iIdx} item={item} iIdx={iIdx} form={form} setForm={setForm} itemTypes={itemTypes} parties={parties} fabrics={fabrics} getGroups={getGroups} getSizes={getSizes} getParts={getParts} rmItem={rmItem} />
        ))}
      </div>
      <div className="flex gap-2"><button className="btn btn-primary flex items-center gap-1.5" onClick={handleSave}><FiSave size={14} /> Save</button><button className="btn" onClick={onCancel}>Cancel</button></div>
    </div>
  )
}