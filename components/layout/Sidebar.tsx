// components/layout/Sidebar.tsx
'use client';

import { Banknote, CreditCard, Factory, FileText, Folder, LayoutDashboard, LineChart, Package, ShoppingCart, Tag, Truck, Users, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { POSNavigation } from './pos-navigation';

export function Sidebar() {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Sales Orders', icon: ShoppingCart, href: '/dashboard/sales-orders' },
    { name: 'Inventory', icon: Package, href: '/dashboard/inventory' },
    { name: 'Purchase Orders', icon: Truck, href: '/dashboard/purchase-orders' },
    { name: 'Payments', icon: CreditCard, href: '/dashboard/payments' },
    { name: 'Analytics', icon: LineChart, href: '/dashboard/analytics' },
    { name: 'Reports', icon: FileText, href: '/dashboard/reports' },
    { name: 'Customers', icon: Users, href: '/dashboard/customers' },
    { name: 'Suppliers', icon: Factory, href: '/dashboard/suppliers' },
    { name: 'Products', icon: Tag, href: '/dashboard/products' },
    { name: 'Categories', icon: Folder, href: '/dashboard/categories' },
    { name: 'Pricelist', icon: IndianRupee, href: '/dashboard/pricelists' },
    { name: 'Accounting', icon: Banknote, href: '/dashboard/accounting' },
  ];

  return (
    <div className="sidebar bg-slate-900 text-slate-100 w-[260px] p-0 flex flex-col h-full border-r border-slate-700 shadow-lg">
      <div className="sidebar-logo px-6 py-6 border-b border-slate-700">
        <h2 className="text-white font-bold text-xl tracking-tight">CashFlow AI</h2>
      </div>
      <nav className="sidebar-nav px-3 py-4 flex-grow overflow-y-auto space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href} 
            className="nav-item flex items-center gap-3 py-2.5 px-4 rounded-md transition-colors duration-200 text-slate-300 hover:bg-slate-800 hover:text-slate-100 active:bg-slate-700 active:text-white font-medium text-sm"
          >
            <item.icon className="nav-icon h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        ))}
        <POSNavigation />
      </nav>
      <div className="px-4 py-4 border-t border-slate-700 text-xs text-slate-500 text-center">
        © 2025 CashFlow AI
      </div>
    </div>
  );
}
