import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from './components/ThemeProvider';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <UserPreferencesProvider>
      <App />
    </UserPreferencesProvider>
  </ThemeProvider>
);
