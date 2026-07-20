import { useState } from 'preact/hooks';
import * as v from 'valibot';
import { projects, identity } from './store.js';

export const ProjectSchema = v.object({
  name: v.string([v.minLength(1, "Name is required")]),
  slug: v.string([
    v.minLength(1, "Slug is required"),
    v.regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
  ]),
  year: v.number([
    v.minValue(2000, "Year must be >= 2000"),
    v.maxValue(2100, "Year must be <= 2100")
  ]),
  type: v.string([v.minLength(1, "Type is required")]),
  desc: v.string([v.minLength(1, "Description is required")]),
  status: v.picklist(["shipped", "wip", "archived"], "Invalid status"),
  featured: v.boolean(),
  tags: v.array(v.string())
});

export const IdentitySchema = v.object({
  name: v.string([v.minLength(1, "Name is required")]),
  role: v.string(),
  location: v.string(),
  email: v.string([v.email("Invalid email")]),
  phone: v.string(),
  agencyName: v.string(),
  agencyUrl: v.string(),
  about: v.string()
});

export function ProjectForm({ project, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    project || { name: '', slug: '', year: new Date().getFullYear(), type: '', desc: '', status: 'shipped', featured: false, tags: [] }
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
      if (result.output.featured) {
        const featuredCount = projects.value.filter(p => p.featured && p.slug !== result.output.slug).length;
        if (featuredCount >= 3) {
          setErrors({ featured: "Maximum 3 featured projects allowed" });
          return;
        }
      }

      onSubmit(result.output);
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
        <label className="label" htmlFor="desc"><span className="label-text">Description</span></label>
        <textarea id="desc" name="desc" className={`textarea textarea-bordered ${errors.desc ? 'textarea-error' : ''}`} value={formData.desc} onChange={handleChange}></textarea>
        {errors.desc && <span className="text-error text-xs mt-1">{errors.desc}</span>}
      </div>

      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <span className="label-text">Featured Pin</span>
          <input type="checkbox" name="featured" className="checkbox checkbox-primary" checked={formData.featured} onChange={handleChange} />
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
