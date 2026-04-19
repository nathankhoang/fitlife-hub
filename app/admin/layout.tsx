import Link from "next/link";
import LogoutButton from "./_components/LogoutButton";

const navItems = [
  { href: "/admin#overview", label: "Overview" },
  { href: "/admin#articles", label: "Article Queue" },
  { href: "/admin#social", label: "Social Queue" },
  { href: "/admin#analytics", label: "Analytics" },
  { href: "/admin#crm", label: "CRM" },
  { href: "/admin#generate", label: "Content Generation" },
  { href: "/admin/queue", label: "Full Queue View ↗" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f172a] flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col py-6 px-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <span className="w-7 h-7 rounded bg-[#059669] flex items-center justify-center text-white text-[10px] font-bold">LBE</span>
          <span className="text-white text-sm font-bold">Admin</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center px-3 py-2 text-xs text-white/40 hover:text-white/60 rounded-lg transition-colors mb-1"
          >
            ← Back to site
          </Link>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 py-8 px-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}
