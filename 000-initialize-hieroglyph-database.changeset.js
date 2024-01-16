const emptyDb = {
  "metadata": {
    "title": "Extracted signs from Wikipedia ‘List of Egyptian hieroglyphs’",
    "source": "Gardiner, Wikipedia",
    "url": "https://en.wikipedia.org/wiki/List_of_Egyptian_hieroglyphs",
    "parsedWith": "parse-wikipedia-list-of-egyptian-hieroglyphs.js",
    "name": "hieroglyphs",
    "description":
      "A composite file containing various kinds of data about Egyptian hieroglyphs available in Unicode. (Thus does not include extended hieroglyphs.)",
  },
  "hieroglyphs": [],
};

let changeset = {
  "description": "Initialize the hieroglyphs database with metadata.",
  "date": new Date().toISOString(),
  changes: [
    {
      operation: "add",
      path: "/",
      data: emptyDb,
    },
  ],
};

await Deno.writeTextFile(
  "000-initialize-hieroglyph-database.changeset.json",
  JSON.stringify(changeset, null, 2),
);
