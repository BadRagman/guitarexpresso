
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SongData } from "@/utils/fileParser";
import { ArrowLeft, Eye, Pencil, X, LogOut } from "lucide-react";
import { SongService } from "@/services/SongService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Song extends SongData {
  id: string;
}

const MySongs = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [localSongs, setLocalSongs] = useState<Song[]>([]);
  
  // Fetch songs from Supabase
  const { data: songs = [], isLoading, error } = useQuery({
    queryKey: ['songs'],
    queryFn: SongService.fetchUserSongs,
    enabled: !!user,
  });
  
  // Delete song mutation
  const deleteMutation = useMutation({
    mutationFn: SongService.deleteSong,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songs'] });
      toast.success("Canzone eliminata con successo");
    },
    onError: () => {
      toast.error("Errore durante l'eliminazione della canzone");
    }
  });
  
  useEffect(() => {
    // Load local songs if not logged in
    if (!user) {
      const storedSongs = JSON.parse(localStorage.getItem("songs") || "[]");
      setLocalSongs(storedSongs);
    }
  }, [user]);
  
  const handleDelete = async (songId: string) => {
    if (user) {
      deleteMutation.mutate(songId);
    } else {
      // Handle local storage deletion
      const updatedSongs = localSongs.filter(song => song.id !== songId);
      setLocalSongs(updatedSongs);
      localStorage.setItem("songs", JSON.stringify(updatedSongs));
      toast.success("Canzone eliminata");
    }
  };

  const displaySongs = user ? songs : localSongs;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header rimosso, ora è gestito da Layout.tsx */}

      {/* Main Content */}      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {isLoading && user && (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Caricamento canzoni...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-10">
              <p className="text-red-500">Errore nel caricare le canzoni</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['songs'] })} className="mt-4">
                Riprova
              </Button>
            </div>
          )}

          {!isLoading && displaySongs.length > 0 ? (
            displaySongs.map((song) => (
              <Card key={song.id} className="p-4 border-2 border-blue-100">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <h2 className="font-bold text-2xl">{song.title}</h2>
                    <p className="text-gray-600">{song.artist}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Link to={`/view/${song.id}`}>
                      <Button className="bg-blue-500 hover:bg-blue-600 rounded-full">
                        <Eye className="h-4 w-4" />
                        <span className="ml-2">View</span>
                      </Button>
                    </Link>
                    <Link to={`/edit/${song.id}`}>
                      <Button className="bg-blue-500 hover:bg-blue-600 rounded-full">
                        <Pencil className="h-4 w-4" />
                        <span className="ml-2">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="border-blue-500 text-blue-500 rounded-full"
                      onClick={() => handleDelete(song.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-2">Cancel</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            !isLoading && (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-500">No songs yet</h2>
                <p className="text-gray-400 mt-2">Upload a song from the home page</p>
                <Link to="/" className="mt-4 inline-block">
                  <Button className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go to Home
                  </Button>
                </Link>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default MySongs;
