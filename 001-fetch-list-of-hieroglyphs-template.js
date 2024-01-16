// URL of the Wikipedia API
const apiUrl = "https://en.wikipedia.org/w/api.php";

// Parameters for the API request
const params = new URLSearchParams({
  action: "query",
  titles: "Template:List_of_hieroglyphs",
  prop: "revisions",
  rvprop: "content",
  format: "json",
});

// Function to fetch the template wikitext
async function fetchTemplateWikitext() {
  try {
    const response = await fetch(`${apiUrl}?${params}`);
    const data = await response.json();
    // Accessing the wikitext
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const content = pages[pageId].revisions[0]["*"];
    return content;
  } catch (error) {
    console.error("Error fetching template wikitext:", error);
  }
}

let wikitext = await fetchTemplateWikitext();
await Deno.writeTextFile("List_of_hieroglyphs.wikitext.txt", wikitext);

let chunks = wikitext.split(/\n\n+/g).filter(Boolean);

let hieroChunks = chunks.filter((c) => c.includes(`{{List of hieroglyphs/row`));

// const labels ={
//   "H": "hieroglyph",
//   "gardiner": "gardiner",
//   "unicode": "131AC",
//   "desc": "description",
//   "/^T[0-9]/": "transliterations",
//   "pron": "pronunciation",
//   "notes": "notes"
// }

let parseHieroChunk = (chunk) => {
  let hieroglyph = chunk
    .replaceAll(/(\|[a-z]+=)/g, "\n$1")
    .split("\n")
    .filter(Boolean)
    .filter((chunk) => chunk.startsWith("|"))
    .reduce((h, line) => {
      let [key, value] = line.split("=");
      key = key.slice(1);
      value = value.trim();
      value = value.replaceAll("<br />", " ");
      if (value.trim().length === 0) return h;

      if (key.startsWith("tl")) {
        if (!h.transliterations) h.transliterations = [];
        h.transliterations.push(value);
      } else if (key == "H") {
        h.hieroglyph = value;
      } else if (key == "unicode") {
        h.unicode = value;
      } else if (key == "desc") {
        h.description = value;
      } else if (key == "pron") {
        h.pronunciation = value;
      } else if (key == "notes") {
        h.notes = value;
      } else if (key == "gardiner") {
        h.gardiner = value;
      }
      return h;
    }, {});

  hieroglyph = Object.assign(
    {
      hieroglyph: "",
      unicode: "",
      description: "",
      pronunciation: "",
      notes: "",
      gardiner: "",
      transliterations: [],
    },
    hieroglyph,
  );

  return hieroglyph;
};

let hieroglyphs = hieroChunks.map(parseHieroChunk);

let changeset = {
  description: "Extract hieroglyphs from Wikipedia template wikitext",
  date: new Date().toISOString(),
  changes: [
    {
      operation: "add",
      path: "/",
      data: hieroglyphs,
    },
  ],
};
// hieroglyphs = hieroglyphs.slice(0,3)

await Deno.writeTextFile(
  "001-fetch-list-of-hieroglyphs-template.changeset.json",
  JSON.stringify(changeset, null, 2),
);
