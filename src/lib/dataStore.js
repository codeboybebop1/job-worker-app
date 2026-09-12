/**
 * Central Data Store
 * ==================
 * Single source of in-memory data for the entire app.
 *
 * RULES:
 *   1. ALL data is loaded once on app startup (see DataProvider).
 *   2. Pages READ from the store — no per-page loading spinners.
 *   3. ALL writes go: DB first → update store ONLY on success.
 *      This makes every operation atomic: either both DB and store
 *      change, or neither does. The DB is always the source of truth.
 *   4. On any write, the store re-fetches the affected record(s) from
 *      the DB and updates itself, so the UI always shows confirmed data.
 */

import { supabase } from './supabaseClient'

// ─── Initial state ──────────────────────────────────────────────
const initialState = {
  jobWorkers: [],
  itemTypes: [],
  parties: [],
  fabrics: [],
  partNames: [],
  orders: [],
  issueFabric: [],
  receiveMaterial: [],
  payments: [],
  profiles: [],
  loaded: false,
  loading: false,
  error: null,
}

// ─── Reducer ────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_ALL':
      return { ...state, ...action.payload, loaded: true, loading: false, error: null }
    case 'SET_LOADING':
      return { ...state, loading: true, error: null }
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload }
    case 'SET_KEY':
      return { ...state, [action.key]: action.value }
    default:
      return state
  }
}

// ─── Pub/Sub ────────────────────────────────────────────────────
let state = initialState
const listeners = new Set()

function getState() {
  return state
}

function setState(newState) {
  state = newState
  listeners.forEach((l) => l(state))
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function dispatch(action) {
  setState(reducer(getState(), action))
}

// ─── Data access helpers ────────────────────────────────────────
export const store = {
  getState,
  subscribe,
  get: (key) => getState()[key],
}

// ─── LOAD ALL DATA (called once on app startup) ─────────────────
export async function loadAllData() {
  dispatch({ type: 'SET_LOADING' })
  try {
    const [jobWorkers, itemTypes, parties, fabrics, partNames, orders, issueFabric, receiveMaterial, payments, profiles] = await Promise.all([
      supabase.from('job_workers').select('*, groups(*, group_sizes(*), group_parts(*, group_part_bom(*)))'),
      supabase.from('item_types').select('*').order('name'),
      supabase.from('parties').select('*').order('name'),
      supabase.from('fabrics').select('*').order('name'),
      supabase.from('part_names').select('*').order('name'),
      supabase.from('orders').select('*, order_expected_qty(*)').order('date_created', { ascending: false }),
      supabase.from('issue_fabric').select('*, issue_fabric_blocks(*, issue_fabric_lumps(*))').order('date', { ascending: false }),
      supabase.from('receive_material').select('*, receive_items(*, receive_item_sizes(*), receive_item_part_fabric(*))').order('date', { ascending: false }),
      supabase.from('payments').select('*').order('date', { ascending: false }),
      supabase.from('profiles').select('*'),
    ])

    const errors = [jobWorkers, itemTypes, parties, fabrics, partNames, orders, issueFabric, receiveMaterial, payments, profiles]
      .filter((r) => r.error)
      .map((r) => r.error.message)
    if (errors.length > 0) throw new Error(errors.join('; '))

    dispatch({
      type: 'SET_ALL',
      payload: {
        jobWorkers: jobWorkers.data || [],
        itemTypes: itemTypes.data || [],
        parties: parties.data || [],
        fabrics: fabrics.data || [],
        partNames: partNames.data || [],
        orders: orders.data || [],
        issueFabric: issueFabric.data || [],
        receiveMaterial: receiveMaterial.data || [],
        payments: payments.data || [],
        profiles: profiles.data || [],
      },
    })
  } catch (err) {
    dispatch({ type: 'SET_ERROR', payload: err.message })
    throw err
  }
}

// ─── REFRESH A SINGLE TABLE ─────────────────────────────────────
async function refreshTable(table, selectQuery, orderCol) {
  let query = supabase.from(table).select(selectQuery)
  if (orderCol) {
    const [col, asc] = orderCol
    query = query.order(col, { ascending: asc })
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

// ─── ITEM TYPES ─────────────────────────────────────────────────
export async function createItemType({ name }) {
  const { error } = await supabase.from('item_types').insert({ name })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'itemTypes', value: await refreshTable('item_types', '*', ['name', true]) })
}

export async function updateItemType(id, { name }) {
  const { error } = await supabase.from('item_types').update({ name }).eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'itemTypes', value: await refreshTable('item_types', '*', ['name', true]) })
}

