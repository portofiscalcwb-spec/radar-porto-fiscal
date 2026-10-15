import { Route, Router, Switch } from "wouter";
import { ROUTER_BASE } from "./lib/paths";
import { Toaster } from "sonner";
import SplashScreen from "./components/SplashScreen";
import Home from "./pages/Home";
import History from "./pages/History";
import CacheManagement from "./pages/CacheManagement";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <SplashScreen />
      <Toaster richColors position="top-right" />
      <Router base={ROUTER_BASE}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/historico" component={History} />
        <Route path="/cache" component={CacheManagement} />
        <Route component={NotFound} />
      </Switch>
      </Router>
    </>
  );
}
