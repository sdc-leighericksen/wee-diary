import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import FAB from './FAB'

export default function AppShell() {
  return (
    <>
      <Outlet />
      <FAB />
      <BottomNav />
    </>
  )
}
