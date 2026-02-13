import { BrowserRouter, Route, Routes } from "react-router";
import ProtectedRoute from "./components/utility/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function App() {
  if (!import.meta.env.VITE_BACKEND_URL)
    throw new Error("VITE_BACKEND_URL not set in .env");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={<LoginPage setIsAuthenticated={setIsAuthenticated} />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
