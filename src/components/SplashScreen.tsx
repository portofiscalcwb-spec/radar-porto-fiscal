import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center elegant-gradient animate-fade-out">
      <div className="text-center space-y-6 animate-pulse">
        <img src="/porto-fiscal-logo.png" alt="Porto Fiscal" className="h-32 w-auto mx-auto drop-shadow-2xl" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Radar Porto Fiscal</h1>
          <p className="text-muted-foreground text-lg">Carregando...</p>
        </div>
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
