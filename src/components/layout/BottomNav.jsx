import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CalendarDays, BarChart2, Settings } from 'lucide-react'
import './BottomNav.css'

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/history', icon: CalendarDays, label: 'History' },
  { path: '/insights', icon: BarChart2, label: 'Insights' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {tabs.map(({ path, icon: Icon, label }) => {
        const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
        return (
          <button
            key={path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
