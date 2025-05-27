
import { supabase } from "@/integrations/supabase/client";
import { SongData } from "@/utils/fileParser";

interface Song extends SongData {
  id: string;
  user_id?: string;
}

const saveSongToLocalDatabase = (song: SongData) => {
  const existingSongs = JSON.parse(localStorage.getItem('songs') || '[]');
  existingSongs.push(song);
  localStorage.setItem('songs', JSON.stringify(existingSongs));
};

const fetchSongsFromLocalDatabase = (): SongData[] => {
  return JSON.parse(localStorage.getItem('songs') || '[]');
};

const deleteSongFromLocalDatabase = (songId: string) => {
  const existingSongs = JSON.parse(localStorage.getItem('songs') || '[]');
  const updatedSongs = existingSongs.filter((song: SongData) => song.id !== songId);
  localStorage.setItem('songs', JSON.stringify(updatedSongs));
};

export const SongService = {
  saveSong: saveSongToLocalDatabase,
  fetchSongs: fetchSongsFromLocalDatabase,
  deleteSong: deleteSongFromLocalDatabase
};
