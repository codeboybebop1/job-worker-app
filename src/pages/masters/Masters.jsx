import { useState } from 'react'
import { FiTag, FiUsers, FiTruck, FiLayers, FiScissors, FiSettings } from 'react-icons/fi'
import ItemTypes from './ItemTypes'
import JobWorkers from './JobWorkers'
import Parties from './Parties'
import Fabrics from './Fabrics'
import PartNames from './PartNames'

const TABS = [
  { id: 'itemTypes', label: 'Item Types', icon: FiTag },
  { id: 'jobWorkers', label: 'Job Workers & Groups', icon: FiUsers },
  { id: 'parties', label: 'Parties', icon: FiTruck },
  { id: 'fabrics', label: 'Fabrics / Designs', icon: FiLayers },
  { id: 'partNames', label: 'Part Names', icon: FiScissors },
  { id: 'settings', label: 'Settings', icon: FiSettings },
]

/**
 * Masters page. Reference: function renderMasters(c) in jobwork_v3.html.
 * Single page with tab navigation for all master-data configuration:
 * Item Types, Job Workers & Groups, Parties, Fabrics / Designs, Part Names, Settings.
 * Each tab renders its own self-contained component (matching the HTML's tab bodies).
 */
export default function Masters() {
  const [activeTab, setActiveTab] = useState('itemTypes')

  return (
    <div>
      <div className="flex gap-1 mb-4 flex-wrap border-b border-border pb-0">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13.5px] font-medium border-b-2 transition-colors rounded-t-lg ${
                isActive
                  ? 'border-accent text-accent bg-accent-soft'
                  : 'border-transparent text-text-soft hover:text-text hover:bg-[#f7f8fa]'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {activeTab === 'itemTypes' && <ItemTypes />}
        {activeTab === 'jobWorkers' && <JobWorkers />}
        {activeTab === 'parties' && <Parties />}
        {activeTab === 'fabrics' && <Fabrics />}
        {activeTab === 'partNames' && <PartNames />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="bg-panel border border-border rounded-lg p-6">
      <h2 className="text-base font-bold mb-2 flex items-center gap-2"><FiSettings size={18} className="text-accent" /> Settings</h2>
      <p className="text-sm text-text-soft mb-4">Application configuration. Settings that were previously stored in the database have been moved to environment variables for security.</p>
      <div className="space-y-3">
        <div className="bg-[#f7f8fa] rounded-lg p-4 border border-border">
          <div className="text-sm font-bold mb-1">Billing PIN</div>
          <p className="text-xs text-text-soft">The billing access PIN is now managed as a backend-only <code className="bg-white px-1.5 py-0.5 rounded text-accent font-mono text-[11px]">BILLING_PIN</code> environment variable. It is no longer stored in the database. To change it, update the env var in your Supabase Edge Function / backend configuration and redeploy.</p>
        </div>
        <div className="bg-[#f7f8fa] rounded-lg p-4 border border-border">
          <div className="text-sm font-bold mb-1">Database</div>
          <p className="text-xs text-text-soft">All master data below is stored in Supabase (PostgreSQL). Every add/edit/delete here writes directly to the database and the UI reflects the confirmed saved state.</p>
        </div>
      </div>
    </div>
  )
}