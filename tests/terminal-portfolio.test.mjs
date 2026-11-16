import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&middot;|&#183;/gi, "·");
}

function toPlainText(html) {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function extractHrefs(html) {
  const hrefs = [];
  const regex = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    hrefs.push(decodeHtmlEntities(match[1] ?? match[2] ?? ""));
  }
  return hrefs;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUrlForComparison(url) {
  return url.trim().replace(/\/+$/, "");
}

function extractBalancedJsCall(source, startRegex) {
  const match = startRegex.exec(source);
  if (!match) return null;
  const openParenIdx = source.indexOf("(", match.index);
  if (openParenIdx === -1) return null;

  let depth = 0;
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openParenIdx; i < source.length; i++) {
    const c = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (c === "\\" && i + 1 < source.length) {
        i += 1;
        continue;
      }
      if (c === quote) {
        quote = null;
      }
    } else {
      if (c === "/" && next === "/") {
        inLineComment = true;
        i += 1;
      } else if (c === "/" && next === "*") {
        inBlockComment = true;
        i += 1;
      } else if (c === '"' || c === "'" || c === "`") {
        quote = c;
      } else if (c === "(") {
        depth += 1;
      } else if (c === ")") {
        depth -= 1;
        if (depth === 0) {
          return source.slice(match.index, i + 1);
        }
      }
    }
  }
  return null;
}

const SKILL_CATEGORIES = [
  "Cloud & DevOps",
  "QA & Test Automation",
  "Backend & Databases",
  "Frontend & Product",
];

// Full 45-skill inventory aligned with advanced-portfolio-nextjs-v2/lib/data.ts (skillsData)
const ALL_SKILLS = [
  "Terraform",
  "Azure",
  "AKS",
  "AWS",
  "Docker",
  "Kubernetes",
  "ArgoCD",
  "GitHub Actions",
  "Jenkins",
  "CI/CD",
  "Linux",
  "Bash",
  "Ansible",
  "SonarQube",
  "Trivy",
  "OWASP",
  "Git",
  "Python",
  "Java",
  "Selenium",
  "BDD",
  "TestNG",
  "JUnit",
  "Allure",
  "Maven",
  "REST Assured",
  "Jest",
  "TypeScript",
  "Next.js",
  "React",
  "Node.js",
  "Express.js",
  "JavaScript",
  "Tailwind CSS",
  "Bootstrap",
  "Framer Motion",
  "PostgreSQL",
  "MongoDB",
  "Supabase",
  "MySQL",
  "Flutter",
  "Dart",
  "IoT",
  "Firebase",
  "Arduino",
];

const PROJECTS = [
  {
    title: "Azure Cloud Platform IaC",
    githubUrl: "https://github.com/sowmikshovon/azure-cloud-platform-terraform",
    liveUrl: null,
  },
  {
    title: "DevOps CI/CD Pipeline",
    githubUrl: "https://github.com/sowmikshovon/DevOps-pipeline-1",
    liveUrl: null,
  },
  {
    title: "Acquisitions API & CI/CD",
    githubUrl: "https://github.com/sowmikshovon/acquisitions",
    liveUrl: null,
  },
  {
    title: "Automated QA & Test Suite",
    githubUrl: "https://github.com/sowmikshovon/test_automation",
    liveUrl: null,
  },
  {
    title: "Spotify Full-Stack Clone",
    githubUrl: "https://github.com/sowmikshovon/spotify-clone",
    liveUrl: "https://spotify-clone-seven-tau.vercel.app",
  },
  {
    title: "Advanced Portfolio",
    githubUrl: "https://github.com/sowmikshovon/advanced-portfolio-nextjs",
    extraGithubUrls: [
      "https://github.com/sowmikshovon/advanced-portfolio-nextjs-v2",
    ],
    liveUrl: "https://sowmik-portfolio-nextjs.vercel.app",
  },
  {
    title: "IoT Parking Manager",
    githubUrl: "https://github.com/sowmikshovon/parking_manager_app_iot",
    liveUrl: null,
  },
  {
    title: "Anime Vault",
    githubUrl: "https://github.com/sowmikshovon/Anime_vault",
    liveUrl: "https://anime-vault-peach.vercel.app/",
  },
  {
    title: "Terminal Portfolio",
    githubUrl: "https://github.com/sowmikshovon/portfolio_terminal",
    liveUrl: "https://sowmikshovon.github.io/portfolio_terminal/",
  },
];

test("1. Profile & Summary (sowmikshovon.txt) reflects updated persona, Finland location, 4 pillars, and zero typos", () => {
  const raw = readSource("sowmikshovon.txt");
  const plainText = toPlainText(raw);

  assert.doesNotMatch(raw, /softwere/i, "Must fix legacy 'softwere' typo");
  assert.ok(
    plainText.includes("Sowmik Shovon Karmakar"),
    "Must include full name 'Sowmik Shovon Karmakar'"
  );
  assert.ok(
    plainText.includes("Cloud, DevSecOps & QA Automation Engineer"),
    "Must include headline 'Cloud, DevSecOps & QA Automation Engineer'"
  );
  assert.ok(
    plainText.includes("Tampere, Finland"),
    "Must include location 'Tampere, Finland'"
  );
  assert.ok(
    plainText.includes("Finland & EU"),
    "Must include availability 'Finland & EU'"
  );
  for (const file of ["sowmikshovon.txt", "index.js", "README.md"]) {
    assert.doesNotMatch(
      readSource(file),
      /\b(Lahti|Helsinki)\b/i,
      `${file} must not mention Lahti or Helsinki`
    );
  }

  const pillars = [
    "Cloud & IaC (Azure / Terraform)",
    "DevSecOps & CI/CD",
    "QA Test Automation",
    "Full-Stack TypeScript",
  ];
  for (const pillar of pillars) {
    assert.ok(
      plainText.includes(pillar),
      `Missing domain pillar in sowmikshovon.txt: '${pillar}'`
    );
  }
});

test("2. Experience & Education (sowmikshovon.txt) covers LUT MSc, PMSCS, A1QA internship, BRAC BSc, and 2026 - Present availability", () => {
  const plainText = toPlainText(readSource("sowmikshovon.txt"));

  // Current availability
  assert.match(
    plainText,
    /2026\s*[-–]\s*Present/,
    "Must include '2026 - Present' job availability"
  );
  assert.match(
    plainText,
    /2026\s*[-–]\s*Present\]\s*Looking for a fulltime Job\s*\|\s*Finland & EU/,
    "Must include '2026 - Present' job availability for 'Finland & EU'"
  );

  // LUT University MSc
  assert.ok(
    plainText.includes("MSc in Software Product Management and Business"),
    "Must include 'MSc in Software Product Management and Business'"
  );
  assert.ok(
    plainText.includes("LUT University, Finland"),
    "Must include 'LUT University, Finland'"
  );
  assert.match(
    plainText,
    /Aug 2026\s*[-–]\s*Jul 2028/,
    "Must include 'Aug 2026 - Jul 2028'"
  );
  assert.doesNotMatch(
    plainText,
    /\b(Lahti|Helsinki)\b/i,
    "Experience & education must not mention Lahti or Helsinki"
  );

  // Jahangirnagar University PMSCS
  assert.match(plainText, /\bPMSCS\b/, "Must include 'PMSCS'");
  assert.ok(
    plainText.includes("Jahangirnagar University"),
    "Must include 'Jahangirnagar University'"
  );
  assert.match(plainText, /2023\s*[-–]\s*2025/, "Must include '2023-2025'");

  // A1QA Internship & highlights
  assert.match(plainText, /\bA1QA\b/, "Must include 'A1QA'");
  assert.match(plainText, /2023\s*[-–]\s*2024/, "Must include '2023-2024'");
  assert.ok(
    plainText.includes("Page Object Model"),
    "Must include A1QA QA Automation highlight 'Page Object Model'"
  );
  assert.match(
    plainText,
    /\bJenkins\b/,
    "Must include A1QA highlight 'Jenkins'"
  );
  assert.match(plainText, /\bAllure\b/, "Must include A1QA highlight 'Allure'");

  // BRAC University BSc
  assert.match(plainText, /\bBSc\b/, "Must include 'BSc'");
  assert.ok(
    plainText.includes("BRAC University"),
    "Must include 'BRAC University'"
  );
  assert.match(plainText, /2017\s*[-–]\s*2022/, "Must include '2017-2022'");
});

