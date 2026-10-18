import { useState, type ReactNode } from "react";
import { LayoutDashboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigation, type Page } from "@/lib/constants/navigation";

export function AppShell({
  page,
  onNavigate,
  children,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
}) {
  const [mobileNav, setMobileNav] = useState(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◈
          </span>
          <span>
            TPI<strong>Tienda</strong>
          </span>
        </div>
        <nav aria-label="Secciones principales">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${page === item.id ? "nav-active" : ""}`}
                aria-current={page === item.id ? "page" : undefined}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileNav(false);
                }}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          BASES DE DATOS II
          <br />
          Gestión de tienda
        </div>
      </aside>
      <main className="main-content">
        <div className="topline">
          <div className="topline-left">
            <Button
              className="mobile-menu"
              variant="outline"
              size="icon"
              aria-label={mobileNav ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMobileNav(!mobileNav)}
            >
              {mobileNav ? <X /> : <LayoutDashboard />}
            </Button>
            <span>Universidad / TPI Bases de Datos 2</span>
          </div>
          <span className="demo-pill">
            <span className="live-dot" /> Datos guardados en la tienda
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}
