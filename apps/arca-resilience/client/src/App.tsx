/** Design: Atlas de Campo Planetário — interface pública leve, editorial e cartográfica. */
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Assistant from "./pages/Assistant";
import Home from "./pages/Home";
import OperationalPanel from "./pages/OperationalPanel";
import ReviewPanel from "./pages/ReviewPanel";
import SafetyPolicy from "./pages/SafetyPolicy";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/assistente"} component={Assistant} />
      <Route path={"/operacoes"} component={OperationalPanel} />
      <Route path={"/revisao"} component={ReviewPanel} />
      <Route path={"/seguranca"} component={SafetyPolicy} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}

export default App;
