
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FileUpload from "@/components/FileUpload";
import { SongData } from "@/utils/fileParser";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { SongService } from "@/services/SongService";

const Index = () => {
  const [songData, setSongData] = useState<SongData | null>(null);
  // Rimosso menuOpen e toggleMenu perché gestiti da Layout.tsx
  const navigate = useNavigate();
  const { user } = useAuth(); // signOut rimosso se non usato direttamente qui
  
  const handleFileProcessed = async (data: SongData) => {
    setSongData(data); // setSongData rimane per la logica della pagina
    try {
      if (user) {
        const newSong = await SongService.createSong(data);
        toast.success("Canzone salvata con successo!");
        navigate(`/edit/${newSong.id}`);
      } else {
        const songs = JSON.parse(localStorage.getItem("songs") || "[]");
        const newSong = {
          id: `song-${Date.now()}`,
          ...data
        };
        localStorage.setItem("songs", JSON.stringify([...songs, newSong]));
        toast.success("Canzone salvata localmente sul dispositivo");
        navigate(`/edit/${newSong.id}`);
      }
    } catch (error) {
      console.error("Error saving song:", error);
      toast.error("Errore nel salvare la canzone");
    }
  };

  // toggleTheme e la logica del tema sono ora in Layout.tsx
  // Apply saved theme on component mount è ora in Layout.tsx

  return (
    // Il div contenitore principale con min-h-screen e onClick per chiudere il menu è ora in Layout.tsx
      /* Main Content specifico per Index.tsx */
      <div className="max-w-[600px] mx-auto my-10 px-5 text-center">
        <div className="mb-5">
          <h2 className="text-[1.5em] mb-2.5 mt-0">Porta la tua musica sempre con te</h2>
          <p className="my-[5px]">Carica, modifica e visualizza le tue canzoni con accordi.</p>
          <p className="my-[5px]">Accedi a metronomo e accordatore in un click.</p>
        </div>

        <div className="border-2 border-dashed border-[#a77b52] p-10 rounded-lg bg-[var(--box-bg)] mb-[30px]">
          <FileUpload onFileProcessed={handleFileProcessed} />
        </div>

        <div className="flex justify-around gap-2.5 flex-wrap">
          <Link to="/my-songs" className="no-underline">
            <button className="bg-[var(--button-bg)] text-[var(--button-text)] border-none p-5 rounded w-[180px] max-w-full cursor-pointer">
              My Songs
              <span className="block text-[0.85em] mt-[5px] text-[var(--button-subtext)]">
                Accedi alla tua libreria personale
              </span>
            </button>
          </Link>
          <button 
            className="bg-[var(--button-bg)] text-[var(--button-text)] border-none p-5 rounded w-[180px] max-w-full cursor-pointer"
            onClick={() => toast.info("Metronome feature coming soon!")}
          >
            Metronome
            <span className="block text-[0.85em] mt-[5px] text-[var(--button-subtext)]">
              Allena il tuo senso del ritmo
            </span>
          </button>
          <button 
            className="bg-[var(--button-bg)] text-[var(--button-text)] border-none p-5 rounded w-[180px] max-w-full cursor-pointer"
            onClick={() => toast.info("Tuner feature coming soon!")}
          >
            Tuner
            <span className="block text-[0.85em] mt-[5px] text-[var(--button-subtext)]">
              Accorda la tua chitarra in un attimo
            </span>
          </button>
        </div>
        
        {!user && (
          <div className="mt-8 p-4 text-center bg-blue-50 rounded-lg">
            <p className="text-gray-600 mb-3">Modalità offline: le tue canzoni vengono salvate solo su questo dispositivo</p>
            <Link to="/auth">
              <button className="bg-[var(--button-bg)] text-[var(--button-text)] border-none px-4 py-2 rounded">
                Accedi per sincronizzare
              </button>
            </Link>
          </div>
        )}
      </div>
    // Chiusura del div principale spostata in Layout.tsx
  );
};

// Force recompile
export default Index;
