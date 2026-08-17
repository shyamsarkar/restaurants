import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useCommonStore } from '@/stores/common.store';

const AdminLayout: React.FC = () => {
  const showSidebar = useCommonStore((state)=> state.showSidebar)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden w-screen">
      <Sidebar />
      <main
        className={`flex-1 h-full min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
          showSidebar ? 'pl-56' : 'pl-16'
        }`}
      >
        <div className="p-3 md:p-4 h-full min-w-0 overflow-auto flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
