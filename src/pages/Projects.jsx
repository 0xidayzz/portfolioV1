import { useState, useEffect, useRef } from "react";
import {
  FaGithub, FaExternalLinkAlt, FaTimes,
  FaSearch, FaFilter, FaHistory, FaSort,
} from "react-icons/fa";
import { supabase } from "../lib/supabase";
import { ICON_MAP } from "../data/tags";

const UPDATE_TYPES = [
  { value: "feature", label: "✨ Nouvelle fonctionnalité", color: "#22ab2d" },
  { value: "update",  label: "🔄 Mise à jour",             color: "#2496ed" },
  { value: "fix",     label: "🐛 Correction de bug",       color: "#f05032" },
  { value: "release", label: "🚀 Release",                 color: "#ab229f" },
  { value: "wip",     label: "🚧 En cours",                color: "#f0b429" },
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Plus récent d'abord"     },
  { value: "created_asc",  label: "Plus ancien d'abord"     },
  { value: "date_desc",    label: "Date projet ↓"           },
  { value: "date_asc",     label: "Date projet ↑"           },
  { value: "update_desc",  label: "Dernière mise à jour ↓"  },
  { value: "update_asc",   label: "Dernière mise à jour ↑"  },
  { value: "name_asc",     label: "Nom A → Z"               },
  { value: "name_desc",    label: "Nom Z → A"               },
];

/* ── HELPER DATE ── */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

/* ── TAG BADGE ── */
function TagBadge({ tagId, tags }) {
  const tag = tags.find(t => t.id === tagId);
  if (!tag) return null;
  const Icon = tag.icon ? ICON_MAP[tag.icon] : null;
  return (
    <span className="tag" style={{ "--tag-color": tag.color }}>
      {Icon
        ? <Icon style={{ fontSize: 11 }} />
        : tag.image_url
          ? <img src={tag.image_url} style={{ width: 11, height: 11, objectFit: "contain" }} alt="" />
          : null
      }
      {tag.name}
    </span>
  );
}

