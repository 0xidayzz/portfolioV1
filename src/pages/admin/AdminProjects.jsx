import { useState, useEffect, useRef } from "react";
import {
  FaPlus, FaTrash, FaEdit, FaTimes, FaCheck,
  FaImage, FaGithub, FaExternalLinkAlt,
  FaChevronDown, FaChevronUp, FaHistory,
} from "react-icons/fa";
import { supabase } from "../../lib/supabase";
import { ICON_MAP, findIconByName, slugify } from "../../data/tags";

const PRESET_COLORS = [
  "#ab229f","#22ab2d","#f0b429","#61dafb","#3178c6",
  "#f05032","#5fa04e","#2496ed","#646cff","#06b6d4",
  "#e34f26","#ffca28","#3ecf8e","#47a248","#4169e1",
  "#888888","#ff6b6b","#ff922b","#cc5de8","#777bb4",
];

const UPDATE_TYPES = [
  { value: "feature", label: "✨ Nouvelle fonctionnalité", color: "#22ab2d" },
  { value: "update",  label: "🔄 Mise à jour",             color: "#2496ed" },
  { value: "fix",     label: "🐛 Correction de bug",       color: "#f05032" },
  { value: "release", label: "🚀 Release",                 color: "#ab229f" },
  { value: "wip",     label: "🚧 En cours",                color: "#f0b429" },
];

