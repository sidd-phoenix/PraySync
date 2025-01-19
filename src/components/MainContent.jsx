import { useView } from '../contexts/ViewContext';
import SearchnGrid from './SearchnGrid.jsx';
import ManageAdmins from './ManageAdmins.jsx';
import AddMosqueForm from './AddMosqueForm.jsx'
import SalahMod from './SalahMod.jsx'

import '../styles/MainContent.css'

const MainContent = () => {
  const { view } = useView();
  
  return (
    <div className="main-content">
      {view === 'home' && (
        <SearchnGrid />
      )}

      {view === 'addMosque' && (
        <AddMosqueForm />
      )}

      {view === 'manageAdmins' && (
        <ManageAdmins />
      )}

      {view === 'salah_mod' && (
        <SalahMod />
      )}
    </div>
  )
}

export default MainContent