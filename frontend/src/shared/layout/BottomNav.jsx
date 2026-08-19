import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    ClipboardList,
    Box,
    Wallet,
} from 'lucide-react';

import { useAuth } from '@core/context/AuthContext';

const BottomNav = ({ navItems }) => {
    const { role } = useAuth();
    const location = useLocation();
    const [viewportOffset, setViewportOffset] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!window.visualViewport) return;

        const handleViewport = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const vv = window.visualViewport;
                // Distance from bottom of visual viewport to bottom of layout viewport
                const offset = window.innerHeight - vv.height - vv.offsetTop;
                setViewportOffset(Math.max(0, offset));
            });
        };

        window.visualViewport.addEventListener('resize', handleViewport);
        window.visualViewport.addEventListener('scroll', handleViewport);

        return () => {
            window.visualViewport.removeEventListener('resize', handleViewport);
            window.visualViewport.removeEventListener('scroll', handleViewport);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    // Define the primary bottom nav items based on user role
    const primaryItems = role === 'admin' ? [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
        { label: 'Orders', path: '/admin/orders/all', icon: ClipboardList },
        { label: 'Products', path: '/admin/products', icon: Box },
        { label: 'Wallet', path: '/admin/wallet', icon: Wallet },
    ] : [
        { label: 'Dashboard', path: '/seller', icon: LayoutDashboard, end: true },
        { label: 'Orders', path: '/seller/orders', icon: ClipboardList },
        { label: 'Products', path: '/seller/products', icon: Box },
        { label: 'Earnings', path: '/seller/earnings', icon: Wallet },
    ];

    return (
        <div
            className="fixed left-0 right-0 h-16 bg-[#0a0c10] border-t border-white/5 z-[60] md:hidden px-2 flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.4)]"
            style={{ bottom: viewportOffset }}
        >
            {primaryItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => cn(
                        "flex flex-col items-center justify-center space-y-1 w-16 transition-all duration-300",
                        isActive ? "text-primary" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                </NavLink>
            ))}
        </div>
    );
};

export default BottomNav;

