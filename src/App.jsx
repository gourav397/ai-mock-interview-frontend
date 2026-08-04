import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/layout/Navbar";
import Result from "./pages/Result";
import UploadResume from "./pages/UploadResume";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <AppRoutes />

    </BrowserRouter>
  );
}

export default App;