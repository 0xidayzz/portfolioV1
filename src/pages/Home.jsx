import { useNavigate } from "react-router-dom";
import {
  FaUser, FaGraduationCap, FaBriefcase, FaEnvelope
} from "react-icons/fa";

const cards = [
  {
    icon:        <FaUser />,
    label:       "Qui suis-je ?",
    description: "Mon parcours, ma personnalité et mes passions.",
    path:        "/about",
    color:       "#ab229f",
  },
  {
    icon:        <FaGraduationCap />,
    label:       "Qualifications",
    description: "Mes formations et expériences professionnelles.",
    path:        "/qualification",
    color:       "#22ab2d",
  },
  {
    icon:        <FaBriefcase />,
    label:       "Projets",
    description: "Mes réalisations, side-projects et expérimentations.",
    path:        "/projects",
    color:       "#f0b429",
  },
  {
    icon:        <FaEnvelope />,
    label:       "Contact",
    description: "Envie de collaborer ? Écrivez-moi.",
    path:        "/contact",
    color:       "#ab229f",
  },
];

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* HERO */}
      <div className="home-hero">
        <p className="home-eyebrow">Bienvenue sur mon portfolio</p>
        <h1 className="home-title">
          Johan <span className="home-accent">COUTON</span>
        </h1>
        <p className="home-subtitle">Développeur passionné · Explorez mon univers</p>
        <div className="home-bar" />
      </div>

      {/* GRILLE DE NAVIGATION */}
      <div className="home-grid">
        {cards.map(({ icon, label, description, path, color }, i) => (
          <div
            key={path}
            className="home-card"
            style={{ "--card-color": color, animationDelay: `${i * 0.1}s` }}
            onClick={() => navigate(path)}
          >
            <div className="home-card-icon">{icon}</div>
            <div className="home-card-body">
              <h3>{label}</h3>
              <p>{description}</p>
            </div>
            <span className="home-card-arrow">→</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default Home;