/* ── MODALE ── */
function Modal({ project, onClose, tags }) {
  const [updates,        setUpdates]        = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);

  useEffect(() => {
    if (!project) return;
    setLoadingUpdates(true);
    supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", project.id)
      .order("date", { ascending: false })
      .then(({ data }) => {
        setUpdates(data || []);
        setLoadingUpdates(false);
      });
  }, [project]);

  if (!project) return null;

  const getType = (value) =>
    UPDATE_TYPES.find(t => t.value === value) || UPDATE_TYPES[1];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-large" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><FaTimes /></button>

        {project.image_url && (
          <img src={project.image_url} alt={project.name} className="modal-img" />
        )}

        <div className="modal-body">
          <div className="modal-project-header">
            <div>
              <h2>{project.name}</h2>
              {project.date && (
                <p className="modal-date">Débuté le {formatDate(project.date)}</p>
              )}
            </div>
            <div className="modal-actions">
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noreferrer" className="modal-btn modal-btn-ghost">
                  <FaGithub /> GitHub
                </a>
              )}
              {project.demo_url && (
                <a href={project.demo_url} target="_blank" rel="noreferrer" className="modal-btn modal-btn-accent">
                  <FaExternalLinkAlt /> Voir le projet
                </a>
              )}
            </div>
          </div>

          {(project.tag_ids || []).length > 0 && (
            <div className="modal-tags">
              {project.tag_ids.map(id => (
                <TagBadge key={id} tagId={id} tags={tags} />
              ))}
            </div>
          )}

          {project.description && (
            <p className="modal-desc">{project.description}</p>
          )}

          {/* TIMELINE */}
          {(loadingUpdates || updates.length > 0) && (
            <div className="modal-timeline">
              <div className="modal-timeline-header">
                <FaHistory style={{ fontSize: 13 }} />
                Historique du projet
                {updates.length > 0 && (
                  <span className="updates-count">{updates.length}</span>
                )}
              </div>

              {loadingUpdates ? (
                <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement…</p>
              ) : (
                <div className="updates-timeline">
                  {updates.map((update, i) => {
                    const t = getType(update.type);
                    return (
                      <div key={update.id} className="update-item">
                        <div className="update-timeline-line">
                          <div className="update-dot" style={{ background: t.color }} />
                          {i < updates.length - 1 && <div className="update-line" />}
                        </div>
                        <div className="update-content">
                          <div className="update-header">
                            <span
                              className="update-type-badge"
                              style={{ background: t.color + "20", color: t.color }}
                            >
                              {t.label}
                            </span>
                            <span className="update-date">
                              {formatDate(update.date)}
                            </span>
                          </div>
                          <p className="update-title">{update.title}</p>
                          {update.content && (
                            <p className="update-desc">{update.content}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── PAGE PROJETS ── */
function Projects() {
  const [projects,      setProjects]      = useState([]);
  const [tags,          setTags]          = useState([]);
  const [latestUpdates, setLatestUpdates] = useState({}); 
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [activeTagIds,  setActiveTagIds]  = useState([]);
  const [sortBy,        setSortBy]        = useState("created_desc");
  const [selected,      setSelected]      = useState(null);
  const [dropOpen,      setDropOpen]      = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);
  const dropRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    Promise.all([
      supabase.from("projects").select("*"),
      supabase.from("tags").select("*").order("name"),
      supabase
        .from("project_updates")
        .select("project_id, date")
        .order("date", { ascending: false }),
    ]).then(([{ data: p }, { data: t }, { data: u }]) => {
      setProjects(p || []);
      setTags(t || []);

      const map = {};
      (u || []).forEach(upd => {
        if (!map[upd.project_id]) map[upd.project_id] = upd.date;
      });
      setLatestUpdates(map);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleTag = (id) =>
    setActiveTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );

  const clearFilters = () => { setActiveTagIds([]); setSearch(""); };

  const usedTagIds = [...new Set(projects.flatMap(p => p.tag_ids || []))];
  const usedTags   = tags.filter(t => usedTagIds.includes(t.id));

  // ── FILTRAGE SÉCURISÉ ──
  const filtered = projects.filter(p => {
    const searchLow = search.toLowerCase().trim();
    const matchSearch = searchLow === ""
      // On ajoute un fallback || "" pour éviter les crashs si p.name ou p.description est null
      || (p.name || "").toLowerCase().includes(searchLow)
      || (p.description || "").toLowerCase().includes(searchLow)
      || (p.tag_ids || []).some(id => {
          const tag = tags.find(t => t.id === id);
          // On sécurise tag?.name || "" avant le toLowerCase()
          return (tag?.name || "").toLowerCase().includes(searchLow);
        });

    const matchTags = activeTagIds.length === 0
      || activeTagIds.every(id => (p.tag_ids || []).includes(id));

    return matchSearch && matchTags;
  });

  // ── TRI SÉCURISÉ ──
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "created_desc":
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      case "created_asc":
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      case "date_desc":
        return new Date(b.date || 0) - new Date(a.date || 0);
      case "date_asc":
        return new Date(a.date || 0) - new Date(b.date || 0);
      case "update_desc":
        return new Date(latestUpdates[b.id] || 0) - new Date(latestUpdates[a.id] || 0);
      case "update_asc":
        return new Date(latestUpdates[a.id] || 0) - new Date(latestUpdates[b.id] || 0);
      case "name_asc":
        // Fallback pour localeCompare si un nom de projet manque
        return (a.name || "").localeCompare(b.name || "", "fr");
      case "name_desc":
        return (b.name || "").localeCompare(a.name || "", "fr");
      default:
        return 0;
    }
  });

  const hasFilters  = activeTagIds.length > 0 || search !== "";
  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy);

  if (loading) return (
    <div className="projects-page">
      <div className="projects-loading">
        <div className="projects-loading-spinner" />
        <p>Chargement des projets…</p>
      </div>
    </div>
  );

  return (
    <div className="projects-page">

      {/* HEADER */}
      <div className="projects-header">
        <h1>Projets</h1>
        <p className="projects-subtitle">
          {sorted.length} projet{sorted.length > 1 ? "s" : ""}
          {hasFilters && (
            <button className="clear-filters" onClick={clearFilters}>
              Réinitialiser
            </button>
          )}
        </p>
      </div>

      {/* CONTRÔLES */}
      <div className="projects-controls">
        <div className="search-row">

          {/* RECHERCHE */}
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un projet, langage…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>
                <FaTimes />
              </button>
            )}
          </div>

          {/* FILTRE TAGS */}
          <div className="filter-dropdown-wrapper" ref={dropRef}>
            <button
              className={`filter-drop-btn ${dropOpen ? "active" : ""} ${activeTagIds.length > 0 ? "has-filters" : ""}`}
              onClick={() => { setDropOpen(!dropOpen); setSortOpen(false); }}
            >
              <FaFilter />
              Filtrer
              {activeTagIds.length > 0 && (
                <span className="filter-count">{activeTagIds.length}</span>
              )}
            </button>

            {dropOpen && (
              <div className="filter-dropdown">
                <div className="filter-dropdown-header">
                  <span>Technologies</span>
                  {activeTagIds.length > 0 && (
                    <button onClick={() => setActiveTagIds([])}>Tout effacer</button>
                  )}
                </div>
                <div className="filter-dropdown-list">
                  {usedTags.length === 0 ? (
                    <p style={{ padding: "8px 10px", color: "var(--text-muted)", fontSize: 13 }}>
                      Aucun tag configuré
                    </p>
                  ) : usedTags.map(tag => {
                    const Icon    = tag.icon ? ICON_MAP[tag.icon] : null;
                    const checked = activeTagIds.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        className={`filter-dropdown-item ${checked ? "checked" : ""}`}
                        style={{ "--tag-color": tag.color }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTag(tag.id)}
                        />
                        <span className="fdi-icon">
                          {Icon
                            ? <Icon />
                            : tag.image_url
                              ? <img src={tag.image_url} style={{ width: 16, height: 16 }} alt="" />
                              : null
                          }
                        </span>
                        <span className="fdi-name">{tag.name}</span>
                        {checked && <span className="fdi-check">✓</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TRI */}
          <div className="filter-dropdown-wrapper" ref={sortRef}>
            <button
              className={`filter-drop-btn ${sortOpen ? "active" : ""} ${sortBy !== "created_desc" ? "has-filters" : ""}`}
              onClick={() => { setSortOpen(!sortOpen); setDropOpen(false); }}
            >
              <FaSort />
              {currentSort?.label}
            </button>

            {sortOpen && (
              <div className="filter-dropdown sort-dropdown">
                <div className="filter-dropdown-header">
                  <span>Trier par</span>
                </div>
                <div className="filter-dropdown-list">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`sort-option ${sortBy === opt.value ? "active" : ""}`}
                      onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    >
                      {opt.label}
                      {sortBy === opt.value && <span className="fdi-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* TAGS ACTIFS */}
        {activeTagIds.length > 0 && (
          <div className="active-filters">
            {activeTagIds.map(id => {
              const tag  = tags.find(t => t.id === id);
              const Icon = tag?.icon ? ICON_MAP[tag.icon] : null;
              return tag ? (
                <span
                  key={id}
                  className="active-filter-tag"
                  style={{ "--tag-color": tag.color }}
                  onClick={() => toggleTag(id)}
                >
                  {Icon && <Icon style={{ fontSize: 11 }} />}
                  {tag.name}
                  <FaTimes style={{ fontSize: 9 }} />
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* GRILLE */}
      {projects.length === 0 ? (
        <div className="projects-empty-state">
          <p>Aucun projet pour l'instant.</p>
          <span>Reviens bientôt !</span>
        </div>
      ) : sorted.length === 0 ? (
        <p className="projects-empty">Aucun projet ne correspond à ta recherche.</p>
      ) : (
        <div className="projects-grid">
          {sorted.map(project => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => setSelected(project)}
            >
              <div className="project-card-img">
                {project.image_url
                  ? <img src={project.image_url} alt={project.name} />
                  : <div className="project-card-img-placeholder"><FaExternalLinkAlt /></div>
                }
              </div>
              <div className="project-card-body">
                <div className="project-card-top">
                  <h3>{project.name}</h3>
                  {project.date && (
                    <span className="project-date">{formatDate(project.date)}</span>
                  )}
                </div>
                <div className="project-tags">
                  {(project.tag_ids || []).map(id => (
                    <TagBadge key={id} tagId={id} tags={tags} />
                  ))}
                </div>
                {/* Dernière mise à jour */}
                {latestUpdates[project.id] && (
                  <p className="project-last-update">
                    <FaHistory style={{ fontSize: 10 }} />
                    Mis à jour le {formatDate(latestUpdates[project.id])}
                  </p>
                )}
                <button className="project-card-btn">Voir plus →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal project={selected} onClose={() => setSelected(null)} tags={tags} />
    </div>
  );
}

export default Projects;