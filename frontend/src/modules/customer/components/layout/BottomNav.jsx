import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Category', icon: LayoutGrid, path: '/categories' },
    { label: 'Orders', icon: ShoppingBag, path: '/orders' },
    { label: 'Profile', icon: User, path: '/profile' },
];

const BottomNav = () => {
    const location = useLocation();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[500] bg-white border-t border-gray-100 flex items-center justify-around h-[65px] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom)]">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="flex-1 flex flex-col items-center justify-center h-full relative group transition-all"
                    >
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center py-1 px-3.5 rounded-full transition-all duration-300",
                                isActive ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <item.icon
                                size={20}
                                strokeWidth={isActive ? 2.5 : 1.8}
                                className={cn(
                                    "transition-transform duration-300",
                                    isActive ? "scale-110" : "scale-100"
                                )}
                            />
                            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
                                {item.label}
                            </span>
                        </div>

                        {/* Top Accent Indicator */}
                        {isActive && (
                            <div className="absolute -top-[1px] w-6 h-[3px] bg-primary rounded-full transition-all duration-300" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
};

export default BottomNav;

