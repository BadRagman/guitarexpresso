
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { parseFile, SongData } from "@/utils/fileParser";
import { FilePlus, FileText, Loader2 } from "lucide-react";

interface FileUploadProps {
  onFileProcessed: (data: SongData) => void;
}

const FileUpload = ({ onFileProcessed }: FileUploadProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      if (!["txt", "docx", "pdf"].includes(fileType || "")) {
        toast.error("Formato di file non supportato. Utilizzare .txt, .docx, o .pdf");
        return;
      }
      
      setIsLoading(true);
      
      try {
        const songData = await parseFile(file);
        onFileProcessed(songData);
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error("Si è verificato un errore durante l'elaborazione del file");
      } finally {
        setIsLoading(false);
      }
    },
    [onFileProcessed]
  );
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
  });
  
  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className="cursor-pointer text-center p-6"
      >
        <input {...getInputProps()} />
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-2" />
            <p className="text-gray-500">Elaborazione del file in corso...</p>
          </div>
        ) : (
          <>
            {isDragActive ? (
              <div className="flex flex-col items-center">
                <FilePlus className="h-10 w-10 text-blue-500 mb-2" />
                <p className="font-medium text-blue-500">Rilascia qui il file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FileText className="h-10 w-10 text-blue-500 mb-2" />
                <p className="font-medium">
                  Load file txt, docx or PDF<br />or drag it inside
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
