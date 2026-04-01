import { Routes, Route, HashRouter as Router } from "react-router-dom"; // 1. On importe HashRouter
import { AuthProvider }  from "./context/AuthContext";
import Navbar            from "./components/Navbar";
import ProtectedRoute    from "./components/ProtectedRoute";
import Home              from "./pages/Home";
import About             from "./pages/About";
import Qualification     from "./pages/Qualification";
import Projects          from "./pages/Projects";
import Contact           from "./pages/Contact";
import AdminLogin        from "./pages/AdminLogin";
import AdminPanel        from "./pages/admin/AdminPanel";

function App() {
  return (
    <AuthProvider>
      <Router> {/* 2. On entoure tout le contenu avec Router */}
        <div className="app">
          <Navbar />
          <div className="content">
            <Routes>
              <Route path="/"              element={<Home />}          />
              <Route path="/about"         element={<About />}         />
              <Route path="/qualification" element={<Qualification />} />
              <Route path="/projects"      element={<Projects />}      />
              <Route path="/contact"       element={<Contact />}       />

              <Route path="/login"         element={<AdminLogin />}    />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;