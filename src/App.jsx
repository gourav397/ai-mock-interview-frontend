import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/layout/Navbar";
import Onboarding from "./components/Onboarding";

function App() {
  return (
    <BrowserRouter>
      <Onboarding />
      <Navbar />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;