export async function deleteItemType(id) {
  const { error } = await supabase.from('item_types').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'itemTypes', value: await refreshTable('item_types', '*', ['name', true]) })
}

// ─── PARTIES ────────────────────────────────────────────────────
export async function createParty({ name, type }) {
  const { error } = await supabase.from('parties').insert({ name, type })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'parties', value: await refreshTable('parties', '*', ['name', true]) })
}

export async function updateParty(id, { name, type }) {
  const { error } = await supabase.from('parties').update({ name, type }).eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'parties', value: await refreshTable('parties', '*', ['name', true]) })
}

export async function deleteParty(id) {
  const { error } = await supabase.from('parties').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'parties', value: await refreshTable('parties', '*', ['name', true]) })
}

// ─── FABRICS ────────────────────────────────────────────────────
export async function createFabric({ name }) {
  const { error } = await supabase.from('fabrics').insert({ name })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'fabrics', value: await refreshTable('fabrics', '*', ['name', true]) })
}

export async function updateFabric(id, { name }) {
  const { error } = await supabase.from('fabrics').update({ name }).eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'fabrics', value: await refreshTable('fabrics', '*', ['name', true]) })
}

export async function deleteFabric(id) {
  const { error } = await supabase.from('fabrics').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'fabrics', value: await refreshTable('fabrics', '*', ['name', true]) })
}

// ─── JOB WORKERS (uses RPC) ─────────────────────────────────────
export async function saveJobWorker(payload) {
  const { data, error } = await supabase.rpc('upsert_job_worker', {
    p_id: payload.id || null,
    p_name: payload.name,
    p_phone: payload.phone,
    p_groups: payload.groups || [],
  })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'jobWorkers', value: await refreshTable('job_workers', '*, groups(*, group_sizes(*), group_parts(*, group_part_bom(*)))') })
  return data
}

export async function deleteJobWorker(id) {
  const { error } = await supabase.from('job_workers').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'jobWorkers', value: await refreshTable('job_workers', '*, groups(*, group_sizes(*), group_parts(*, group_part_bom(*)))') })
}

// ─── PART NAMES (restored) ──────────────────────────────────────
export async function createPartName({ name }) {
  const { error } = await supabase.from('part_names').insert({ name })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'partNames', value: await refreshTable('part_names', '*', ['name', true]) })
}

export async function updatePartName(id, { name }) {
  const { error } = await supabase.from('part_names').update({ name }).eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'partNames', value: await refreshTable('part_names', '*', ['name', true]) })
}

export async function deletePartName(id) {
  const { error } = await supabase.from('part_names').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'partNames', value: await refreshTable('part_names', '*', ['name', true]) })
}

// ─── ORDERS (uses RPC) ──────────────────────────────────────────
export async function saveOrder(orderData) {
  const { data, error } = await supabase.rpc('upsert_order', {
    p_id: orderData.id || null,
    p_date_created: orderData.dateCreated,
    p_job_worker_id: orderData.jobWorkerId,
    p_party_id: orderData.partyId,
    p_item_type_id: orderData.itemTypeId,
    p_group_id: orderData.groupId,
    p_fabric_id: orderData.fabricId || null,
    p_status: orderData.status,
    p_fabric_note: orderData.fabricNote || '',
    p_notes: orderData.notes || '',
    p_expected_qty: Object.entries(orderData.expectedQty || {}).map(([sizeId, qty]) => ({
      sizeId,
      qty,
    })),
  })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'orders', value: await refreshTable('orders', '*, order_expected_qty(*)', ['date_created', false]) })
  return data
}

