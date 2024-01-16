let rules = [
  ["ꜣ", "A"],
  ["ꞽ", "i"],
  ["ꜥ", "a"],  
  ["w", "w"],
  ["b", "b"],
  ["p", "p"],
  ["f", "f"],
  ["m", "m"],
  ["n", "n"],
  ["h", "h"],
  ["ḥ", "H"],
  ["ḫ", "x"],
  ["ẖ", "X"],
  ["s", "s"],
  ["š", "S"],
  ["ḳ", "q"],
  ["k", "k"],
  ["g", "g"],
  ["t", "t"],
  ["ṯ", "T"],
  ["d", "d"],
  ["ḏ", "D"]
]
.map(([egyptological, mdc]) => ({egyptological, mdc}))

let transliterate = plaintext => {
  if(!plaintext)  return plaintext
  let transliterated = rules
    .reduce((transliterated, {egyptological, mdc}) => {
      return transliterated.replaceAll(new RegExp(mdc, "g"), egyptological)
    }, plaintext)
  
  return transliterated
}

let hieroglyphs = JSON.parse(
  await Deno.readTextFile("./hieroglyphs.json"),
).hieroglyphs

let changes = hieroglyphs
  .map(h => ({
    match: {hieroglyph: h.hieroglyph},
    data: {egyptological: transliterate(h.mdc)},
  }) 
)

let changeset = {
  description: "Derive egyptological transliteration from Manuel de Codage transliteration",
  changes: changes.map(({match,data}) => ({
    operation: "update",
    path: ["hieroglyphs"],
    match,
    data
  }))
}

await Deno.writeTextFile(
  `007-add-transliterated-mdc.changeset.json`,
  JSON.stringify(changeset, null, 2),
);