test("3. All 45 Skills & 4 Categories (sowmikshovon.txt) match advanced-portfolio-nextjs-v2", () => {
  assert.equal(ALL_SKILLS.length, 45, "Expected 45 skills in reference inventory");
  const plainText = toPlainText(readSource("sowmikshovon.txt"));

  for (const category of SKILL_CATEGORIES) {
    assert.ok(
      plainText.includes(category),
      `Missing skill category '${category}' in sowmikshovon.txt`
    );
  }

  for (const skill of ALL_SKILLS) {
    const tokenPattern = new RegExp(
      `(?<![A-Za-z0-9])${escapeRegExp(skill)}(?![A-Za-z0-9])`
    );
    assert.match(
      plainText,
      tokenPattern,
      `Missing skill '${skill}' in sowmikshovon.txt`
    );
  }
});

test("4. All 9 Projects & Dual Links (sowmikshovon.txt) include all titles, GitHub URLs, v2 repo URL, and 4 live demos", () => {
  const raw = readSource("sowmikshovon.txt");
  const plainText = toPlainText(raw);
  const hrefs = extractHrefs(raw);
  const normalizedHrefs = new Set(hrefs.map(normalizeUrlForComparison));

  for (const project of PROJECTS) {
    assert.ok(
      plainText.includes(project.title),
      `Missing project title '${project.title}' in sowmikshovon.txt`
    );

    assert.ok(
      normalizedHrefs.has(normalizeUrlForComparison(project.githubUrl)),
      `Missing GitHub href '${project.githubUrl}' for '${project.title}'`
    );

    for (const extraUrl of project.extraGithubUrls ?? []) {
      assert.ok(
        normalizedHrefs.has(normalizeUrlForComparison(extraUrl)),
        `Missing extra GitHub href '${extraUrl}' for '${project.title}'`
      );
    }

    if (project.liveUrl) {
      assert.ok(
        hrefs.includes(project.liveUrl) ||
          normalizedHrefs.has(normalizeUrlForComparison(project.liveUrl)),
        `Missing live demo href '${project.liveUrl}' for '${project.title}'`
      );
    }
  }
});

test("5. CV & Contact Links (sowmikshovon.txt) have updated Google Drive CV, Web CV, valid mailto, socials, and phone", () => {
  const raw = readSource("sowmikshovon.txt");
  const plainText = toPlainText(raw);
  const hrefs = extractHrefs(raw);

  assert.ok(
    !raw.includes("14MACaYqKp9ayPm3VRFlsfrXyZ64jOMMY"),
    "Must remove outdated 2022 Google Drive CV ID"
  );
  assert.ok(
    hrefs.some(
      (h) =>
        h.includes("drive.google.com") &&
        h.includes("10Eeuk0-Sefn8RYVn4oB3ggZg-BI24QRs")
    ),
    "Must link to updated Google Drive CV ID '10Eeuk0-Sefn8RYVn4oB3ggZg-BI24QRs'"
  );

  assert.ok(
    hrefs.some(
      (h) =>
        normalizeUrlForComparison(h) ===
        "https://sowmik-portfolio-nextjs.vercel.app/cv"
    ),
    "Must include Web CV link 'https://sowmik-portfolio-nextjs.vercel.app/cv'"
  );

  assert.ok(
    hrefs.includes("mailto:sowmikshovon@gmail.com"),
    "Must use valid href=\"mailto:sowmikshovon@gmail.com\""
  );
  assert.ok(
    !hrefs.includes("sowmikshovon@gmail.com"),
    "Must not contain broken href=\"sowmikshovon@gmail.com\" without mailto:"
  );

  assert.ok(
    hrefs.some((h) =>
      /^https:\/\/(www\.)?linkedin\.com\/in\/sowmikshovon\/?$/.test(h)
    ),
    "Must include LinkedIn profile link"
  );
  assert.ok(
    hrefs.some((h) => /^https:\/\/github\.com\/sowmikshovon\/?$/.test(h)),
    "Must include GitHub profile link"
  );
  assert.ok(
    hrefs.some((h) =>
      /^https:\/\/(www\.)?facebook\.com\/sowmik\.shovon\/?$/.test(h)
    ),
    "Must include Facebook profile link"
  );
  assert.ok(
    plainText.includes("+8801735867676"),
    "Must include phone number '+8801735867676'"
  );
});

