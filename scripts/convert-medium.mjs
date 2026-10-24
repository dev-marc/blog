// Zet de Medium-export (HTML) om naar Jekyll-posts in _posts/ en
// downloadt afbeeldingen naar assets/images/<slug>/.
//
// Gebruik (vanuit scripts/):
//   npm install
//   npm run convert                 # standaard: ../.export/posts
//   node convert-medium.mjs <map-met-posts>

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INPUT_DIR = path.resolve(process.argv[2] ?? path.join(ROOT, ".export", "posts"));
const POSTS_DIR = path.join(ROOT, "_posts");
const IMAGES_DIR = path.join(ROOT, "assets", "images");

// De export bevat geen tags; die staan hier per slug.
const TAGS = {
  "migrating-corsozundert-nl-to-azure": ["azure", "migration"],
  "breaking-up-the-big-application": ["architecture", "microservices"],
  "running-a-net-core-application-in-an-azure-container-instance": ["dotnet", "docker", "azure"],
  "add-ssl-to-azure-web-app-using-letsencrypt": ["azure", "ssl", "letsencrypt"],
  "setting-up-an-azure-kubernetes-cluster-for-a-net-core-mvc-app": ["kubernetes", "azure", "dotnet"],
  "using-the-power-of-apache-fop-in-a-net-world-using-azure-functions": ["dotnet", "azure-functions", "java"],
  "deploy-a-net-core-webjob-within-azure-devops": ["dotnet", "azure-devops", "azure"],
  "recipe-angular-app-on-azure-storage-with-custom-domain-and-ssl-using-azure-cdn": ["angular", "azure", "cdn"],
};

// Taal per codeblok als de heuristiek het mis heeft: { "<slug>": { <index>: "taal" } }
const LANG_OVERRIDES = {};

