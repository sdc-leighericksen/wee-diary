import { useNavigate, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import './FAB.css'

export default function FAB() {
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname.startsWith('/log')) return null

  return (
    <button className="fab" onClick={() => navigate('/log')} aria-label="Log something">
      <Plus size={28} strokeWidth={2.5} />
    </button>
  )
}
