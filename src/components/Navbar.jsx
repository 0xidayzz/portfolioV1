import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import photo from "../assets/photo.jpg";
import {
  FaHome, FaUser, FaBriefcase,
  FaEnvelope, FaGraduationCap,
  FaBars, FaSun, FaMoon,
} from "react-icons/fa";

const links = [
  { to: "/",              icon: <FaHome />,          label: "Accueil"        },
  { to: "/about",         icon: <FaUser />,          label: "Qui suis-je ?"  },
  { to: "/qualification", icon: <FaGraduationCap />, label: "Qualifications" },
  { to: "/projects",      icon: <FaBriefcase />,     label: "Projets"        },
  { to: "/contact",       icon: <FaEnvelope />,      label: "Contact"        },
];

const ACCENTS = [
  { key: "violet", color: "#ab229f" },
  { key: "green",  color: "#22ab2d" },
  { key: "yellow", color: "#f0b429" },
];

function Navbar() {
  const [open,   setOpen]   = useState(true);

  // On lit le localStorage au 1er rendu, sinon valeur par défaut
  const [theme,  setTheme]  = useState(
    () => localStorage.getItem("theme")  || "dark"
  );
  const [accent, setAccent] = useState(
    () => localStorage.getItem("accent") || "violet"
  );

  // Chaque fois que theme ou accent change → on met à jour le <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme",  theme);
    document.documentElement.setAttribute("data-accent", accent);
    localStorage.setItem("theme",  theme);
    localStorage.setItem("accent", accent);
  }, [theme, accent]);

  const toggleTheme = () =>
    setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return (
    <aside className={`sidebar ${open ? "open" : "closed"}`}>

      {/* TOGGLE SIDEBAR */}
      <button className="toggle-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
        <FaBars />
      </button>

      {/* PROFIL */}
      <div className="profile">
        <div className="avatar-wrapper">
          <img src={photo} alt="Johan COUTON" />
        </div>
        <div className={`profile-info ${open ? "visible" : "hidden"}`}>
          <h3>Johan COUTON</h3>
          <span>Oxidayzz</span>
        </div>
      </div>

      <div className="divider" />

      {/* LIENS */}
      <nav>
        <ul>
          {links.map(({ to, icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                title={!open ? label : ""}
              >
                <span className="nav-icon">{icon}</span>
                <span className={`nav-label ${open ? "visible" : "hidden"}`}>
                  {label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* BLOC THÈME — tout en bas */}
      <div className="theme-block">

        {/* Bouton jour/nuit */}
        <button className="theme-toggle" onClick={toggleTheme} title={!open ? (theme === "dark" ? "Mode clair" : "Mode sombre") : ""}>
          <span className="theme-toggle-icon">
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </span>
          <span className={open ? "visible" : "hidden"}>
            {theme === "dark" ? "Mode clair" : "Mode sombre"}
          </span>
        </button>

        {/* Pastilles accent — visibles seulement si sidebar ouverte */}
        <div className={`accent-picker ${open ? "visible" : "hidden"}`}>
          {ACCENTS.map(({ key, color }) => (
            <button
              key={key}
              className={`accent-dot ${accent === key ? "selected" : ""}`}
              style={{ background: color }}
              onClick={() => setAccent(key)}
              title={key}
              aria-label={`Accent ${key}`}
            />
          ))}
        </div>

      </div>
    </aside>
  );
}

export default Navbar;