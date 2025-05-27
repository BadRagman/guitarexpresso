
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Github, Mail, Music, Save } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";

const Auth = () => {
  const { user, signIn } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSkipLogin = () => {
    toast.info("Modalità offline attivata. Le canzoni verranno salvate localmente.");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Accedi all'App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center mb-6">
              <Music size={48} className="mx-auto text-[var(--button-bg)]" />
              <p className="mt-2 text-gray-600">
                Accedi per salvare e sincronizzare le tue canzoni tra dispositivi
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full bg-[var(--button-bg)] hover:bg-[var(--button-bg)]/90 py-6 text-lg"
                onClick={() => signIn('google')}
              >
                <Mail className="mr-2" />
                Continua con Google
              </Button>

              <Button 
                className="w-full py-6 text-lg"
                variant="outline"
                onClick={() => signIn('github')}
              >
                <Github className="mr-2" />
                Continua con GitHub
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    o continuare senza account
                  </span>
                </div>
              </div>
              
              <Link to="/" onClick={handleSkipLogin}>
                <Button 
                  className="w-full py-6 text-lg bg-[var(--button-bg)]/80 hover:bg-[var(--button-bg)]"
                >
                  <Save className="mr-2" />
                  Salva solo sul dispositivo
                </Button>
              </Link>
            </div>

            <div className="text-center mt-4 pt-4 border-t">
              <Link to="/" className="text-[var(--button-bg)] flex items-center justify-center">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alla home
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