test("6. Terminal UI (index.html) declares DOCTYPE, UTF-8 charset, responsive viewport, and Escape/instant-load hint or control", () => {
  const html = readSource("index.html");

  assert.match(html, /<!DOCTYPE\s+html>/i, "Must include <!DOCTYPE html>");
  assert.match(
    html,
    /<meta\s+[^>]*charset\s*=\s*["']?UTF-8["']?[^>]*>/i,
    "Must include <meta charset=\"UTF-8\">"
  );
  assert.match(
    html,
    /<meta\s+[^>]*name\s*=\s*["']viewport["'][^>]*>/i,
    "Must include <meta name=\"viewport\" ...>"
  );
  assert.match(
    html,
    /width\s*=\s*device-width/i,
    "Viewport meta must specify width=device-width"
  );
  assert.match(
    html,
    /\b(Escape|Esc)\b/i,
    "Must include an Escape/Esc hint or control"
  );
  assert.match(
    html,
    /\b(skip|instant|instantly|fast[- ]?forward|load|complete|reveal|full)\b/i,
    "Escape hint/control must describe skipping/instant-loading output"
  );
});

test("7. Terminal Styles (index.css) makes #console responsive and defines a:focus-visible", () => {
  const css = readSource("index.css");

  const consoleMatch = css.match(/#console\s*\{([^}]*)\}/);
  assert.ok(consoleMatch, "Must define #console CSS rule");
  const consoleRule = consoleMatch[1];

  assert.doesNotMatch(
    consoleRule,
    /(?:^|[;\s])width\s*:\s*750px/i,
    "#console must not use fixed width: 750px"
  );
  assert.ok(
    /width\s*:\s*min\(/i.test(consoleRule) || /max-width\s*:/i.test(consoleRule),
    "#console must use responsive width: min(...) or max-width:"
  );

  assert.match(
    css,
    /a\s*:focus-visible\s*\{[^}]+\}/i,
    "Must define a non-empty a:focus-visible rule for keyboard accessibility"
  );
});

test("8. Terminal JS Engine (index.js) fixes Escape fast-forward, removes data.slice(0, -1) bug, and clears interval", async () => {
  const js = readSource("index.js");

  // Static checks
  assert.doesNotMatch(
    js,
    /\.keyPress\b/,
    "Must fix broken e.keyPress === 27 check"
  );
  assert.ok(
    !js.includes("data.slice(0, -1)"),
    "Must remove data.slice(0, -1) truncation bug"
  );

  const keydownCall = extractBalancedJsCall(
    js,
    /(?:addEventListener\s*\(\s*['"]keydown['"]|\.on\s*\(\s*['"]keydown['"])/
  );
  assert.ok(keydownCall, "Must attach a keydown listener");
  assert.match(
    keydownCall,
    /\.key\s*===?\s*['"]Escape['"]|\.keyCode\s*===?\s*27/,
    "Keydown listener must handle e.key === 'Escape' (or keyCode === 27)"
  );
  assert.match(js, /clearInterval\s*\(/, "Must call clearInterval");

  // Behavioral simulation in an isolated VM sandbox
  const samplePayload =
    "Sowmik Shovon Karmakar\nCloud, DevSecOps & QA Automation Engineer!";
  let nextTimerId = 1;
  const activeTimers = new Map();
  const clearedTimers = new Set();
  const listeners = { document: {}, window: {}, ready: [] };
  const consoleElement = {
    innerHTML: "",
    textContent: "",
    hidden: false,
    scrollHeight: 1000,
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {},
    removeAttribute() {},
    scrollIntoView() {},
    addEventListener(type, fn) {
      (listeners.document[`el:${type}`] ??= []).push(fn);
    },
  };

  function makeDummyElement(id = "") {
    if (id === "console") return consoleElement;
    return {
      innerHTML: "",
      textContent: "",
      hidden: false,
      disabled: false,
      scrollHeight: 1000,
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute() {},
      removeAttribute() {},
      scrollIntoView() {},
      addEventListener() {},
      remove() {},
    };
  }

  function makeJq(target) {
    if (typeof target === "function") {
      listeners.ready.push(target);
      return;
    }
    const el =
      target === "#console"
        ? consoleElement
        : typeof target === "string"
        ? makeDummyElement(target.replace(/^#/, ""))
        : consoleElement;
    const jqObj = {
      html(val) {
        if (val === undefined) return el.innerHTML;
        el.innerHTML = String(val);
        return jqObj;
      },
      append(val) {
        el.innerHTML += String(val);
        return jqObj;
      },
      text(val) {
        if (val === undefined) return el.textContent;
        el.textContent = String(val);
        return jqObj;
      },
      on(type, fn) {
        if (target && target.__isDoc) {
          (listeners.document[type] ??= []).push(fn);
        } else if (target && target.__isWin) {
          (listeners.window[type] ??= []).push(fn);
        }
        return jqObj;
      },
      ready(fn) {
        listeners.ready.push(fn);
        return jqObj;
      },
      hide() {
        el.hidden = true;
        return jqObj;
      },
      show() {
        el.hidden = false;
        return jqObj;
      },
      css() {
        return jqObj;
      },
      animate() {
        return jqObj;
      },
      attr() {
        return jqObj;
      },
      prop() {
        return jqObj;
      },
    };
    return jqObj;
  }

  const docStub = {
    __isDoc: true,
    readyState: "complete",
    body: makeDummyElement("body"),
    documentElement: makeDummyElement("html"),
    onkeydown: null,
    addEventListener(type, fn) {
      (listeners.document[type] ??= []).push(fn);
    },
    getElementById(id) {
      return makeDummyElement(id);
    },
    querySelector(sel) {
      if (sel === "#console") return consoleElement;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement(tag) {
      return makeDummyElement(tag);
    },
  };

  const sandbox = {
    console,
    Promise,
    RegExp,
    Math,
    Number,
    String,
    Array,
    Object,
    Set,
    Map,
    JSON,
    document: docStub,
    $: makeJq,
    jQuery: makeJq,
    setInterval(fn, ms) {
      const id = nextTimerId++;
      activeTimers.set(id, { fn, ms });
      return id;
    },
    clearInterval(id) {
      if (id !== null && id !== undefined) {
        clearedTimers.add(id);
        activeTimers.delete(id);
      }
    },
    setTimeout(fn) {
      const id = nextTimerId++;
      return id;
    },
    clearTimeout() {},
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    fetch: async () => ({
      ok: true,
      status: 200,
      text: async () => samplePayload,
    }),
  };

  const winStub = {
    __isWin: true,
    document: docStub,
    scrollBy() {},
    scrollTo() {},
    matchMedia: () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }),
    addEventListener(type, fn) {
      (listeners.window[type] ??= []).push(fn);
    },
    setInterval: sandbox.setInterval,
    clearInterval: sandbox.clearInterval,
    setTimeout: sandbox.setTimeout,
    clearTimeout: sandbox.clearTimeout,
    fetch: sandbox.fetch,
  };

  sandbox.window = winStub;
  sandbox.self = winStub;
  sandbox.scrollBy = winStub.scrollBy;
  sandbox.scrollTo = winStub.scrollTo;

  const context = vm.createContext(sandbox);
  vm.runInContext(js, context);

  // Trigger DOMContentLoaded / jQuery ready handlers if script deferred init
  for (const fn of listeners.document.DOMContentLoaded ?? []) {
    fn({ type: "DOMContentLoaded" });
  }
  for (const fn of listeners.ready) {
    fn(makeJq);
  }

  // Drain microtask queue so mocked fetch() resolves
  for (let i = 0; i < 6; i++) {
    await Promise.resolve();
  }

  // Dispatch Escape keydown
  let defaultPrevented = false;
  const escEvent = {
    type: "keydown",
    key: "Escape",
    code: "Escape",
    keyCode: 27,
    which: 27,
    preventDefault() {
      defaultPrevented = true;
    },
    stopPropagation() {},
  };

  docStub.onkeydown?.(escEvent);
  for (const fn of listeners.document.keydown ?? []) {
    fn(escEvent);
  }
  for (const fn of listeners.window.keydown ?? []) {
    fn(escEvent);
  }

  assert.ok(
    clearedTimers.size > 0,
    "Fast-forwarding with Escape must stop the typing interval via clearInterval"
  );
  assert.ok(
    consoleElement.innerHTML.includes("Sowmik Shovon Karmakar") &&
      consoleElement.innerHTML.includes(
        "Cloud, DevSecOps & QA Automation Engineer!"
      ),
    "Escape fast-forward must immediately render full fetched text without truncating the last character"
  );
});

const buildSkipReason =
  process.env.BUILD_CHECK !== "1"
    ? "Pre-build phase; run with BUILD_CHECK=1 after npm run build"
    : false;

test(
  "9. Build Artifacts (dist/) exist and match source files",
  { skip: buildSkipReason },
  () => {
    const files = ["index.html", "index.css", "index.js", "sowmikshovon.txt"];
    for (const file of files) {
      const srcPath = path.join(ROOT, file);
      const distPath = path.join(ROOT, "dist", file);
      assert.ok(fs.existsSync(distPath), `Missing built artifact: dist/${file}`);
      assert.equal(
        fs.readFileSync(distPath, "utf8"),
        fs.readFileSync(srcPath, "utf8"),
        `Built artifact dist/${file} does not match source ${file}`
      );
    }
  }
);

// ---------------------------------------------------------------------------
// Maximum UX Upgrade Tests (Tests 10–15) — Vanilla DOM VM & UX Verification
// ---------------------------------------------------------------------------

const VOID_HTML_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const BUBBLING_EVENTS = new Set([
  "keydown",
  "keyup",
  "keypress",
  "input",
  "change",
  "submit",
  "click",
  "wheel",
  "touchstart",
  "touchmove",
  "touchend",
]);

const HTML_TOKEN_REGEX = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>|<|[^<]+/g;

function escapeHtmlAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseHtmlAttributes(attrText) {
  const attrs = new Map();
  const attrRegex =
    /\s*([A-Za-z_:][A-Za-z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attrRegex.exec(attrText)) !== null) {
    if (!match[1]) continue;
    const name = match[1].toLowerCase();
    const val = match[2] ?? match[3] ?? match[4] ?? "";
    attrs.set(name, decodeHtmlEntities(val));
  }
  return attrs;
}

class MockTextNode {
  constructor(text, parentNode = null) {
    this.nodeType = 3;
    this.nodeName = "#text";
    this._text = String(text);
    this.parentNode = parentNode;
    this.parentElement =
      parentNode && parentNode.nodeType === 1 ? parentNode : null;
    this._dirtyTree = false;
  }

  _markDirty() {
    this._dirtyTree = true;
    this.parentNode?._markDirty?.();
  }

  get textContent() {
    return this._text;
  }

  set textContent(val) {
    this._text = String(val);
    this._markDirty();
  }

  get outerHTML() {
    return escapeHtmlAttr(this._text);
  }

  remove() {
    if (this.parentNode && typeof this.parentNode._removeChildNode === "function") {
      this.parentNode._removeChildNode(this);
    }
  }
}

class MockElement {
  constructor(tagName, ownerDocument, attrs = new Map()) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.nodeName = this.tagName;
    this.ownerDocument = ownerDocument;
    this._attrs = new Map(attrs);
    this._segments = [];
    this._listeners = new Map();
    this._value = this._attrs.get("value") ?? "";
    this.parentNode = null;
    this.parentElement = null;
    this._dirtyTree = false;
    this.scrollTop = 0;
    this.scrollHeight = 1000;
    this.clientHeight = 500;
    this.offsetHeight = 40;
    this.offsetTop = 0;
    this.style = {};
    this.scrollIntoViewCalls = [];
  }

  _markDirty() {
    this._dirtyTree = true;
    this.parentNode?._markDirty?.();
  }

  get id() {
    return this._attrs.get("id") ?? "";
  }

  set id(val) {
    this._attrs.set("id", String(val));
    this._markDirty();
  }

  get className() {
    return this._attrs.get("class") ?? "";
  }

  set className(val) {
    this._attrs.set("class", String(val));
    this._markDirty();
  }

  get classList() {
    const self = this;
    const tokens = () =>
      self.className.split(/\s+/).filter((t) => t.length > 0);
    return {
      add(...cls) {
        const set = new Set(tokens());
        for (const c of cls) {
          if (c) set.add(String(c));
        }
        self.className = Array.from(set).join(" ");
      },
      remove(...cls) {
        const drop = new Set(cls.map(String));
        self.className = tokens()
          .filter((t) => !drop.has(t))
          .join(" ");
      },
      toggle(c, force) {
        const name = String(c);
        const has = tokens().includes(name);
        const shouldAdd = force !== undefined ? Boolean(force) : !has;
        if (shouldAdd) this.add(name);
        else this.remove(name);
        return shouldAdd;
      },
      contains(c) {
        return tokens().includes(String(c));
      },
    };
  }

  get type() {
    return (
      this._attrs.get("type") ?? (this.tagName === "INPUT" ? "text" : "")
    );
  }

  set type(val) {
    this._attrs.set("type", String(val));
  }

  get name() {
    return this._attrs.get("name") ?? "";
  }

  set name(val) {
    this._attrs.set("name", String(val));
  }

  get placeholder() {
    return this._attrs.get("placeholder") ?? "";
  }

  set placeholder(val) {
    this._attrs.set("placeholder", String(val));
  }

  get href() {
    return this._attrs.get("href") ?? "";
  }

  set href(val) {
    this._attrs.set("href", String(val));
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = String(val);
  }

  get disabled() {
    return this._attrs.has("disabled");
  }

  set disabled(val) {
    if (val) this._attrs.set("disabled", "");
    else this._attrs.delete("disabled");
    this._markDirty();
  }

  get hidden() {
    return this._attrs.has("hidden");
  }

  set hidden(val) {
    if (val) this._attrs.set("hidden", "");
    else this._attrs.delete("hidden");
    this._markDirty();
  }

  get innerHTML() {
    return this._segments
      .map((seg) => {
        if (seg.type !== "html") return seg.node.outerHTML;
        if (seg.parsed && seg.parsed.some((n) => n._dirtyTree)) {
          return seg.parsed.map((n) => n.outerHTML).join("");
        }
        return seg.value;
      })
      .join("");
  }

  set innerHTML(val) {
    const str = String(val);
    this._segments = str
      ? [{ type: "html", value: str, parsed: null }]
      : [];
    this._markDirty();
  }

  get outerHTML() {
    const tag = this.tagName.toLowerCase();
    const attrParts = [];
    for (const [k, v] of this._attrs.entries()) {
      if (v === "") attrParts.push(k);
      else attrParts.push(`${k}="${escapeHtmlAttr(v)}"`);
    }
    const open = attrParts.length ? `<${tag} ${attrParts.join(" ")}>` : `<${tag}>`;
    if (VOID_HTML_TAGS.has(tag)) return open;
    return `${open}${this.innerHTML}</${tag}>`;
  }

  get textContent() {
    return this._segments
      .map((seg) => {
        if (seg.type !== "html") return seg.node.textContent;
        if (seg.parsed && seg.parsed.some((n) => n._dirtyTree)) {
          return seg.parsed.map((n) => n.textContent).join("");
        }
        return decodeHtmlEntities(seg.value.replace(/<[^>]*>/g, ""));
      })
      .join("");
  }

  set textContent(val) {
    const str = String(val);
    this._segments = str
      ? [{ type: "node", node: new MockTextNode(str, this) }]
      : [];
    this._markDirty();
  }

  get innerText() {
    return this.textContent;
  }

  set innerText(val) {
    this.textContent = val;
  }

  _childNodesList() {
    const out = [];
    for (const seg of this._segments) {
      if (seg.type === "node") {
        out.push(seg.node);
      } else {
        if (!seg.parsed) {
          seg.parsed = parseHtmlFragment(seg.value, this.ownerDocument, this);
        }
        out.push(...seg.parsed);
      }
    }
    return out;
  }

  get childNodes() {
    return this._childNodesList();
  }

  get children() {
    return this._childNodesList().filter((n) => n.nodeType === 1);
  }

  get firstChild() {
    const list = this._childNodesList();
    return list[0] ?? null;
  }

  get lastChild() {
    const list = this._childNodesList();
    return list[list.length - 1] ?? null;
  }

  get firstElementChild() {
    const list = this.children;
    return list[0] ?? null;
  }

  get lastElementChild() {
    const list = this.children;
    return list[list.length - 1] ?? null;
  }

  _removeChildNode(node) {
    this._segments = this._segments.filter((seg) => {
      if (seg.type === "node") return seg.node !== node;
      if (seg.parsed) {
        seg.parsed = seg.parsed.filter((n) => n !== node);
      }
      return true;
    });
    if (node.parentNode === this) {
      node.parentNode = null;
      node.parentElement = null;
    }
    this._markDirty();
  }

  _expandFragment(node) {
    if (node && node._isDocumentFragment) {
      return node._segments.map((s) => s.node).filter(Boolean);
    }
    return [node];
  }

  appendChild(node) {
    for (const item of this._expandFragment(node)) {
      item.remove?.();
      item.parentNode = this;
      item.parentElement = this;
      this._segments.push({ type: "node", node: item });
    }
    this._markDirty();
    return node;
  }

  insertBefore(newNode, refNode) {
    if (!refNode) return this.appendChild(newNode);
    const items = this._expandFragment(newNode);
    const idx = this._segments.findIndex(
      (seg) => seg.type === "node" && seg.node === refNode
    );
    if (idx === -1) return this.appendChild(newNode);
    const toInsert = items.map((item) => {
      item.remove?.();
      item.parentNode = this;
      item.parentElement = this;
      return { type: "node", node: item };
    });
    this._segments.splice(idx, 0, ...toInsert);
    this._markDirty();
    return newNode;
  }

  removeChild(node) {
    this._removeChildNode(node);
    return node;
  }

  append(...items) {
    for (const item of items) {
      if (typeof item === "string") {
        this.appendChild(new MockTextNode(item, this));
      } else if (item) {
        this.appendChild(item);
      }
    }
  }

  prepend(...items) {
    const nodes = [];
    for (const item of items) {
      if (typeof item === "string") {
        nodes.push(new MockTextNode(item, this));
      } else if (item) {
        nodes.push(...this._expandFragment(item));
      }
    }
    const segs = nodes.map((n) => {
      n.remove?.();
      n.parentNode = this;
      n.parentElement = this;
      return { type: "node", node: n };
    });
    this._segments.unshift(...segs);
    this._markDirty();
  }

  replaceChildren(...items) {
    this._segments = [];
    this.append(...items);
    this._markDirty();
  }

  remove() {
    if (this.parentNode) {
      this.parentNode._removeChildNode(this);
    }
  }

  insertAdjacentHTML(position, html) {
    const pos = String(position).toLowerCase();
    const seg = { type: "html", value: String(html), parsed: null };
    if (pos === "beforeend") {
      this._segments.push(seg);
      this._markDirty();
    } else if (pos === "afterbegin") {
      this._segments.unshift(seg);
      this._markDirty();
    } else if (this.parentNode) {
      const pSegs = this.parentNode._segments;
      const idx = pSegs.findIndex((s) => s.type === "node" && s.node === this);
      if (idx !== -1) {
        pSegs.splice(pos === "beforebegin" ? idx : idx + 1, 0, seg);
      } else {
        pSegs.push(seg);
      }
      this.parentNode._markDirty();
    }
  }

  insertAdjacentElement(position, node) {
    const pos = String(position).toLowerCase();
    if (pos === "beforeend") {
      this.appendChild(node);
    } else if (pos === "afterbegin") {
      this.prepend(node);
    } else if (this.parentNode) {
      if (pos === "beforebegin") {
        this.parentNode.insertBefore(node, this);
      } else if (pos === "afterend") {
        const pSegs = this.parentNode._segments;
        const idx = pSegs.findIndex(
          (s) => s.type === "node" && s.node === this
        );
        node.remove?.();
        node.parentNode = this.parentNode;
        node.parentElement = this.parentNode;
        if (idx !== -1) {
          pSegs.splice(idx + 1, 0, { type: "node", node });
        } else {
          pSegs.push({ type: "node", node });
        }
        this.parentNode._markDirty();
      }
    }
    return node;
  }

  setAttribute(name, value) {
    const key = String(name).toLowerCase();
    const val = String(value);
    this._attrs.set(key, val);
    if (key === "value") this._value = val;
    this._markDirty();
  }

  getAttribute(name) {
    const key = String(name).toLowerCase();
    return this._attrs.has(key) ? this._attrs.get(key) : null;
  }

  hasAttribute(name) {
    return this._attrs.has(String(name).toLowerCase());
  }

  removeAttribute(name) {
    this._attrs.delete(String(name).toLowerCase());
    this._markDirty();
  }

  addEventListener(type, fn) {
    if (typeof fn !== "function") return;
    const key = String(type);
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(fn);
  }

  removeEventListener(type, fn) {
    const key = String(type);
    const list = this._listeners.get(key);
    if (!list) return;
    this._listeners.set(
      key,
      list.filter((item) => item !== fn)
    );
  }

  dispatchEvent(event) {
    const ev = event ?? { type: "" };
    if (!ev.target) ev.target = this;
    let stopped = false;
    const origStop = ev.stopPropagation;
    ev.stopPropagation = () => {
      stopped = true;
      origStop?.call(ev);
    };
    let prevented = Boolean(ev.defaultPrevented);
    const origPrevent = ev.preventDefault;
    ev.preventDefault = () => {
      prevented = true;
      ev.defaultPrevented = true;
      origPrevent?.call(ev);
    };

    const bubbles = BUBBLING_EVENTS.has(ev.type);
    let curr = this;
    while (curr && !stopped) {
      ev.currentTarget = curr;
      const inlineHandler = curr[`on${ev.type}`];
      if (typeof inlineHandler === "function") {
        inlineHandler.call(curr, ev);
      }
      const list = curr._listeners?.get(ev.type) ?? [];
      for (const fn of [...list]) {
        fn.call(curr, ev);
      }
      if (!bubbles) break;
      curr = curr.parentNode;
    }
    return !prevented;
  }

  focus() {
    if (this.ownerDocument) {
      this.ownerDocument.activeElement = this;
    }
  }

  blur() {
    if (this.ownerDocument && this.ownerDocument.activeElement === this) {
      this.ownerDocument.activeElement = this.ownerDocument.body;
    }
  }

  select() {}

  click() {
    this.dispatchEvent({ type: "click", preventDefault() {}, stopPropagation() {} });
  }

  scrollIntoView(opts) {
    this.scrollIntoViewCalls.push(opts ?? true);
  }

  contains(other) {
    let curr = other;
    while (curr) {
      if (curr === this) return true;
      curr = curr.parentNode;
    }
    return false;
  }

  matches(selector) {
    return matchesSelector(this, selector, this.ownerDocument);
  }

  closest(selector) {
    let curr = this;
    while (curr && curr.nodeType === 1) {
      if (curr.matches(selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    const results = [];
    const walk = (el) => {
      for (const child of el.children) {
        if (matchesSelector(child, selector, el.ownerDocument)) {
          results.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return results;
  }

  getBoundingClientRect() {
    return { top: 0, left: 0, bottom: 40, right: 100, width: 100, height: 40 };
  }
}

function matchesSimpleSelector(el, simple) {
  if (!el || el.nodeType !== 1 || !simple) return false;
  let rest = simple.trim();
  if (!rest) return false;
  if (rest === "*") return true;

  const tagMatch = rest.match(/^[A-Za-z][A-Za-z0-9-]*/);
  if (tagMatch) {
    if (el.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) return false;
    rest = rest.slice(tagMatch[0].length);
  }

  while (rest.length > 0) {
    if (rest.startsWith("#")) {
      const m = rest.match(/^#([A-Za-z0-9_-]+)/);
      if (!m || el.id !== m[1]) return false;
      rest = rest.slice(m[0].length);
    } else if (rest.startsWith(".")) {
      const m = rest.match(/^\.([A-Za-z0-9_-]+)/);
      if (!m || !el.classList.contains(m[1])) return false;
      rest = rest.slice(m[0].length);
    } else if (rest.startsWith("[")) {
      const m = rest.match(
        /^\[([A-Za-z0-9_:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]/
      );
      if (!m) return false;
      const attrName = m[1].toLowerCase();
      if (!el.hasAttribute(attrName)) return false;
      const expected = m[2] ?? m[3] ?? m[4];
      if (expected !== undefined && el.getAttribute(attrName) !== expected) {
        return false;
      }
      rest = rest.slice(m[0].length);
    } else {
      return false;
    }
  }
  return true;
}

function matchesSelector(el, selectorList) {
  const groups = String(selectorList)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const selector of groups) {
    const parts = selector
      .replace(/\s*>\s*/g, " > ")
      .trim()
      .split(/\s+/);
    if (parts.length === 0) continue;

    if (!matchesSimpleSelector(el, parts[parts.length - 1])) continue;
    if (parts.length === 1) return true;

    let idx = parts.length - 2;
    let curr = el.parentElement;
    let matched = true;
    while (idx >= 0) {
      if (parts[idx] === ">") {
        idx -= 1;
        if (!curr || !matchesSimpleSelector(curr, parts[idx])) {
          matched = false;
          break;
        }
        curr = curr.parentElement;
        idx -= 1;
      } else {
        while (curr && !matchesSimpleSelector(curr, parts[idx])) {
          curr = curr.parentElement;
        }
        if (!curr) {
          matched = false;
          break;
        }
        curr = curr.parentElement;
        idx -= 1;
      }
    }
    if (matched) return true;
  }
  return false;
}

function parseHtmlFragment(html, ownerDocument, rootParent = null) {
  const topNodes = [];
  const stack = [];
  const tokenRegex = new RegExp(HTML_TOKEN_REGEX.source, "g");
  let match;

  const pushNode = (node) => {
    const parent = stack[stack.length - 1] ?? rootParent;
    node.parentNode = parent;
    node.parentElement = parent && parent.nodeType === 1 ? parent : null;
    if (stack.length > 0) {
      stack[stack.length - 1]._segments.push({ type: "node", node });
    } else {
      topNodes.push(node);
    }
  };

  while ((match = tokenRegex.exec(html)) !== null) {
    const token = match[0];
    if (token.startsWith("<!--")) {
      continue;
    }
    if (token.startsWith("</")) {
      const closeTag = token.slice(2, -1).trim().toLowerCase();
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tagName.toLowerCase() === closeTag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    if (token.startsWith("<")) {
      const tagMatch = token.match(/^<([A-Za-z][A-Za-z0-9-]*)([\s\S]*?)(\/?)>$/);
      if (!tagMatch) continue;
      const tagName = tagMatch[1].toLowerCase();
      const attrText = tagMatch[2];
      const selfClosing =
        tagMatch[3] === "/" || VOID_HTML_TAGS.has(tagName);
      const el = new MockElement(
        tagName,
        ownerDocument,
        parseHtmlAttributes(attrText)
      );
      pushNode(el);
      if (!selfClosing) {
        stack.push(el);
      }
      continue;
    }
    pushNode(new MockTextNode(decodeHtmlEntities(token)));
  }

  return topNodes;
}

function isElementVisible(el) {
  let curr = el;
  while (curr && curr.nodeType === 1) {
    if (
      curr.hidden ||
      curr.style?.display === "none" ||
      curr.style?.visibility === "hidden"
    ) {
      return false;
    }
    curr = curr.parentElement;
  }
  return true;
}

function createTerminalVm({
  payload = "",
  hash = "",
  reducedMotion = false,
  withJquery = false,
  initialScrollY = 0,
  innerHeight = 800,
  scrollHeight = 1200,
} = {}) {
  const htmlSource = readSource("index.html");
  const bodyMatch = htmlSource.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : '<main id="console"></main>';

  let nextTimerId = 1;
  const activeTimers = new Map();
  const clearedTimers = new Set();
  const activeTimeouts = new Map();
  const rafQueue = [];
  const scrollByCalls = [];
  const scrollToCalls = [];
  const docListeners = new Map();
  const winListeners = new Map();

  const docStub = {
    nodeType: 9,
    readyState: "complete",
    activeElement: null,
    onkeydown: null,
    documentElement: null,
    body: null,
    createElement(tag) {
      return new MockElement(tag, docStub);
    },
    createTextNode(text) {
      return new MockTextNode(text);
    },
    createDocumentFragment() {
      return {
        _isDocumentFragment: true,
        _segments: [],
        appendChild(node) {
          this._segments.push({ type: "node", node });
          return node;
        },
        append(...items) {
          for (const item of items) {
            this.appendChild(
              typeof item === "string" ? new MockTextNode(item) : item
            );
          }
        },
      };
    },
    getElementById(id) {
      return docStub.body.querySelector(`#${id}`);
    },
    querySelector(sel) {
      return docStub.body.querySelector(sel);
    },
    querySelectorAll(sel) {
      return docStub.body.querySelectorAll(sel);
    },
    addEventListener(type, fn) {
      if (typeof fn !== "function") return;
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const list = docListeners.get(type);
      if (!list) return;
      docListeners.set(
        type,
        list.filter((item) => item !== fn)
      );
    },
    dispatchEvent(ev) {
      if (ev.type === "keydown" && typeof docStub.onkeydown === "function") {
        docStub.onkeydown(ev);
      }
      for (const fn of [...(docListeners.get(ev.type) ?? [])]) {
        fn.call(docStub, ev);
      }
    },
  };

  docStub.documentElement = new MockElement("html", docStub);
  docStub.documentElement.scrollTop = initialScrollY;
  docStub.documentElement.scrollHeight = scrollHeight;
  docStub.documentElement.clientHeight = innerHeight;

  docStub.body = new MockElement("body", docStub);
  docStub.body.parentNode = docStub.documentElement;
  docStub.documentElement.appendChild(docStub.body);
  docStub.activeElement = docStub.body;

  for (const node of parseHtmlFragment(bodyHtml, docStub, docStub.body)) {
    if (node.nodeType === 1 && node.tagName === "SCRIPT") continue;
    docStub.body.appendChild(node);
  }

  const locationObj = {
    hash,
    pathname: "/",
    search: "",
    origin: "http://localhost",
    href: `http://localhost/${hash}`,
    assign(url) {
      this.href = String(url);
    },
    replace(url) {
      this.href = String(url);
    },
  };

  const winStub = {
    document: docStub,
    location: locationObj,
    history: { replaceState() {}, pushState() {} },
    innerWidth: 1024,
    innerHeight,
    scrollX: 0,
    scrollY: initialScrollY,
    pageYOffset: initialScrollY,
    scrollBy(xOrOpts, y = 0) {
      const dx =
        typeof xOrOpts === "object" && xOrOpts !== null
          ? xOrOpts.left ?? 0
          : xOrOpts ?? 0;
      const dy =
        typeof xOrOpts === "object" && xOrOpts !== null
          ? xOrOpts.top ?? 0
          : y;
      scrollByCalls.push({ dx, dy });
      winStub.scrollY += dy;
      winStub.pageYOffset = winStub.scrollY;
      docStub.documentElement.scrollTop = winStub.scrollY;
    },
    scrollTo(xOrOpts, y = 0) {
      const x =
        typeof xOrOpts === "object" && xOrOpts !== null
          ? xOrOpts.left ?? 0
          : xOrOpts ?? 0;
      const top =
        typeof xOrOpts === "object" && xOrOpts !== null
          ? xOrOpts.top ?? 0
          : y;
      scrollToCalls.push({ x, y: top });
      winStub.scrollY = top;
      winStub.pageYOffset = top;
      docStub.documentElement.scrollTop = top;
    },
    matchMedia: (query) => ({
      matches: Boolean(reducedMotion && String(query).includes("reduce")),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }),
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    addEventListener(type, fn) {
      if (typeof fn !== "function") return;
      if (!winListeners.has(type)) winListeners.set(type, []);
      winListeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const list = winListeners.get(type);
      if (!list) return;
      winListeners.set(
        type,
        list.filter((item) => item !== fn)
      );
    },
    dispatchEvent(ev) {
      for (const fn of [...(winListeners.get(ev.type) ?? [])]) {
        fn.call(winStub, ev);
      }
    },
    setInterval(fn, ms = 0) {
      const id = nextTimerId++;
      activeTimers.set(id, { id, fn, ms });
      return id;
    },
    clearInterval(id) {
      if (id !== null && id !== undefined) {
        clearedTimers.add(id);
        activeTimers.delete(id);
      }
    },
    setTimeout(fn, ms = 0) {
      const id = nextTimerId++;
      activeTimeouts.set(id, { id, fn, ms });
      return id;
    },
    clearTimeout(id) {
      activeTimeouts.delete(id);
    },
    requestAnimationFrame(fn) {
      const id = nextTimerId++;
      rafQueue.push({ id, fn });
      return id;
    },
    cancelAnimationFrame(id) {
      const idx = rafQueue.findIndex((item) => item.id === id);
      if (idx !== -1) rafQueue.splice(idx, 1);
    },
    fetch: async () => ({
      ok: true,
      status: 200,
      text: async () => payload,
    }),
  };

  class MockEvent {
    constructor(type, init = {}) {
      this.type = type;
      Object.assign(this, init);
      this.defaultPrevented = false;
    }
    preventDefault() {
      this.defaultPrevented = true;
    }
    stopPropagation() {}
  }

  const sandbox = {
    console,
    Promise,
    RegExp,
    Math,
    Number,
    String,
    Array,
    Object,
    Set,
    Map,
    JSON,
    URL,
    URLSearchParams,
    Error,
    TypeError,
    Event: MockEvent,
    KeyboardEvent: MockEvent,
    CustomEvent: MockEvent,
    HTMLElement: MockElement,
    Element: MockElement,
    Node: MockElement,
    document: docStub,
    window: winStub,
    self: winStub,
    location: locationObj,
    history: winStub.history,
    navigator: { userAgent: "node-vm" },
    scrollBy: winStub.scrollBy,
    scrollTo: winStub.scrollTo,
    matchMedia: winStub.matchMedia,
    getComputedStyle: winStub.getComputedStyle,
    setInterval: winStub.setInterval,
    clearInterval: winStub.clearInterval,
    setTimeout: winStub.setTimeout,
    clearTimeout: winStub.clearTimeout,
    requestAnimationFrame: winStub.requestAnimationFrame,
    cancelAnimationFrame: winStub.cancelAnimationFrame,
    fetch: winStub.fetch,
  };

  if (withJquery) {
    sandbox.$ = () => {};
    sandbox.jQuery = sandbox.$;
  }

  winStub.Event = MockEvent;
  winStub.KeyboardEvent = MockEvent;
  winStub.CustomEvent = MockEvent;

  const js = readSource("index.js");
  const context = vm.createContext(sandbox);
  vm.runInContext(js, context);

  return {
    sandbox,
    winStub,
    docStub,
    consoleElement: docStub.getElementById("console"),
    activeTimers,
    clearedTimers,
    activeTimeouts,
    rafQueue,
    scrollByCalls,
    scrollToCalls,
    async settleFetch() {
      for (const fn of [...(docListeners.get("DOMContentLoaded") ?? [])]) {
        fn({ type: "DOMContentLoaded" });
      }
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    },
    getTypingTimer() {
      const entries = Array.from(activeTimers.values()).sort(
        (a, b) => a.ms - b.ms
      );
      return entries.find((t) => t.ms < 200) ?? entries[0] ?? null;
    },
    dispatchEscape() {
      const ev = new MockEvent("keydown", {
        key: "Escape",
        code: "Escape",
        keyCode: 27,
        which: 27,
      });
      docStub.dispatchEvent(ev);
      winStub.dispatchEvent(ev);
      return ev;
    },
    dispatchUserScrollUp(delta = 150) {
      winStub.scrollY = Math.max(0, winStub.scrollY - delta);
      winStub.pageYOffset = winStub.scrollY;
      docStub.documentElement.scrollTop = winStub.scrollY;

      const wheelEv = new MockEvent("wheel", { deltaY: -100 });
      winStub.dispatchEvent(wheelEv);
      docStub.dispatchEvent(wheelEv);

      const touchStartEv = new MockEvent("touchstart", {
        touches: [{ clientY: 200 }],
      });
      const touchMoveEv = new MockEvent("touchmove", {
        touches: [{ clientY: 320 }],
      });
      winStub.dispatchEvent(touchStartEv);
      docStub.dispatchEvent(touchStartEv);
      winStub.dispatchEvent(touchMoveEv);
      docStub.dispatchEvent(touchMoveEv);

      const scrollEv = new MockEvent("scroll");
      winStub.dispatchEvent(scrollEv);
      docStub.dispatchEvent(scrollEv);
    },
  };
}

function extractCssRuleBodies(css, selectorSubjectRegex) {
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const bodies = [];
  const ruleRegex = /([^{}@]+)\{([^{}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(cleanCss)) !== null) {
    const selectors = match[1].split(",").map((s) => s.trim());
    if (
      selectors.some((sel) => {
        const subject = sel.split(/[\s>+~]+/).pop() ?? "";
        return selectorSubjectRegex.test(subject);
      })
    ) {
      bodies.push(match[2]);
    }
  }
  return bodies.join("\n");
}

function extractInsertedText(before, after) {
  let prefix = 0;
  const minLen = Math.min(before.length, after.length);
  while (prefix < minLen && before[prefix] === after[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return after.slice(prefix, after.length - suffix);
}

test("10. Tag/Entity-Aware Typing Stepper (index.js) never renders incomplete HTML tags or entities at any intermediate tick", async () => {
  const payload =
    '<span id="a">sowmik@shovon</span>:&nbsp;<a href="https://github.com/sowmikshovon">GitHub</a>&amp;more';
  const env = createTerminalVm({ payload });
  await env.settleFetch();

  const snapshots = [];
  let ticks = 0;
  while (ticks < 500) {
    const typingTimer = env.getTypingTimer();
    if (!typingTimer) break;
    typingTimer.fn();
    ticks += 1;
    const snap = env.consoleElement.innerHTML;
    snapshots.push(snap);

    const strippedCursor = snap.replace(/\|$/, "");
    assert.doesNotMatch(
      snap,
      /<[^>]*$/,
      `Tick ${ticks} ended with an incomplete HTML tag: ${JSON.stringify(snap)}`
    );
    assert.doesNotMatch(
      strippedCursor,
      /<[^>]*$/,
      `Tick ${ticks} ended with an incomplete HTML tag before cursor: ${JSON.stringify(snap)}`
    );
    assert.doesNotMatch(
      snap,
      /&[A-Za-z0-9#]*$/,
      `Tick ${ticks} ended with an incomplete HTML entity: ${JSON.stringify(snap)}`
    );
    assert.doesNotMatch(
      strippedCursor,
      /&[A-Za-z0-9#]*$/,
      `Tick ${ticks} ended with an incomplete HTML entity before cursor: ${JSON.stringify(snap)}`
    );

    if (snap.includes(payload) && !env.getTypingTimer()) {
      break;
    }
  }

  assert.ok(
    ticks >= 2,
    `Expected multi-tick progressive typing animation, got ${ticks} ticks`
  );
  assert.ok(
    snapshots.some((s) => s.length > 0 && !s.includes(payload)),
    "Expected at least one intermediate partial snapshot before completion"
  );
  assert.ok(
    env.consoleElement.innerHTML.includes(payload),
    "Final rendered HTML must contain the full HTML payload"
  );
});

test("11. Smart Scroll & Sticky Touch Controls (index.css, index.html, index.js) protect user scroll and touch accessibility", async () => {
  const css = readSource("index.css");
  const html = readSource("index.html");

  // CSS: #terminal-hint sticky positioning
  const hintCss = extractCssRuleBodies(
    css,
    /^(?:[A-Za-z0-9_-]+)?#terminal-hint(?=$|[:.[])/
  );
  assert.match(
    hintCss,
    /position\s*:\s*sticky\b/i,
    "#terminal-hint must use position: sticky"
  );
  assert.match(
    hintCss,
    /top\s*:/i,
    "#terminal-hint must specify top: for sticky positioning"
  );

  // CSS: #skip-animation touch-action & >=44px touch target
  const skipCss = extractCssRuleBodies(
    css,
    /^(?:[A-Za-z0-9_-]+)?#skip-animation(?=$|[:.[])/
  );
  assert.match(
    skipCss,
    /touch-action\s*:\s*manipulation\b/i,
    "#skip-animation must specify touch-action: manipulation"
  );
  const minHeightMatch = skipCss.match(
    /min-height\s*:\s*(\d+(?:\.\d+)?)(px|rem)/i
  );
  assert.ok(
    minHeightMatch,
    "#skip-animation must specify a touch-friendly min-height (44px or 2.75rem)"
  );
  const minHeightPx =
    minHeightMatch[2].toLowerCase() === "rem"
      ? parseFloat(minHeightMatch[1]) * 16
      : parseFloat(minHeightMatch[1]);
  assert.ok(
    minHeightPx >= 44,
    `#skip-animation min-height must be at least 44px (got ${minHeightMatch[0]})`
  );

  // CSS: anchor targets define scroll-margin-top
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const scrollMarginRules = [
    ...cleanCss.matchAll(
      /([^{}@]+)\{([^{}]*scroll-margin-top\s*:\s*([^;{}]+)[^{}]*)\}/gi
    ),
  ];
  assert.ok(
    scrollMarginRules.some((m) => {
      const sel = m[1];
      const val = m[3].trim();
      const nonZero = /^(?:0?\.[1-9]\d*|[1-9]\d*(?:\.\d+)?)(?:px|rem|em|vh)/i.test(
        val
      );
      const targetsAnchors =
        /(?:\[id[^\]]*\]|#(?:about|experience|skills|portfolio|projects|contact)\b|:target|section|\*)/i.test(
          sel
        );
      return nonZero && targetsAnchors;
    }),
    "index.css must define positive scroll-margin-top on anchor targets"
  );

  // HTML: aria-live="polite" status region
  assert.match(
    html,
    /aria-live\s*=\s*["']polite["']/i,
    'index.html must include an aria-live="polite" status region'
  );

  // JS VM: upward scroll disables auto-scroll on subsequent typing ticks
  const longPayload = Array.from(
    { length: 30 },
    (_, i) => `Line ${i + 1}: Sowmik Shovon Karmakar portfolio terminal output`
  ).join("\n");
  const env = createTerminalVm({
    payload: longPayload,
    initialScrollY: 800,
    innerHeight: 800,
    scrollHeight: 1600,
  });
  await env.settleFetch();

  for (let i = 0; i < 2; i++) {
    env.getTypingTimer()?.fn();
  }

  env.dispatchUserScrollUp(400);
  env.scrollByCalls.length = 0;
  env.scrollToCalls.length = 0;

  for (let i = 0; i < 5; i++) {
    const typingTimer = env.getTypingTimer();
    if (!typingTimer) break;
    typingTimer.fn();
  }

  assert.equal(
    env.scrollByCalls.length,
    0,
    "Typing ticks must NOT call window.scrollBy after user scrolls upward"
  );
  assert.equal(
    env.scrollToCalls.length,
    0,
    "Typing ticks must NOT call window.scrollTo after user scrolls upward"
  );
});

test("12. Clickable ls Section Anchor Links & Deep Linking (sowmikshovon.txt, index.js)", async () => {
  const raw = readSource("sowmikshovon.txt");
  const firstCatStart = raw.indexOf("cat about_Sowmik.txt");
  assert.ok(firstCatStart !== -1, "Must locate cat about_Sowmik.txt");
  const lsMatch = /(?:^|[\s>])ls\s*(?:<\/span>\s*)?(?:\r?\n|$)/.exec(
    raw.slice(0, firstCatStart)
  );
  assert.ok(lsMatch, "Must locate ls section");
  const lsBlock = raw.slice(lsMatch.index, firstCatStart);

  const sections = [
    { file: "about_Sowmik.txt", id: "about" },
    { file: "experience_and_education.txt", id: "experience" },
    { file: "about_Skills.txt", id: "skills" },
    { file: "about_Portfolio_and_CV.txt", id: "portfolio" },
    { file: "about_Projects.txt", id: "projects" },
    { file: "about_Contact.txt", id: "contact" },
  ];

  for (const { file, id } of sections) {
    const linkPattern = new RegExp(
      `<a\\b[^>]*\\bhref\\s*=\\s*["']#${id}["'][^>]*>\\s*${escapeRegExp(file)}\\s*</a>`,
      "i"
    );
    assert.match(
      lsBlock,
      linkPattern,
      `ls line must link '${file}' to '#${id}'`
    );
  }

  for (let i = 0; i < sections.length; i++) {
    const curr = sections[i];
    const next = sections[i + 1];
    const catIdx = raw.indexOf(`cat ${curr.file}`);
    assert.ok(catIdx !== -1, `Missing cat ${curr.file}`);
    const lineStart = raw.lastIndexOf("\n", catIdx) + 1;
    let sliceEnd = raw.length;
    if (next) {
      const nextCatIdx = raw.indexOf(`cat ${next.file}`);
      sliceEnd = raw.lastIndexOf("\n", nextCatIdx) + 1;
    }
    const sectionSlice = raw.slice(lineStart, sliceEnd);
    assert.match(
      sectionSlice,
      new RegExp(`\\bid\\s*=\\s*["']${curr.id}["']`, "i"),
      `Section for '${curr.file}' must define id="${curr.id}"`
    );
  }

  // Deep link VM test: visiting #projects auto-completes rendering without waiting for animation
  const env = createTerminalVm({ payload: raw, hash: "#projects" });
  await env.settleFetch();

  assert.ok(
    env.consoleElement.innerHTML.includes("Azure Cloud Platform IaC") &&
      env.consoleElement.innerHTML.includes("Terminal Portfolio"),
    "Visiting #projects deep link must immediately render the full portfolio without waiting for typing ticks"
  );
  assert.equal(
    env.getTypingTimer(),
    null,
    "Deep link auto-completion must not leave an active typing interval running"
  );
});

test("13. Screen Reader Hygiene on ASCII Skill Bars (sowmikshovon.txt) hides 900 '#' characters inside aria-hidden='true'", () => {
  const raw = readSource("sowmikshovon.txt");
  const skillsStart = raw.indexOf("cat about_Skills.txt");
  const portfolioStart = raw.indexOf("cat about_Portfolio_and_CV.txt");
  assert.ok(
    skillsStart !== -1 && portfolioStart > skillsStart,
    "Must locate about_Skills.txt section"
  );
  const skillsRaw = raw.slice(skillsStart, portfolioStart);

  // Track aria-hidden depth across HTML tokens on the whole document & per skill line
  function splitAccessibleAndHidden(htmlFragment) {
    const tokenRegex = new RegExp(HTML_TOKEN_REGEX.source, "g");
    const stack = [];
    let hiddenDepth = 0;
    let accessible = "";
    let hidden = "";
    let match;

    while ((match = tokenRegex.exec(htmlFragment)) !== null) {
      const token = match[0];
      if (token.startsWith("<!--")) continue;
      if (token.startsWith("</")) {
        const closeTag = token.slice(2, -1).trim().toLowerCase();
        for (let i = stack.length - 1; i >= 0; i--) {
          const popped = stack.pop();
          if (popped.isAriaHidden) hiddenDepth -= 1;
          if (popped.tagName === closeTag) break;
        }
        continue;
      }
      if (token.startsWith("<")) {
        const tagMatch = token.match(
          /^<([A-Za-z][A-Za-z0-9-]*)([\s\S]*?)(\/?)>$/
        );
        if (!tagMatch) continue;
        const tagName = tagMatch[1].toLowerCase();
        const selfClosing =
          tagMatch[3] === "/" || VOID_HTML_TAGS.has(tagName);
        if (!selfClosing) {
          const attrs = parseHtmlAttributes(tagMatch[2]);
          const isAriaHidden = attrs.get("aria-hidden") === "true";
          stack.push({ tagName, isAriaHidden });
          if (isAriaHidden) hiddenDepth += 1;
        }
        continue;
      }
      const decoded = decodeHtmlEntities(token);
      if (hiddenDepth > 0) hidden += decoded;
      else accessible += decoded;
    }
    return { accessible, hidden };
  }

  const wholeDoc = splitAccessibleAndHidden(raw);
  assert.doesNotMatch(
    wholeDoc.accessible,
    /#/,
    "Accessibility tree (text outside aria-hidden='true') must not contain ASCII '#' progress bar symbols"
  );

  const skillLines = skillsRaw
    .split(/\r?\n/)
    .filter((line) => /\(\d+%\)/.test(line));
  assert.equal(
    skillLines.length,
    45,
    "Expected 45 skill lines with percentage labels in about_Skills.txt"
  );

  let hiddenBarLines = 0;
  let totalHiddenHashes = 0;
  for (const line of skillLines) {
    assert.match(
      line,
      /aria-hidden\s*=\s*["']true["']/i,
      `Skill bar line must wrap '#' blocks in aria-hidden="true": ${line}`
    );
    const { accessible, hidden } = splitAccessibleAndHidden(line);
    assert.doesNotMatch(
      accessible,
      /#/,
      `Accessible text on skill line must not include '#': ${accessible}`
    );
    assert.match(
      accessible,
      /:\s*\(\d+%\)/,
      `Skill name and percentage must remain readable in accessible text: ${accessible}`
    );
    const hashes = (hidden.match(/#/g) ?? []).length;
    assert.equal(
      hashes,
      20,
      `Expected 20 hidden '#' symbols on skill line, found ${hashes}: ${line}`
    );
    hiddenBarLines += 1;
    totalHiddenHashes += hashes;
  }

  assert.equal(hiddenBarLines, 45);
  assert.equal(totalHiddenHashes, 900);

  for (const skill of ALL_SKILLS) {
    const pattern = new RegExp(
      `(?<![A-Za-z0-9])${escapeRegExp(skill)}(?![A-Za-z0-9]):\\s*\\(\\d+%\\)`
    );
    assert.match(
      wholeDoc.accessible,
      pattern,
      `Skill '${skill}: (XX%)' must remain readable in accessibility tree`
    );
  }
});

test("14. Zero External jQuery Dependency (index.html, index.js) runs pure vanilla DOM without $ or jQuery", async () => {
  const html = readSource("index.html");
  const js = readSource("index.js");

  assert.doesNotMatch(
    html,
    /<script\b[^>]*src\s*=\s*["'][^"']*(?:ajax\.googleapis\.com|jquery)[^"']*["']/i,
    "index.html must not load jQuery or external script from ajax.googleapis.com"
  );

  const jsWithoutComments = js.replace(
    /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/.*$/gm,
    (m) => (m.startsWith("/") ? "" : m)
  );
  assert.doesNotMatch(
    jsWithoutComments,
    /\bjQuery\b|(?:^|[^.\w$])\$\s*\(/m,
    "index.js must use vanilla DOM APIs only without jQuery or $()"
  );

  const payload = "Sowmik Shovon Karmakar\nZero jQuery Vanilla DOM!";
  const env = createTerminalVm({ payload, withJquery: false });
  assert.equal(env.sandbox.$, undefined);
  assert.equal(env.sandbox.jQuery, undefined);

  await env.settleFetch();
  env.dispatchEscape();

  assert.ok(
    env.consoleElement.innerHTML.includes("Zero jQuery Vanilla DOM!"),
    "index.js must render full portfolio in VM without $ or jQuery"
  );
});

test("15. Interactive Post-Load Terminal Prompt (index.js) mounts prompt and executes 'help' and 'projects' commands", async () => {
  const findVisiblePromptInput = (doc) => {
    const candidates = doc.querySelectorAll("input");
    return (
      candidates.find((el) => {
        const inTerminal =
          Boolean(el.closest("#console")) ||
          Boolean(el.closest("#terminal-prompt")) ||
          Boolean(doc.getElementById("terminal-prompt")?.contains(el));
        return inTerminal && isElementVisible(el);
      }) ?? null
    );
  };

  // A) Normal typing completion mounts prompt
  const normalEnv = createTerminalVm({ payload: "Hello Terminal!" });
  await normalEnv.settleFetch();
  for (let i = 0; i < 20; i++) {
    const typingTimer = normalEnv.getTypingTimer();
    if (!typingTimer) break;
    typingTimer.fn();
  }
  assert.ok(
    findVisiblePromptInput(normalEnv.docStub),
    "Interactive command prompt <input> must mount after normal typing completion"
  );

  // B) Escape completion with full sowmikshovon.txt mounts prompt & handles commands
  const rawPayload = readSource("sowmikshovon.txt");
  const env = createTerminalVm({ payload: rawPayload });
  await env.settleFetch();
  env.dispatchEscape();

  const input = findVisiblePromptInput(env.docStub);
  assert.ok(
    input,
    "Interactive command prompt <input> inside #console or #terminal-prompt must mount after Escape completion"
  );

  const runCommand = (cmd) => {
    input.value = cmd;
    input.dispatchEvent(new env.sandbox.Event("input", { target: input }));

    const keyEv = new env.sandbox.Event("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      target: input,
    });
    input.dispatchEvent(keyEv);

    const form = input.closest("form");
    if (form && !keyEv.defaultPrevented) {
      const submitEv = new env.sandbox.Event("submit", { target: form });
      form.dispatchEvent(submitEv);
      assert.equal(
        submitEv.defaultPrevented,
        true,
        `Submitting '${cmd}' inside <form> must call preventDefault() to stay on the page`
      );
    }
  };

  const beforeHelp = env.docStub.body.textContent;
  runCommand("help");
  const afterHelp = env.docStub.body.textContent;
  const helpOutput = extractInsertedText(beforeHelp, afterHelp);

  assert.ok(
    helpOutput.trim().length > 0,
    "Dispatching 'help' must output a response into the terminal"
  );
  for (const cmd of [
    "help",
    "ls",
    "skills",
    "projects",
    "cv",
    "contact",
    "about",
    "experience",
    "clear",
    "replay",
  ]) {
    assert.match(
      helpOutput,
      new RegExp(`\\b${cmd}\\b`, "i"),
      `'help' response must document '${cmd}' command`
    );
  }

  const beforeProjects = env.docStub.body.textContent;
  runCommand("projects");
  const afterProjects = env.docStub.body.textContent;
  const projectsOutput = extractInsertedText(beforeProjects, afterProjects);

  assert.ok(
    projectsOutput.includes("Azure Cloud Platform IaC") &&
      projectsOutput.includes("Spotify Full-Stack Clone") &&
      projectsOutput.includes("Terminal Portfolio"),
    "Dispatching 'projects' must output project details into the terminal"
  );
  assert.equal(
    env.winStub.location.href,
    "http://localhost/",
    "Running terminal commands must not navigate away from the page"
  );
});
