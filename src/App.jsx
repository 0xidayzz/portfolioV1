import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// ... tes autres imports

function App() {
  return (
    <AuthProvider>
      {/* On ajoute le basename ici aussi */}
      <Router basename="/portfolio"> 
        <div className="app">
          <Navbar />
          <div className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/qualification" element={<Qualification />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<AdminLogin />} />
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