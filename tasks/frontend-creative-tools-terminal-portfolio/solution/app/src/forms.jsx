import { useState } from 'preact/hooks';
import * as v from 'valibot';
import { projects, identity, skills } from './store.js';

export const ProjectSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  slug: v.pipe(
    v.string(),
    v.minLength(1, "Slug is required"),
    v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters and numbers separated by single hyphens")
  ),
  year: v.pipe(
    v.number(),
    v.minValue(2000, "Year must be >= 2000"),
    v.maxValue(2100, "Year must be <= 2100")
  ),
  type: v.pipe(v.string(), v.minLength(1, "Type is required")),
  summary: v.pipe(
    v.string(),
    v.minLength(1, "Summary is required"),
    v.maxLength(280, "Summary must be at most 280 characters")
  ),
  status: v.picklist(["shipped", "wip", "archived"], "Invalid status"),
  featured: v.boolean(),
  tags: v.array(v.string())
});

export const SkillSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required"), v.maxLength(40, "Name must be at most 40 characters")),
  prof: v.pipe(
    v.number(),
    v.integer("Proficiency must be a whole number"),
    v.minValue(0, "Proficiency must be >= 0"),
    v.maxValue(100, "Proficiency must be <= 100")
  )
});

export const IdentitySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  role: v.string(),
  location: v.string(),
  email: v.pipe(v.string(), v.email("Invalid email")),
  phone: v.string(),
  agencyName: v.string(),
  agencyUrl: v.string(),
  about: v.string()
});

