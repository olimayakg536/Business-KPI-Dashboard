import { BarChart3, LayoutDashboard, Lightbulb, Table2, SlidersHorizontal } from 'lucide-react';

const links = [
  { href: '#overview', label: 'Overview', icon: LayoutDashboard },
  { href: '#filters', label: 'Filters', icon: SlidersHorizontal },
  { href: '#charts', label: 'Charts', icon: BarChart3 },
  { href: '#insights', label: 'Insights', icon: Lightbulb },
  { href: '#customers', label: 'Customers', icon: Table2 },
];

export default function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Dashboard sections">
      <div className="brand">
        <BarChart3 size={22} aria-hidden="true" />
        <span>KPI Dashboard</span>
      </div>
      <ul>
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <a href={href}>
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
