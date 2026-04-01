import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaTimes, FaCheck } from "react-icons/fa";
import { loadTags, saveTags, ICON_MAP, ICON_OPTIONS } from "../../data/tags";

const PRESET_COLORS = [
  "#ab229f", "#22ab2d", "#f0b429", "#61dafb", "#3178c6",
  "#f05032", "#5fa04e", "#2496ed", "#646cff", "#06b6d4",
  "#e34f26", "#1572b6", "#ffca28", "#3ecf8e", "#47a248",
  "#4169e1", "#888888", "#ff6b6b", "#ff922b", "#cc5de8",
];

function AdminTags() {
  const [tags,     setTags]     = useState([]);
  const [editing,  setEditing]  = useState(null); // id du tag en cours d'édition
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ id: "", name: "", color: "#ab229f", icon: "SiReact" });
  const [error,    setError]    = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setTags(loadTags()); }, []);

  const persist = (newTags) => {
    setTags(newTags);
    saveTags(newTags);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ id: "", name: "", color: "#ab229f", icon: "SiReact" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (tag) => {
    setEditing(tag.id);
    setForm({ ...tag });
    setError("");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setError("Le nom est requis."); return; }

    // Génère un id à partir du nom si création
    const id = editing || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    if (!editing && tags.find(t => t.id === id)) {
      setError("Un tag avec ce nom existe déjà.");
      return;
    }

    const newTag = { ...form, id };
    const newTags = editing
      ? tags.map(t => t.id === editing ? newTag : t)
      : [...tags, newTag];

    persist(newTags);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer ce tag ?")) return;
    persist(tags.filter(t => t.id !== id));
  };

  return (
    <div className="admin-tags-page">

      {/* HEADER */}
      <div className="admin-section-header">
        <div>
          <h2>Tags</h2>
          <p>{tags.length} tag{tags.length > 1 ? "s" : ""} configuré{tags.length > 1 ? "s" : ""}</p>
        </div>
        <button className="admin-add-btn" onClick={openCreate}>
          <FaPlus /> Nouveau tag
        </button>
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div className="tag-form-card">
          <div className="tag-form-header">
            <h3>{editing ? "Modifier le tag" : "Nouveau tag"}</h3>
            <button className="tag-form-close" onClick={() => setShowForm(false)}>
              <FaTimes />
            </button>
          </div>

          {/* NOM */}
          <div className="field">
            <label>Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="ex: React"
            />
          </div>

          {/* COULEUR */}
          <div className="field">
            <label>Couleur</label>
            <div className="color-picker">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  className={`color-dot ${form.color === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                className="color-input-custom"
                title="Couleur personnalisée"
              />
            </div>
          </div>

          {/* ICÔNE */}
          <div className="field">
            <label>Icône</label>
            <div className="icon-picker">
              {ICON_OPTIONS.map(iconKey => {
                const Icon = ICON_MAP[iconKey];
                return (
                  <button
                    key={iconKey}
                    className={`icon-dot ${form.icon === iconKey ? "selected" : ""}`}
                    style={form.icon === iconKey ? { background: form.color + "33", color: form.color, borderColor: form.color } : {}}
                    onClick={() => setForm({ ...form, icon: iconKey })}
                    title={iconKey}
                  >
                    <Icon />
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREVIEW */}
          <div className="field">
            <label>Aperçu</label>
            <div className="tag-preview">
              <span className="tag" style={{ "--tag-color": form.color }}>
                {ICON_MAP[form.icon] && (() => {
                  const Icon = ICON_MAP[form.icon];
                  return <Icon style={{ fontSize: 11 }} />;
                })()}
                {form.name || "Aperçu"}
              </span>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="tag-form-actions">
            <button className="btn-cancel" onClick={() => setShowForm(false)}>Annuler</button>
            <button className="btn-save" onClick={handleSave}>
              <FaCheck /> {editing ? "Modifier" : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* LISTE DES TAGS */}
      <div className="tags-list">
        {tags.map(tag => {
          const Icon = ICON_MAP[tag.icon];
          return (
            <div key={tag.id} className="tag-row">
              <div className="tag-row-left">
                <div className="tag-row-icon" style={{ background: tag.color + "22", color: tag.color }}>
                  {Icon && <Icon />}
                </div>
                <div>
                  <span
                    className="tag"
                    style={{ "--tag-color": tag.color }}
                  >
                    {Icon && <Icon style={{ fontSize: 11 }} />}
                    {tag.name}
                  </span>
                  <span className="tag-id">#{tag.id}</span>
                </div>
              </div>
              <div className="tag-row-actions">
                <button className="tag-btn-edit" onClick={() => openEdit(tag)}>
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

    </div>
  );
}

export default AdminTags;