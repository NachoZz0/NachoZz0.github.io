
(() => {
  const OWNER = "NachoZz0";
  const REPO = "neteasePlayer";
  const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

  const root = document.getElementById("github-browser");
  if (!root) {
    console.error("找不到 #github-browser 容器");
    return;
  }

  let branch = "";
  let currentPath = "";
  let requestId = 0;

  root.innerHTML = `
    <div class="gh-card">
      <div class="gh-header">
        <div class="gh-title">${OWNER} / ${REPO}</div>
        <div class="gh-subtitle">GitHub Repository Browser</div>
      </div>
      <div class="gh-toolbar">
        <button type="button" class="gh-button" id="gh-up">
          ↑ 返回上级
        </button>
        <a class="gh-button"
           href="https://github.com/${OWNER}/${REPO}"
           target="_blank" rel="noopener noreferrer">
          在 GitHub 打开 ↗
        </a>
        <div class="gh-breadcrumb" id="gh-breadcrumb"></div>
      </div>
      <div class="gh-list" id="gh-list">
        <div class="gh-status">正在加载文件列表…</div>
      </div>
    </div>
  `;

  const list = root.querySelector("#gh-list");
  const breadcrumb = root.querySelector("#gh-breadcrumb");
  const upButton = root.querySelector("#gh-up");

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showMessage(message, error = false) {
    const node = make(
      "div",
      "gh-status" + (error ? " gh-error" : ""),
      message
    );
    list.replaceChildren(node);
  }

  function renderBreadcrumb() {
    breadcrumb.replaceChildren();

    const home = make("a", "", REPO);
    home.href = "#";
    home.addEventListener("click", event => {
      event.preventDefault();
      navigate("");
    });
    breadcrumb.append(home);

    let path = "";

    for (const part of currentPath.split("/").filter(Boolean)) {
      breadcrumb.append(make("span", "", "/"));
      path = path ? `${path}/${part}` : part;

      const target = path;
      const a = make("a", "", part);
      a.href = "#";
      a.addEventListener("click", event => {
        event.preventDefault();
        navigate(target);
      });
      breadcrumb.append(a);
    }

    upButton.disabled = !currentPath;
  }

  upButton.addEventListener("click", () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    navigate(parts.join("/"));
  });

  async function navigate(path) {
    currentPath = path;
    const id = ++requestId;

    renderBreadcrumb();
    showMessage("正在加载文件列表…");

    try {
      const url = new URL(
        `${API}/contents/${path
          .split("/")
          .filter(Boolean)
          .map(encodeURIComponent)
          .join("/")}`
      );

      url.searchParams.set("ref", branch);

      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" }
      });

      if (!response.ok) {
        throw new Error(`GitHub API 请求失败：HTTP ${response.status}`);
      }

      const data = await response.json();

      if (id !== requestId) return;

      if (!Array.isArray(data)) {
        throw new Error("API 返回的不是目录列表");
      }

      data.sort((a, b) => {
        if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      if (data.length === 0) {
        showMessage("这个目录是空的。");
        return;
      }

      const fragment = document.createDocumentFragment();

      for (const file of data) {
        const isDirectory = file.type === "dir";
        const row = make("div", "gh-row");
        const icon = make("span", "gh-icon", isDirectory ? "📁" : "📄");
        const name = make("a", "gh-name", file.name);
        const detail = make(
          "span",
          "gh-kind",
          isDirectory ? "文件夹" : formatSize(file.size)
        );

        if (isDirectory) {
          name.href = "#";
          name.addEventListener("click", event => {
            event.preventDefault();
            navigate(
              currentPath
                ? `${currentPath}/${file.name}`
                : file.name
            );
          });
        } else {
          name.href = file.html_url;
          name.target = "_blank";
          name.rel = "noopener noreferrer";
        }

        row.append(icon, name, detail);
        fragment.append(row);
      }

      list.replaceChildren(fragment);
      console.log(`GitHub 文件浏览器：已显示 ${data.length} 项`);
    } catch (error) {
      if (id !== requestId) return;
      console.error("GitHub 文件浏览器加载失败：", error);
      showMessage(error.message || "加载失败，请检查网络。", true);
    }
  }

  function formatSize(size = 0) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

async function loadReadme() {
  const container = document.getElementById("github-readme");
  if (!container) return;

  container.textContent = "正在加载 README.md…";

  try {
    const url =
      `https://api.github.com/repos/${OWNER}/${REPO}/readme`;

    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error(`读取 README 失败：HTTP ${response.status}`);
    }

    const data = await response.json();

    // GitHub API 返回的内容经过 Base64 编码
    const binary = atob(data.content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const markdown = new TextDecoder("utf-8").decode(bytes);

    if (typeof marked === "undefined") {
      throw new Error("Markdown 渲染库没有加载成功");
    }

    // 将 README 中的相对链接和图片转换成 GitHub 地址
    const base = `https://github.com/${OWNER}/${REPO}/blob/HEAD/`;

    const html = marked.parse(markdown);

    const template = document.createElement("template");
    template.innerHTML = html;

    // 修正相对路径，并限制危险的链接协议
    for (const node of template.content.querySelectorAll(
      "a[href], img[src]"
    )) {
      const attr = node.tagName === "IMG" ? "src" : "href";
      const value = node.getAttribute(attr);

      if (!value) continue;

      try {
        const resolved = new URL(value, base);

        if (!["https:", "http:"].includes(resolved.protocol)) {
          node.removeAttribute(attr);
          continue;
        }

        node.setAttribute(attr, resolved.href);
      } catch {
        node.removeAttribute(attr);
      }
    }

    container.replaceChildren(template.content);
  } catch (error) {
    console.error("README 加载失败：", error);
    container.textContent =
      `${error.message}。你可以直接访问 GitHub 查看 README。`;

    const link = document.createElement("a");
    link.href = `https://github.com/${OWNER}/${REPO}#readme`;
    link.textContent = "打开 GitHub README";
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    container.appendChild(document.createElement("br"));
    container.appendChild(link);
  }
}

  async function init() {
    try {
      const response = await fetch(API, {
        headers: { Accept: "application/vnd.github+json" }
      });

      if (!response.ok) {
        throw new Error(`仓库信息获取失败：HTTP ${response.status}`);
      }

      const info = await response.json();
      branch = info.default_branch;

      await navigate("");
      await loadReadme();
    } catch (error) {
      console.error(error);
      showMessage(error.message || "初始化失败", true);
    }
  }

  
  init();
})();