function guessLanguage(code) {
  const first = code.trimStart();
  if (/^(FROM|RUN|WORKDIR|COPY|ENTRYPOINT|# Build runtime image)\b/m.test(first) && /^FROM /m.test(code)) return "dockerfile";
  if (/^<\?xml|^<[a-zA-Z]/.test(first)) return "xml";
  if (/^apiVersion:/.test(first)) return "yaml";
  if (/^(sudo|docker|kubectl|az|npm|dotnet|git|curl) /.test(first)) return "bash";
  if (/^(const|let|var|function|\/\/)\b|require\(/.test(first)) return "javascript";
  if (/^using \(|^(public|private|namespace)\b/.test(first)) return "csharp";
  return "text";
}

function slugFromCanonical(url, fallback) {
  const last = (url ?? "").split("/").filter(Boolean).pop() ?? fallback;
  return slugify(last.replace(/-[0-9a-f]{10,12}$/, ""));
}

function slugify(s) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function yamlString(s) {
  return JSON.stringify(s);
}

async function download(urls, dest) {
  if (fs.existsSync(dest)) return true;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      return true;
    } catch {
      // volgende URL proberen
    }
  }
  return false;
}

// Gist: bestanden inline als codeblok plus link. Overige embeds: alleen een link.
async function embedMarkdown(src) {
  const gist = src.match(/gist\.github\.com\/(?:[^/]+\/)?([0-9a-f]+)/);
  if (!gist) {
    console.warn(`  ! embed vervangen door link: ${src}`);
    return `[View embed](${src})`;
  }
  try {
    const res = await fetch(`https://api.github.com/gists/${gist[1]}`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const blocks = Object.values(data.files).map((f) => {
      const lang = (f.language ?? "text").toLowerCase().replace(/\s+/g, "");
      return `\`\`\`${lang}\n${f.content.replace(/\r\n/g, "\n").trimEnd()}\n\`\`\``;
    });
    return `${blocks.join("\n\n")}\n\n[View on GitHub Gist](${data.html_url})`;
  } catch (e) {
    console.warn(`  ! gist niet opgehaald (${e.message}), alleen link: ${src}`);
    return `[View on GitHub Gist](https://gist.github.com/${gist[1]})`;
  }
}

function codeText($, el) {
  const $el = $(el).clone();
  $el.find("br").replaceWith("\n");
  return $el.text().split("\n").map((l) => l.trimEnd()).join("\n");
}

async function convertPost(file) {
  const $ = cheerio.load(fs.readFileSync(file, "utf8"));

  const title = $("h1.p-name").first().text().trim();
  const date = ($("time.dt-published").attr("datetime") ?? "").slice(0, 10);
  const canonical = $("a.p-canonical").attr("href") ?? "";
  const description = $('section[data-field="subtitle"]').text().trim();
  const slug = slugFromCanonical(canonical, path.basename(file, ".html"));

  const body = $('section[data-field="body"]');

  // Titel staat al in de front matter; eerste sectiescheiding is overbodig.
  body.find(".graf--title, .graf--subtitle").remove();
  body.find("hr.section-divider").first().remove();
  body.find("div.section-divider").each((_, el) => {
    if (!$(el).find("hr").length) $(el).remove();
  });

  // <br> aan het eind van <strong>/<em> naar buiten verplaatsen, anders breekt de markdown.
  body.find("strong, em").each((_, el) => {
    const last = $(el).contents().last();
    if (last.is("br")) {
      last.remove();
      $(el).after("<br>");
    }
  });

  // Opeenvolgende <pre>-blokken (Medium splitst die) samenvoegen tot één codeblok.
  const codeBlocks = [];
  body.find("pre").each((_, el) => {
    const prev = $(el).prev();
    if (prev.is("pre") && prev.attr("data-merged") !== undefined) {
      const idx = Number(prev.attr("data-merged"));
      codeBlocks[idx] += "\n\n" + codeText($, el);
      $(el).remove();
      return;
    }
    codeBlocks.push(codeText($, el));
    $(el).attr("data-merged", String(codeBlocks.length - 1));
  });
  body.find("pre[data-merged]").each((_, el) => {
    $(el).replaceWith(`<div class="codeblock" data-idx="${$(el).attr("data-merged")}">code</div>`);
  });

  // Afbeeldingen lokaal opslaan; embeds vervangen door codeblok of link.
  const imgDir = path.join(IMAGES_DIR, slug);
  const figures = [];
  for (const el of body.find("figure").toArray()) {
    const img = $(el).find("img").first();
    const caption = $(el).find("figcaption").text().trim();
    const embedSrc = $(el).find("script[src], iframe[src]").first().attr("src");
    if (embedSrc) {
      figures.push({ markdown: await embedMarkdown(embedSrc) });
    } else if (!img.length) {
      figures.push(null);
    } else {
      const id = img.attr("data-image-id");
      const src = img.attr("src");
      const name = slugify(path.parse(id).name) + path.extname(id).toLowerCase();
      fs.mkdirSync(imgDir, { recursive: true });
      const ok = await download(
        [`https://cdn-images-1.medium.com/max/1600/${id}`, src],
        path.join(imgDir, name),
      );
      if (!ok) console.warn(`  ! afbeelding niet gedownload: ${src}`);
      figures.push({ file: `/assets/images/${slug}/${name}`, caption });
    }
    $(el).replaceWith(`<div class="figure" data-idx="${figures.length - 1}">figure</div>`);
  }

  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "*",
    hr: "---",
  });
  // Medium gebruikt h3 als grote en h4 als kleine tussenkop.
  td.addRule("headings", {
    filter: ["h3", "h4"],
    replacement: (content, node) => `\n\n${node.nodeName === "H3" ? "##" : "###"} ${content.trim()}\n\n`,
  });
  let codeIndex = 0;
  td.addRule("codeblock", {
    filter: (node) => node.nodeName === "DIV" && node.getAttribute("class") === "codeblock",
    replacement: (_, node) => {
      const code = codeBlocks[Number(node.getAttribute("data-idx"))];
      const lang = LANG_OVERRIDES[slug]?.[codeIndex] ?? guessLanguage(code);
      codeIndex++;
      return `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    },
  });
  td.addRule("figure", {
    filter: (node) => node.nodeName === "DIV" && node.getAttribute("class") === "figure",
    replacement: (_, node) => {
      const fig = figures[Number(node.getAttribute("data-idx"))];
      if (!fig) return "";
      if (fig.markdown) return `\n\n${fig.markdown}\n\n`;
      const alt = fig.caption.replace(/[\[\]]/g, "");
      const img = `![${alt}]({{ "${fig.file}" | relative_url }})`;
      return `\n\n${img}${fig.caption ? `\n*${fig.caption}*` : ""}\n\n`;
    },
  });

  const markdown = td
    .turndown(body.html())
    .replace(/^(-|\d+\.) {2,}/gm, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const frontMatter = [
    "---",
    "layout: post",
    `title: ${yamlString(title)}`,
    `date: ${date}`,
    `tags: [${(TAGS[slug] ?? []).join(", ")}]`,
    `description: ${yamlString(description)}`,
    `original_url: ${yamlString(canonical)}`,
    "---",
  ].join("\n");

  const out = path.join(POSTS_DIR, `${date}-${slug}.md`);
  fs.writeFileSync(out, `${frontMatter}\n\n${markdown}\n`);
  console.log(`✓ ${path.relative(ROOT, out)} (${codeBlocks.length} codeblokken, ${figures.length} afbeeldingen)`);
}

fs.mkdirSync(POSTS_DIR, { recursive: true });
const files = fs
  .readdirSync(INPUT_DIR)
  .filter((f) => f.endsWith(".html") && !f.startsWith("draft_"))
  .sort();

for (const f of files) {
  await convertPost(path.join(INPUT_DIR, f));
}
