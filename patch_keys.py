with open("issue.html", "r") as f:
    html = f.read()

# Insert keyboard nav logic right before loadingState.classList.add("hidden");
js_logic = """
          // Keyboard Navigation for Pager
          document.addEventListener("keydown", (e) => {
            // Prevent if a modal is open or typing in an input
            if (galleryModal && galleryModal.open) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === "ArrowLeft" && prevIssue) {
              window.location.href = `issue.html?id=${prevIssue.id}`;
            } else if (e.key === "ArrowRight" && nextIssue) {
              window.location.href = `issue.html?id=${nextIssue.id}`;
            }
          });

"""
html = html.replace('loadingState.classList.add("hidden");\n          issueContent.classList.remove("hidden");', 
                    js_logic + 'loadingState.classList.add("hidden");\n          issueContent.classList.remove("hidden");')

with open("issue.html", "w") as f:
    f.write(html)
