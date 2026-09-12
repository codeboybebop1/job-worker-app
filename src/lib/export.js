/**
 * Export utilities for backing up data and exporting to Excel-compatible formats.
 */
import { supabase } from './supabaseClient'

// Trigger browser download for a blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Trigger browser download for JSON data
export function exportJSON(data, filename) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, filename)
}

// Convert array of objects to CSV string
function arrayToCSV(arr, columns) {
  if (!arr || arr.length === 0) return ''
  
  const headers = columns.map(c => c.header)
  const rows = arr.map(item => {
    return columns.map(col => {
      let val = col.key.split('.').reduce((obj, k) => obj?.[k], item)
      if (val === undefined || val === null) val = ''
      // Handle arrays (e.g., sizes, parts)
      if (Array.isArray(val)) val = val.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join('; ')
      // Handle objects
      if (typeof val === 'object' && !Array.isArray(val)) val = JSON.stringify(val)
      // Escape CSV special characters
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    })
  })
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

// Export array of objects to CSV file
export function exportCSV(arr, columns, filename) {
  const csv = arrayToCSV(arr, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, filename)
}

// Flatten job workers data for Excel export
export function flattenJobWorkersForExcel(workers) {
  const rows = []
  workers?.forEach(jw => {
    const base = {
      'Worker ID': jw.id,
      'Worker Name': jw.name,
      'Phone': jw.phone || '',
    }
    
    if (jw.groups?.length > 0) {
      jw.groups.forEach(group => {
        const groupRow = {
          ...base,
          'Group ID': group.id,
          'Group Name': group.group_name,
          'Item Type ID': group.item_type_id || '',
          'Piece Rate': group.piece_rate || 0,
        }
        
        if (group.group_sizes?.length > 0) {
          group.group_sizes.forEach(size => {
            rows.push({
              ...groupRow,
              'Size ID': size.id,
              'Size Name': size.name,
            })
          })
        } else {
          rows.push(groupRow)
        }
      })
    } else {
      rows.push(base)
    }
  })
  return rows
}

// Export job workers to CSV
export function exportJobWorkersCSV(workers, filename = 'job_workers_groups.csv') {
  const flatData = flattenJobWorkersForExcel(workers)
  const columns = [
    { key: 'Worker ID', header: 'Worker ID' },
    { key: 'Worker Name', header: 'Worker Name' },
    { key: 'Phone', header: 'Phone' },
    { key: 'Group ID', header: 'Group ID' },
    { key: 'Group Name', header: 'Group Name' },
    { key: 'Item Type ID', header: 'Item Type ID' },
    { key: 'Piece Rate', header: 'Piece Rate' },
    { key: 'Size ID', header: 'Size ID' },
    { key: 'Size Name', header: 'Size Name' },
  ]
  exportCSV(flatData, columns, filename)
}

// Fetch all data for full backup
export async function fetchAllDataForBackup() {
  const [jobWorkers, itemTypes, parties, fabrics, partNames] = await Promise.all([
    supabase.from('job_workers').select('*, groups(*, group_sizes(*, group_parts(*, group_part_bom(*))))'),
    supabase.from('item_types').select('*'),
    supabase.from('parties').select('*'),
    supabase.from('fabrics').select('*'),
    supabase.from('part_names').select('*'),
  ])
  
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: {
      jobWorkers: jobWorkers.data || [],
      itemTypes: itemTypes.data || [],
      parties: parties.data || [],
      fabrics: fabrics.data || [],
      partNames: partNames.data || [],
    }
  }
}