import re

with open('src/App.jsx', 'r') as f:
    app = f.read()

# The global keyboard listener works when a card has focus.
# Ensure the TriageCard properly takes focus and accepts keydown when active.
# We also need to add an explicit `onKeyDown` to the `triage-card` article directly to ensure it works independent of the global listener.
old_article = '''<article
  className="triage-card"
  tabIndex={0}
  data-repo={item.repo}
  data-pr-number={item.pr.number}
  onKeyDown={(e) => {
    if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      triage(item.repo, item.pr.number, 'accepted');
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      triage(item.repo, item.pr.number, 'rejected', 'too-few-files');
    }
  }}
>'''
new_article = '''<article
  className="triage-card"
  tabIndex={0}
  data-repo={item.repo}
  data-pr-number={item.pr.number}
  onKeyDown={(e) => {
    if (e.key.toLowerCase() === 'a') {
      e.preventDefault();
      triage(item.repo, item.pr.number, 'accepted');
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      triage(item.repo, item.pr.number, 'rejected', 'too-few-files');
    }
  }}
>'''
app = app.replace(old_article, new_article)

# Let's fix 6.8 (collapsible nav). In TopBar:
# `<Button className="icon-mobile btn-icon" variant="ghost" onClick={() => setMobileNavOpen(true)} ...>`
# Make sure the open sidebar overlay can be closed, it already has onClick={() => setOpen(false)}.
# Is the nav item click hiding the sidebar?
# The requirement: "and reopens as an overlay, all without losing the active view, selections, or a running pipeline"
# Clicking a nav item should probably close the mobile sidebar.
old_nav_item = 'onClick={() => setView(id)}'
new_nav_item = 'onClick={() => { setView(id); setOpen(false); }}'
app = app.replace(old_nav_item, new_nav_item)

with open('src/App.jsx', 'w') as f:
    f.write(app)
