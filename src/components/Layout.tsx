import { useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
// import { useAuth } from "@/context/AuthContext"; // Auth context might not be needed directly in Layout if not used for display

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  // const { user, signOut } = useAuth(); // Potrebbe non essere necessario qui se non si visualizzano info utente nel layout

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const toggleMenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  // Apply saved theme on component mount
  useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  });

  return (
    <div className="min-h-screen" onClick={() => menuOpen && setMenuOpen(false)}>
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-[var(--box-bg)] border-b border-[var(--border-color)] flex-wrap">
        <div className="flex-1 flex justify-center">
          <Link to="/">
            <img src="/lovable-uploads/4c3baa85-2069-4325-8e8f-1dde9f190b1f.png" alt="Guitar Express Logo" className="h-[60px] sm:h-[80px] max-w-full" />
          </Link>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <span 
            className="text-[1em] sm:text-[1.2em] cursor-pointer text-[var(--text-color)]" 
            onClick={toggleMenu}
            role="button"
            aria-label="Toggle menu"
          >
            ☰
          </span>
        </div>
      </header>

      {/* Sidebar Menu */}
      <div className={`fixed top-0 right-0 h-full bg-white shadow-lg transform transition-transform duration-1000 ease-in-out w-64 z-50 ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4">
            <img src="/lovable-uploads/4c3baa85-2069-4325-8e8f-1dde9f190b1f.png" alt="Guitar Expresso Logo" className="mb-4 mx-auto w-1/2" />
            <ul className="space-y-4">
              <li>
                <Link to="/auth" className="block text-[var(--text-color)] flex items-center" onClick={() => toggleMenu()}>
                  <span className="material-icons mr-2">login</span>Login
                </Link>
              </li>
              <li>
                <Link to="/" className="block text-[var(--text-color)] flex items-center" onClick={() => toggleMenu()}>
                  <span className="material-icons mr-2">home</span>Home
                </Link>
              </li>
              <li>
                <Link to="/my-songs" className="block text-[var(--text-color)] flex items-center" onClick={() => toggleMenu()}>
                  <span className="material-icons mr-2">library_music</span>My Songs
                </Link>
              </li>
              <li>
                <button className="block text-[var(--text-color)] flex items-center" onClick={() => { toggleMenu(); toast.info("Import/Export feature coming soon!"); }}>
                  <span className="material-icons mr-2">import_export</span>Importa/Exporta
                </button>
              </li>
              <li>
                <button className="block text-[var(--text-color)] flex items-center" onClick={() => { toggleMenu(); toggleTheme(); }}>
                  <span className="material-icons mr-2">brightness_6</span>Modalità Giorno/Notte
                </button>
              </li>
            </ul>
          </div>
        </div>

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-75 z-40"
          onClick={() => toggleMenu()}
        ></div>
      )}

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;