import { useEffect, useId, useState } from "react";
import { useAtom } from "jotai";
import { categoriesAtom, activeFilterAtom, addCategoryAtom, deleteCategoryAtom } from "../store";

export default function CategoryFilter() {
  const [categories] = useAtom(categoriesAtom);
  const [activeFilter, setActiveFilter] = useAtom(activeFilterAtom);
  const [, addCategory] = useAtom(addCategoryAtom);
  const [, delCategory] = useAtom(deleteCategoryAtom);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [nameError, setNameError] = useState("");
  const inputId = useId();

  const closeAddForm = () => {
    setShowAdd(false);
    setNewName("");
    setNameError("");
  };

  useEffect(() => {
    if (!showAdd) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAddForm();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAdd]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setNameError("name must be non-empty");
      return;
    }
    if (trimmed.length > 40) {
      setNameError("name must be 40 characters or fewer");
      return;
    }
    addCategory(trimmed);
    closeAddForm();
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => setActiveFilter(null)}
        aria-pressed={activeFilter === null}
        className={`btn-chip ${activeFilter === null ? "btn-chip-active" : ""}`}
        data-action="filter"
        data-category-id=""
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => setActiveFilter(cat.id)}
          aria-pressed={activeFilter === cat.id}
          className={`btn-chip ${activeFilter === cat.id ? "btn-chip-active" : ""}`}
          data-action="filter"
          data-category-id={cat.id}
        >
          {cat.name}
        </button>
      ))}

      <button
        type="button"
        onClick={() => {
          setShowAdd(!showAdd);
          setShowManage(false);
        }}
        className="btn-secondary px-4 py-2 text-sm font-medium"
        data-action="add-category-toggle"
      >
        + Category
      </button>

      {categories.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setShowManage(!showManage);
            setShowAdd(false);
          }}
          className="btn-icon"
          aria-label="Manage categories"
          title="Manage categories"
        >
          ⚙️
        </button>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="w-full mt-2 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-[#1B2430] mb-1">
              Category name
            </label>
            <input
              id={inputId}
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (nameError && e.target.value.trim()) setNameError("");
              }}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#1B2430] outline-none focus:border-[#0F9D74] min-h-12"
              autoFocus
              data-field="category-name"
            />
            {nameError && (
              <p className="text-[#EF4444] text-xs mt-1" role="alert" id={`${inputId}-error`}>
                {nameError}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary px-4 py-2 text-sm font-medium" data-action="add-category-submit">
              Add
            </button>
            <button
              type="button"
              onClick={closeAddForm}
              className="btn-secondary px-4 py-2 text-sm font-medium"
              data-action="add-category-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showManage && (
        <div className="w-full mt-2 bg-[#FFFFFF] rounded-lg p-3 border border-[#E2E8F0]">
          <p className="text-xs text-[#475569] mb-2">Manage categories:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-1 bg-[#F4F7F6] px-2 py-1 rounded-lg">
                <span className="text-sm text-[#1B2430]">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => delCategory(cat.id)}
                  className="text-[#EF4444] text-xs hover:text-red-600 ml-1"
                  aria-label={`Delete category ${cat.name}`}
                  title="Delete category"
                  data-action="delete-category"
                  data-category-id={cat.id}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
