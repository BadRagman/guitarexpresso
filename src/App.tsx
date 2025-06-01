
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ViewSong from "./pages/ViewSong";
import EditSong from "./pages/EditSong";
import MySongs from "./pages/MySongs";
import Auth from "./pages/Auth";
import { AuthProvider } from "./context/AuthContext";
import Layout from "@/components/Layout"; // Importa il nuovo Layout

// Configurare il client per React Query
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout> {/* Avvolgi le Routes con il Layout */}
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/view/:songId" element={<ViewSong />} />
              <Route path="/edit/:songId" element={<EditSong />} />
              <Route path="/my-songs" element={<MySongs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Force recompile after manual server restart
export default App;
