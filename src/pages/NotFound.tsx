import { Link } from "wouter";
import { Button } from "../components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen elegant-gradient flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-muted-foreground">Página não encontrada</p>
        <Link href="/"><Button>Voltar ao início</Button></Link>
      </div>
    </div>
  );
}