export function ProjectForm({ project, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    project || { name: '', slug: '', year: new Date().getFullYear(), type: '', summary: '', status: 'shipped', featured: false, tags: [] }
  );
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalVal = value;
    if (type === 'checkbox') finalVal = checked;
    if (name === 'year') finalVal = parseInt(value, 10) || 0;
    if (name === 'tags') finalVal = value.split(',').map(s => s.trim()).filter(Boolean);

    setFormData({ ...formData, [name]: finalVal });

    // Clear field error
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = v.safeParse(ProjectSchema, formData);

    if (result.success) {
      const slugTaken = projects.value.some(p => p.slug === result.output.slug && p.slug !== project?.slug);
      if (slugTaken) {
        setErrors({ slug: "A project with this slug already exists" });
        return;
      }

      if (result.output.featured) {
        const featuredCount = projects.value.filter(p => p.featured && p.slug !== project?.slug).length;
        if (featuredCount >= 3) {
          setErrors({ featured: "Maximum 3 featured projects allowed" });
          return;
        }
      }

      onSubmit(result.output, project?.slug);
    } else {
      const fieldErrors = {};
      result.issues.forEach(issue => {
        const fieldName = issue.path[0].key;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-base-200 rounded-lg">
      <h3 className="font-bold text-lg mb-2">{project ? 'Edit Project' : 'New Project'}</h3>

      <div className="form-control">
        <label className="label" htmlFor="name"><span className="label-text">Name</span></label>
        <input id="name" name="name" type="text" className={`input input-sm input-bordered ${errors.name ? 'input-error' : ''}`} value={formData.name} onChange={handleChange} />
        {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
      </div>

      <div className="form-control">
        <label className="label" htmlFor="slug"><span className="label-text">Slug</span></label>
        <input id="slug" name="slug" type="text" className={`input input-sm input-bordered ${errors.slug ? 'input-error' : ''}`} value={formData.slug} onChange={handleChange} />
        {errors.slug && <span className="text-error text-xs mt-1">{errors.slug}</span>}
      </div>

      <div className="flex gap-4">
        <div className="form-control flex-1">
          <label className="label" htmlFor="year"><span className="label-text">Year</span></label>
          <input id="year" name="year" type="number" className={`input input-sm input-bordered ${errors.year ? 'input-error' : ''}`} value={formData.year} onChange={handleChange} />
          {errors.year && <span className="text-error text-xs mt-1">{errors.year}</span>}
        </div>
        <div className="form-control flex-1">
          <label className="label" htmlFor="status"><span className="label-text">Status</span></label>
          <select id="status" name="status" className={`select select-sm select-bordered ${errors.status ? 'select-error' : ''}`} value={formData.status} onChange={handleChange}>
            <option value="shipped">Shipped</option>
            <option value="wip">WIP</option>
            <option value="archived">Archived</option>
          </select>
          {errors.status && <span className="text-error text-xs mt-1">{errors.status}</span>}
        </div>
      </div>

      <div className="form-control">
        <label className="label" htmlFor="type"><span className="label-text">Type</span></label>
        <input id="type" name="type" type="text" className={`input input-sm input-bordered ${errors.type ? 'input-error' : ''}`} value={formData.type} onChange={handleChange} />
        {errors.type && <span className="text-error text-xs mt-1">{errors.type}</span>}
      </div>

      <div className="form-control">
        <label className="label" htmlFor="tags"><span className="label-text">Tags (comma separated)</span></label>
        <input id="tags" name="tags" type="text" className="input input-sm input-bordered" value={formData.tags.join(', ')} onChange={handleChange} />
      </div>

      <div className="form-control">
        <label className="label" htmlFor="summary"><span className="label-text">Summary</span></label>
        <textarea id="summary" name="summary" className={`textarea textarea-bordered ${errors.summary ? 'textarea-error' : ''}`} value={formData.summary} onChange={handleChange}></textarea>
        {errors.summary && <span className="text-error text-xs mt-1">{errors.summary}</span>}
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4" htmlFor="featured">
          <span className="label-text">Featured Pin</span>
          <input id="featured" type="checkbox" name="featured" className="checkbox checkbox-primary" checked={formData.featured} onChange={handleChange} />
        </label>
        {errors.featured && <span className="text-error text-xs mt-1">{errors.featured}</span>}
      </div>

      <div className="flex gap-2 mt-4">
        <button type="submit" className="btn btn-primary btn-sm">Save</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export function ConfigStudio() {
  const [formData, setFormData] = useState(identity.value);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = v.safeParse(IdentitySchema, formData);
    if (result.success) {
      identity.value = result.output;
      alert('Identity saved!');
    } else {
      const fieldErrors = {};
      result.issues.forEach(issue => {
        const fieldName = issue.path[0].key;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setErrors(fieldErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-base-200 rounded-lg">
      <h3 className="font-bold text-lg mb-2">Identity Configuration</h3>
      {['name', 'role', 'location', 'email', 'phone', 'agencyName', 'agencyUrl'].map(field => (
        <div key={field} className="form-control">
          <label className="label" htmlFor={field}><span className="label-text capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span></label>
          <input id={field} name={field} type="text" className={`input input-sm input-bordered ${errors[field] ? 'input-error' : ''}`} value={formData[field]} onChange={handleChange} />
          {errors[field] && <span className="text-error text-xs mt-1">{errors[field]}</span>}
        </div>
      ))}
      <div className="form-control">
        <label className="label" htmlFor="about"><span className="label-text">About</span></label>
        <textarea id="about" name="about" className={`textarea textarea-bordered h-24 ${errors.about ? 'textarea-error' : ''}`} value={formData.about} onChange={handleChange}></textarea>
        {errors.about && <span className="text-error text-xs mt-1">{errors.about}</span>}
      </div>
      <button type="submit" className="btn btn-primary btn-sm mt-4">Save Identity</button>
    </form>
  );
}

export function SkillsEditor() {
  const [rows, setRows] = useState(skills.value.map(s => ({ ...s })));
  const [errors, setErrors] = useState({});

  const updateRow = (idx, field, value) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (field === 'prof') return { ...row, prof: parseInt(value, 10) || 0 };
      return { ...row, [field]: value };
    }));
    if (errors[idx]) {
      setErrors({ ...errors, [idx]: undefined });
    }
  };

  const addRow = () => setRows(prev => [...prev, { name: '', prof: 0 }]);
  const removeRow = (idx) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
    setErrors(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fieldErrors = {};
    const seenNames = new Set();

    rows.forEach((row, idx) => {
      const result = v.safeParse(SkillSchema, row);
      if (!result.success) {
        fieldErrors[idx] = result.issues[0].message;
        return;
      }
      const key = result.output.name.toLowerCase();
      if (seenNames.has(key)) {
        fieldErrors[idx] = "Skill name must be unique";
        return;
      }
      seenNames.add(key);
    });

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    skills.value = rows.map(row => ({ name: row.name, prof: row.prof }));
    setErrors({});
    alert('Skills saved!');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 bg-base-200 rounded-lg mt-4">
      <h3 className="font-bold text-lg mb-2">Skills</h3>
      {rows.length === 0 && <p className="text-sm opacity-60 italic">No skills yet. Add one below.</p>}
      {rows.map((row, idx) => (
        <div key={idx} className="flex gap-2 items-end">
          <div className="form-control flex-1">
            <label className="label" htmlFor={`skill-name-${idx}`}><span className="label-text">Name</span></label>
            <input
              id={`skill-name-${idx}`}
              type="text"
              className={`input input-sm input-bordered ${errors[idx] ? 'input-error' : ''}`}
              value={row.name}
              onChange={e => updateRow(idx, 'name', e.target.value)}
            />
          </div>
          <div className="form-control w-28">
            <label className="label" htmlFor={`skill-prof-${idx}`}><span className="label-text">Proficiency</span></label>
            <input
              id={`skill-prof-${idx}`}
              type="number"
              min="0"
              max="100"
              className={`input input-sm input-bordered ${errors[idx] ? 'input-error' : ''}`}
              value={row.prof}
              onChange={e => updateRow(idx, 'prof', e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-xs btn-square btn-ghost text-error"
            onClick={() => removeRow(idx)}
            aria-label={`Remove skill ${row.name || idx + 1}`}
          >
            &#x2715;
          </button>
          {errors[idx] && <span className="text-error text-xs w-full">{errors[idx]}</span>}
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-sm self-start" onClick={addRow}>+ Add Skill</button>
      <button type="submit" className="btn btn-primary btn-sm mt-2">Save Skills</button>
    </form>
  );
}
