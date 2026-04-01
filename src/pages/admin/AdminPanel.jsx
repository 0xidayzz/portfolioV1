import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  FaBriefcase, FaTools, FaGraduationCap,
  FaEnvelope, FaUser, FaSignOutAlt,
} from "react-icons/fa";
import AdminProjects from "./AdminProjects";

const sections = [
  { icon: <FaUser />,          label: "Profil",         key: "profile"        },
  { icon: <FaBriefcase />,     label: "Projets & Tags", key: "projects"       },
  { icon: <FaTools />,         label: "Compétences",    key: "skills"         },
  { icon: <FaGraduationCap />, label: "Qualifications", key: "qualifications" },
  { icon: <FaEnvelope />,      label: "Contact",        key: "contact"        },
];

function AdminPanel() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [activeSection, setActiveSection] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate("/x7k2m9");
  };

  return (
    <div className="admin-page">

      <div className="admin-header">
        <div>
          <h1>Panel Admin</h1>
          <p>Connecté en tant que <strong>{user.email}</strong></p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Déconnexion
        </button>
      </div>

      {!activeSection && (
        <div className="admin-grid">
          {sections.map(({ icon, label, key }) => (
            <div
              key={key}
              className="admin-card"
              onClick={() => setActiveSection(key)}
            >
              <span className="admin-card-icon">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}

      {activeSection && (
        <div>
          <button
            className="admin-back-btn"
            onClick={() => setActiveSection(null)}
          >
            ← Retour au panel
          </button>
          {activeSection === "projects" && <AdminProjects />}
          {activeSection !== "projects" && (
            <p style={{ color: "var(--text-muted)", marginTop: 32 }}>
              Section "{activeSection}" — à venir.
            </p>
          )}
        </div>
      )}

    </div>
  );
}

export default AdminPanel;