/* ── TAG BADGE ── */
function TagBadge({ tag }) {
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

/* ── FORMULAIRE UPDATE ── */
function UpdateForm({ projectId, initial, onSave, onCancel }) {
  const [title,   setTitle]   = useState(initial?.title   || "");
  const [content, setContent] = useState(initial?.content || "");
  const [type,    setType]    = useState(initial?.type    || "update");
  const [date,    setDate]    = useState(
    initial?.date || new Date().toISOString().split("T")[0]
  );
  const [error,  setError]  = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { setError("Le titre est requis."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        project_id: projectId,
        title:   title.trim(),
        content: content.trim() || null,
        type,
        date,
      };
      const { error: err } = initial
        ? await supabase.from("project_updates").update(payload).eq("id", initial.id)
        : await supabase.from("project_updates").insert(payload);
      if (err) throw err;
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="update-form">

      {/* TYPE */}
      <div className="field">
        <label>Type</label>
        <div className="update-type-picker">
          {UPDATE_TYPES.map(t => (
            <button
              key={t.value}
              className={`update-type-btn ${type === t.value ? "active" : ""}`}
              style={type === t.value ? { borderColor: t.color, color: t.color, background: t.color + "18" } : {}}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TITRE + DATE côte à côte */}
      <div className="update-form-row">
        <div className="field" style={{ flex: 1 }}>
          <label>Titre</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="ex: Ajout de l'authentification…"
            autoFocus
          />
        </div>
        <div className="field" style={{ flexShrink: 0 }}>
          <label>Date exacte</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* CONTENU */}
      <div className="field">
        <label>Description (optionnel)</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Décris ce qui a changé, ce qui a été ajouté ou corrigé…"
          rows={3}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="update-form-actions">
        <button className="btn-cancel" onClick={onCancel}>Annuler</button>
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          <FaCheck /> {saving ? "Enregistrement…" : initial ? "Modifier" : "Ajouter"}
        </button>
      </div>
    </div>
  );
}

/* ── SECTION UPDATES D'UN PROJET ── */
function ProjectUpdatesSection({ project }) {
  const [updates,   setUpdates]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [collapsed, setCollapsed] = useState(true);

  const fetchUpdates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("project_updates")
      .select("*")
      .eq("project_id", project.id)
      .order("date", { ascending: false });
    setUpdates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!collapsed) fetchUpdates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette mise à jour ?")) return;
    await supabase.from("project_updates").delete().eq("id", id);
    fetchUpdates();
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchUpdates();
  };

  const getType = (value) => UPDATE_TYPES.find(t => t.value === value) || UPDATE_TYPES[1];

  return (
    <div className="project-updates-section">

      {/* TOGGLE */}
      <button
        className="updates-toggle"
        onClick={() => setCollapsed(!collapsed)}
      >
        <FaHistory style={{ fontSize: 13 }} />
        Suivi du projet
        {!collapsed && updates.length > 0 && (
          <span className="updates-count">{updates.length}</span>
        )}
        {collapsed ? <FaChevronDown style={{ marginLeft: "auto", fontSize: 11 }} />
                   : <FaChevronUp   style={{ marginLeft: "auto", fontSize: 11 }} />}
      </button>

      {!collapsed && (
        <div className="updates-body">

          {/* BOUTON AJOUTER */}
          {!showForm && (
            <button
              className="updates-add-btn"
              onClick={() => { setEditing(null); setShowForm(true); }}
            >
              <FaPlus /> Ajouter une mise à jour
            </button>
          )}

          {/* FORMULAIRE */}
          {showForm && (
            <UpdateForm
              projectId={project.id}
              initial={editing}
              onSave={handleSaved}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          {/* TIMELINE */}
          {loading ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "8px 0" }}>
              Chargement…
            </p>
          ) : updates.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "8px 0" }}>
              Aucune mise à jour. Commence à suivre ce projet !
            </p>
          ) : (
            <div className="updates-timeline">
              {updates.map((update, i) => {
                const t = getType(update.type);
                return (
                  <div key={update.id} className="update-item">

                    {/* LIGNE DE TIMELINE */}
                    <div className="update-timeline-line">
                      <div
                        className="update-dot"
                        style={{ background: t.color }}
                      />
                      {i < updates.length - 1 && <div className="update-line" />}
                    </div>

                    {/* CONTENU */}
                    <div className="update-content">
                      <div className="update-header">
                        <span
                          className="update-type-badge"
                          style={{ background: t.color + "20", color: t.color }}
                        >
                          {t.label}
                        </span>
                        <span className="update-date">
                          {new Date(update.date).toLocaleDateString("fr-FR", {
                            day:   "numeric",
                            month: "long",
                            year:  "numeric",
                          })}
                        </span>
                        <div className="update-actions">
                          <button
                            className="update-btn-edit"
                            onClick={() => { setEditing(update); setShowForm(true); }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="update-btn-delete"
                            onClick={() => handleDelete(update.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
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
  );
}

/* ── FORMULAIRE PROJET ── */
const EMPTY_PROJECT = {
  name: "", description: "", image_url: "",
  github_url: "", demo_url: "",
  date: new Date().toISOString().split("T")[0], // Changé pour supporter le type="date"
  tag_ids: [],
};

function ProjectForm({ initial, tags, onSave, onCancel }) {
  const [form,       setForm]       = useState(initial ? { ...initial } : { ...EMPTY_PROJECT });
  const [error,      setError]      = useState("");
  const [saving,     setSaving]     = useState(false);
  const [tagSearch,  setTagSearch]  = useState("");
  const [tagDropOpen, setTagDropOpen] = useState(false);
  const tagDropRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (tagDropRef.current && !tagDropRef.current.contains(e.target))
        setTagDropOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleTag = (id) => {
    set("tag_ids", form.tag_ids.includes(id)
      ? form.tag_ids.filter(t => t !== id)
      : [...form.tag_ids, id]
    );
  };

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Le nom du projet est requis."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        image_url:   form.image_url?.trim()  || null,
        github_url:  form.github_url?.trim() || null,
        demo_url:    form.demo_url?.trim()   || null,
        date:        form.date?.trim()       || null,
        tag_ids:     form.tag_ids,
      };
      const { error: err } = initial
        ? await supabase.from("projects").update(payload).eq("id", initial.id)
        : await supabase.from("projects").insert(payload);
      if (err) throw err;
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="project-form-card">
      <div className="tag-form-header">
        <h3>{initial ? "Modifier le projet" : "Nouveau projet"}</h3>
        <button className="tag-form-close" onClick={onCancel}><FaTimes /></button>
      </div>

      <div className="project-form-grid">

        {/* GAUCHE */}
        <div className="project-form-left">
          <div className="field">
            <label>Nom du projet *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="ex: Portfolio, API REST…"
              autoFocus
            />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Décris ton projet en quelques lignes…"
              rows={4}
            />
          </div>

          {/* Champ Date de début intégré ici au lieu d'être perdu dans ProjectsTab */}
          <div className="field">
            <label>Date de début</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set("date", e.target.value)}
              style={{ maxWidth: 150 }}
            />
          </div>

          <div className="field">
            <label>Technologies utilisées</label>
            <div className="project-tag-selector" ref={tagDropRef}>
              <div
                className="project-tag-selected"
                onClick={() => setTagDropOpen(!tagDropOpen)}
              >
                {form.tag_ids.length === 0 ? (
                  <span className="project-tag-placeholder">
                    Cliquer pour ajouter des tags…
                  </span>
                ) : form.tag_ids.map(id => {
                  const tag = tags.find(t => t.id === id);
                  return tag ? (
                    <span
                      key={id}
                      className="tag"
                      style={{ "--tag-color": tag.color, cursor: "pointer" }}
                      onClick={e => { e.stopPropagation(); toggleTag(id); }}
                      title="Cliquer pour retirer"
                    >
                      {tag.icon && ICON_MAP[tag.icon]
                        ? (() => { const I = ICON_MAP[tag.icon]; return <I style={{ fontSize: 11 }} />; })()
                        : null
                      }
                      {tag.name}
                      <FaTimes style={{ fontSize: 9, marginLeft: 3 }} />
                    </span>
                  ) : null;
                })}
              </div>

              {tagDropOpen && (
                <div className="project-tag-dropdown">
                  <div className="project-tag-search">
                    <input
                      type="text"
                      value={tagSearch}
                      onChange={e => setTagSearch(e.target.value)}
                      placeholder="Rechercher un tag…"
                      onClick={e => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <div className="project-tag-list">
                    {filteredTags.map(tag => {
                      const Icon    = tag.icon ? ICON_MAP[tag.icon] : null;
                      const checked = form.tag_ids.includes(tag.id);
                      return (
                        <label
                          key={tag.id}
                          className={`filter-dropdown-item ${checked ? "checked" : ""}`}
                          style={{ "--tag-color": tag.color }}
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleTag(tag.id)}
                          />
                          <span className="fdi-icon">{Icon ? <Icon /> : null}</span>
                          <span className="fdi-name">{tag.name}</span>
                          {checked && <span className="fdi-check">✓</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DROITE */}
        <div className="project-form-right">
          <div className="field">
            <label>Image du projet</label>
            <input
              type="url"
              value={form.image_url}
              onChange={e => set("image_url", e.target.value)}
              placeholder="https://... (URL de l'image)"
            />
            {form.image_url && (
              <div className="project-img-preview">
                <img
                  src={form.image_url}
                  alt="aperçu"
                  onError={e => { e.target.style.display = "none"; }}
                />
              </div>
            )}
          </div>

          <div className="field">
            <label><FaGithub style={{ marginRight: 6 }} />GitHub</label>
            <input
              type="url"
              value={form.github_url}
              onChange={e => set("github_url", e.target.value)}
              placeholder="https://github.com/…"
            />
          </div>

          <div className="field">
            <label><FaExternalLinkAlt style={{ marginRight: 6 }} />Lien demo</label>
            <input
              type="url"
              value={form.demo_url}
              onChange={e => set("demo_url", e.target.value)}
              placeholder="https://… (optionnel)"
            />
          </div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="tag-form-actions">
        <button className="btn-cancel" onClick={onCancel}>Annuler</button>
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          <FaCheck /> {saving ? "Enregistrement…" : initial ? "Modifier" : "Créer"}
        </button>
      </div>
    </div>
  );
}

/* ── ONGLET PROJETS ── */
function ProjectsTab({ tags }) {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce projet et tout son historique ?")) return;
    await supabase.from("projects").delete().eq("id", id);
    fetchProjects();
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    fetchProjects();
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Projets</h2>
          <p>{projects.length} projet{projects.length > 1 ? "s" : ""}</p>
        </div>
        {!showForm && (
          <button
            className="admin-add-btn"
            onClick={() => { setEditing(null); setShowForm(true); }}
          >
            <FaPlus /> Nouveau projet
          </button>
        )}
      </div>

      {showForm && (
        <ProjectForm
          initial={editing}
          tags={tags}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      ) : projects.length === 0 ? (
        <div className="projects-admin-empty">
          <FaImage style={{ fontSize: 32, color: "var(--text-muted)", marginBottom: 12 }} />
          <p>Aucun projet. Crée-en un !</p>
        </div>
      ) : (
        <div className="projects-admin-list">
          {projects.map(project => (
            <div key={project.id} className="project-admin-card">

              {/* ROW PRINCIPALE */}
              <div className="project-admin-row">
                <div className="project-admin-img">
                  {project.image_url
                    ? <img src={project.image_url} alt={project.name} />
                    : <div className="project-admin-img-placeholder"><FaImage /></div>
                  }
                </div>

                <div className="project-admin-info">
                  <div className="project-admin-top">
                    <h3>{project.name}</h3>
                    {project.date && <span className="project-date">{project.date}</span>}
                  </div>
                  {project.description && (
                    <p className="project-admin-desc">{project.description}</p>
                  )}
                  <div className="project-admin-tags">
                    {(project.tag_ids || []).map(id => {
                      const tag = tags.find(t => t.id === id);
                      return tag ? <TagBadge key={id} tag={tag} /> : null;
                    })}
                  </div>
                  <div className="project-admin-links">
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noreferrer" className="project-admin-link">
                        <FaGithub /> GitHub
                      </a>
                    )}
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noreferrer" className="project-admin-link">
                        <FaExternalLinkAlt /> Demo
                      </a>
                    )}
                  </div>
                </div>

                <div className="tag-row-actions">
                  <button
                    className="tag-btn-edit"
                    onClick={() => { setEditing(project); setShowForm(true); }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="tag-btn-delete"
                    onClick={() => handleDelete(project.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* SECTION SUIVI — accordéon sous chaque projet */}
              <ProjectUpdatesSection project={project} />

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ONGLET TAGS ── */
function TagForm({ initial, onSave, onCancel, existingIds }) {
  const [name,    setName]    = useState(initial?.name      || "");
  const [color,   setColor]   = useState(initial?.color     || "#ab229f");
  const [iconKey, setIconKey] = useState(initial?.icon      || null);
  const [imgUrl,  setImgUrl]  = useState(initial?.image_url || "");
  const [showImg, setShowImg] = useState(false);
  const [error,   setError]   = useState("");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const found = findIconByName(name);
    setIconKey(found);
    setShowImg(false);
    setImgUrl("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const Icon    = iconKey ? ICON_MAP[iconKey] : null;
  const hasIcon = !!Icon;
  const id      = initial?.id || slugify(name);

  const handleSave = async () => {
    if (!name.trim()) { setError("Le nom est requis."); return; }
    if (!initial && existingIds.includes(id)) {
      setError("Un tag avec ce nom existe déjà.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        id,
        name:      name.trim(),
        color,
        icon:      iconKey || null,
        image_url: imgUrl  || null,
      };
      const { error: err } = initial
        ? await supabase.from("tags").update(payload).eq("id", initial.id)
        : await supabase.from("tags").insert(payload);
      if (err) throw err;
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tag-form-card">
      <div className="tag-form-header">
        <h3>{initial ? "Modifier le tag" : "Nouveau tag"}</h3>
        <button className="tag-form-close" onClick={onCancel}><FaTimes /></button>
      </div>

      <div className="field">
        <label>Nom de la technologie</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="ex: React, Docker, Python…"
          autoFocus
        />
      </div>

      <div className="field">
        <label>Couleur</label>
        <div className="color-picker">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              className={`color-dot ${color === c ? "selected" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="color-input-custom"
          />
        </div>
      </div>

      <div className="field">
        <label>Aperçu</label>
        <div className="tag-icon-preview">
          <div className="tag-preview">
            {name
              ? <TagBadge tag={{ name, color, icon: iconKey, image_url: imgUrl }} />
              : <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Tapez un nom…</span>
            }
          </div>
          {name && (
            <div className="icon-status">
              {hasIcon ? (
                <><span className="icon-status-dot found" />Logo reconnu : {iconKey}</>
              ) : (
                <>
                  <span className="icon-status-dot not-found" />
                  Logo non reconnu
                  <button className="icon-upload-toggle" onClick={() => setShowImg(!showImg)}>
                    <FaImage /> Ajouter une image
                  </button>
                </>
              )}
            </div>
          )}
          {showImg && !hasIcon && (
            <input
              type="url"
              value={imgUrl}
              onChange={e => setImgUrl(e.target.value)}
              placeholder="https://... URL de l'image"
              style={{ marginTop: 8 }}
            />
          )}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="tag-form-actions">
        <button className="btn-cancel" onClick={onCancel}>Annuler</button>
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          <FaCheck /> {saving ? "Enregistrement…" : initial ? "Modifier" : "Créer"}
        </button>
      </div>
    </div>
  );
}

function TagsTab() {
  const [tags,     setTags]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const fetchTags = async () => {
    setLoading(true);
    const { data } = await supabase.from("tags").select("*").order("name");
    setTags(data || []);
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTags(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce tag ?")) return;
    await supabase.from("tags").delete().eq("id", id);
    fetchTags();
  };

  return (
    <div className="admin-tags-page">
      <div className="admin-section-header">
        <div>
          <h2>Tags</h2>
          <p>{tags.length} tag{tags.length > 1 ? "s" : ""}</p>
        </div>
        {!showForm && (
          <button className="admin-add-btn" onClick={() => { setEditing(null); setShowForm(true); }}>
            <FaPlus /> Nouveau tag
          </button>
        )}
      </div>

      {showForm && (
        <TagForm
          initial={editing}
          existingIds={tags.map(t => t.id)}
          onSave={() => { setShowForm(false); setEditing(null); fetchTags(); }}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Chargement…</p>
      ) : tags.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Aucun tag.</p>
      ) : (
        <div className="tags-list">
          {tags.map(tag => {
            const Icon = tag.icon ? ICON_MAP[tag.icon] : null;
            return (
              <div key={tag.id} className="tag-row">
                <div className="tag-row-left">
                  <div className="tag-row-icon" style={{ background: tag.color + "22", color: tag.color }}>
                    {Icon
                      ? <Icon />
                      : tag.image_url
                        ? <img src={tag.image_url} style={{ width: 20, height: 20, objectFit: "contain" }} alt="" />
                        : "?"
                    }
                  </div>
                  <div>
                    <TagBadge tag={tag} />
                    <span className="tag-id">#{tag.id}</span>
                  </div>
                </div>
                <div className="tag-row-actions">
                  <button className="tag-btn-edit" onClick={() => { setEditing(tag); setShowForm(true); }}>
                    <FaEdit />
                  </button>
                  <button className="tag-btn-delete" onClick={() => handleDelete(tag.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── COMPOSANT PRINCIPAL ── */
function AdminProjects() {
  const [tab,  setTab]  = useState("projects");
  const [tags, setTags] = useState([]);

  useEffect(() => {
    supabase.from("tags").select("*").order("name")
      .then(({ data }) => setTags(data || []));
  }, []);

  return (
    <div className="admin-projects-page">
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}>
          Projets
        </button>
        <button className={`admin-tab ${tab === "tags" ? "active" : ""}`} onClick={() => setTab("tags")}>
          Tags
        </button>
      </div>
      {tab === "projects" && <ProjectsTab tags={tags} />}
      {tab === "tags"     && <TagsTab />}
    </div>
  );
}

export default AdminProjects;