import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavigationSidebar from './NavigationSidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { cn } from '../../utils/cn';

const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 flex flex-col transition-colors duration-300">
            <Header
                collapsed={collapsed}
                setCollapsed={setCollapsed}
            />
            <div className="flex flex-1 w-full overflow-hidden">
                <NavigationSidebar
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                />

                <div
                    className={cn(
                        "flex-1 flex flex-col min-w-0 transition-all duration-300 w-full",
                        collapsed ? "lg:ml-20" : "lg:ml-[280px]"
                    )}
                >
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 lg:pb-8">
                        <Outlet />
                    </main>
                </div>
            </div>
            <BottomNav />
        </div>
    );
};

export default MainLayout;