export async function softDeleteOrder(id) {
  const { error } = await supabase.from('orders').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'orders', value: await refreshTable('orders', '*, order_expected_qty(*)', ['date_created', false]) })
}

// ─── ISSUE FABRIC (uses RPC) ────────────────────────────────────
export async function saveIssueFabric(entry) {
  const { data, error } = await supabase.rpc('upsert_issue_fabric', {
    p_id: entry.id || null,
    p_challan_no: entry.challanNo,
    p_date: entry.date,
    p_job_worker_id: entry.jobWorkerId,
    p_order_id: entry.orderId || null,
    p_blocks: (entry.fabricBlocks || []).map((block, blockIdx) => ({
      id: block.id || null,
      fabricId: block.fabricId,
      sortOrder: blockIdx,
      lumps: (block.lumps || []).map((lump) => ({
        id: lump.id || null,
        lumpNo: lump.lumpNo,
        metres: lump.metres,
      })),
    })),
  })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'issueFabric', value: await refreshTable('issue_fabric', '*, issue_fabric_blocks(*, issue_fabric_lumps(*))', ['date', false]) })
  return data
}

export async function deleteIssueFabric(id) {
  const { error } = await supabase.from('issue_fabric').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'issueFabric', value: await refreshTable('issue_fabric', '*, issue_fabric_blocks(*, issue_fabric_lumps(*))', ['date', false]) })
}

// ─── RECEIVE MATERIAL (uses RPC) ─────────────────────────────────
export async function saveReceiveMaterial(entry) {
  const { data, error } = await supabase.rpc('upsert_receive_material', {
    p_id: entry.id || null,
    p_challan_no: entry.challanNo,
    p_date: entry.date,
    p_job_worker_id: entry.jobWorkerId,
    p_order_id: entry.orderId || null,
    p_items: (entry.items || []).map((item, itemIdx) => ({
      id: item.id || null,
      itemTypeId: item.itemTypeId,
      partyId: item.partyId,
      groupId: item.groupId,
      sortOrder: itemIdx,
      sizeWise: Object.entries(item.sizeWise || {}).map(([sizeId, pieces]) => ({
        sizeId,
        pieces,
      })),
      partFabric: Object.entries(item.partFabric || {}).map(([partId, fabricId]) => ({
        partId,
        fabricId,
      })),
    })),
  })
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'receiveMaterial', value: await refreshTable('receive_material', '*, receive_items(*, receive_item_sizes(*), receive_item_part_fabric(*))', ['date', false]) })
  return data
}

export async function deleteReceiveMaterial(id) {
  const { error } = await supabase.from('receive_material').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'receiveMaterial', value: await refreshTable('receive_material', '*, receive_items(*, receive_item_sizes(*), receive_item_part_fabric(*))', ['date', false]) })
}

// ─── PAYMENTS ───────────────────────────────────────────────────
export async function savePayment({ id, jobWorkerId, amount, date, notes }) {
  const payload = id
    ? { id, job_worker_id: jobWorkerId, amount, date, notes: notes || '' }
    : { job_worker_id: jobWorkerId, amount, date, notes: notes || '' }
  const query = id ? supabase.from('payments').upsert(payload) : supabase.from('payments').insert(payload)
  const { error } = await query
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'payments', value: await refreshTable('payments', '*', ['date', false]) })
}

export async function deletePayment(id) {
  const { error } = await supabase.from('payments').delete().eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'payments', value: await refreshTable('payments', '*', ['date', false]) })
}

// ─── PROFILES ───────────────────────────────────────────────────
export async function updateProfile(id, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id)
  if (error) throw new Error(error.message)
  dispatch({ type: 'SET_KEY', key: 'profiles', value: await refreshTable('profiles', '*') })
}

// ─── UTILITY ────────────────────────────────────────────────────
export async function refetchAll() {
  await loadAllData()
}
