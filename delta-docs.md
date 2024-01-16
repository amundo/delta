---
title: delta.js documentation
author: Patrick Hall
---

## Overview

I like managing databases as `JSON` files. I also like being able to keep track of where individual bits of data come from in a `JSON` database, since I often find myself working to merging multiple sources together. 

`delta.js` is a script that is intended to formalize this sort of process by representing changes as _changesets_, and then providing code that applies those changes to a database. 

The list of changeset files is contained in a “delta file”, which can be named simply `delta.json` or `<whatever>.delta.json`. Here’s what a delta file looks like:

```json
{
  "metadata": {
    "title": "Hieroglyph database",
    "description": "A database of hieroglyphs and their metadata, including transliterations, MDC mnemonics, and frequency counts."
  },
  "dbFile": "hieroglyphs.json",
  "changesetFiles": [
    "000-initialize-hieroglyph-database.changeset.json",
    "001-fetch-list-of-hieroglyphs-template.changeset.json",
    "003-initialize-tags.changeset.json",
    "004-tag-betro-hieroglyphs.changeset.json",
    "005-initialize-mdc-mnemonics.changeset.json",
    "006-add-mdc-mnemonics.changeset.json",
    "007-add-transliterated-mdc.changeset.json"
  ]
}
```

As you can see, the file contains a single `JSON` object. There are three properties in the object:

- `metadata`: This is a JSON object containing metadata about the database. It can contain any number of key-value pairs.
- `dbFile`: This is the name of the database file. It should be a `.json` file.
- `changesetFiles`: This is an array of changeset files. Each changeset file should be a `.changeset.json` file.

Here’s what a changeset file looks like, in this case `000-initialize-hieroglyph-database.changeset.json`:

```json

{
  "description": "Initialize the hieroglyphs database with metadata.",
  "date": "2023-12-11T01:50:28.196Z",
  "changes": [
    {
      "operation": "add",
      "path": [],
      "data": {
        "metadata": {
          "title": "Extracted signs from Wikipedia ‘List of Egyptian hieroglyphs’",
          "source": "Gardiner, Wikipedia",
          "url": "https://en.wikipedia.org/wiki/List_of_Egyptian_hieroglyphs",
          "parsedWith": "parse-wikipedia-list-of-egyptian-hieroglyphs.js",
          "name": "hieroglyphs",
          "description": "A composite file containing various kinds of data about Egyptian hieroglyphs available in Unicode. (Thus does not include extended hieroglyphs.)"
        },
        "hieroglyphs": []
      }
    }
  ]
}

```

Note that this changeset contains a `path` property with the value `[]`. This means that the data should be added to the root of the database. The `data` property contains the data to be added to the database.

This changeset can be run with a delta file that looks like this:

```json
{
  "metadata": {
    "title": "Hieroglyph database",
    "description": "A database of hieroglyphs and their metadata, including transliterations, MDC mnemonics, and frequency counts."
  },
  "dbFile": "hieroglyphs.json",
  "changesetFiles": [
    "000-initialize-hieroglyph-database.changeset.json"
  ]
}
```

Now that delta file can be run as follows:

```bash
$ deno run --allow-read --allow-write delta.js
```

`delta.js` will look for a `.delta.json` or `delta.json` file in the current directory. It will then run all of the changesets specified in the delta file. In this case, it will run the `000-initialize-hieroglyph-database.changeset.json` changeset, which will initialize the database, producing this file:

```json
{
  "metadata": {
    "title": "Extracted signs from Wikipedia ‘List of Egyptian hieroglyphs’",
    "source": "Gardiner, Wikipedia",
    "url": "https://en.wikipedia.org/wiki/List_of_Egyptian_hieroglyphs",
    "name": "hieroglyphs",
    "description": "A composite file containing various kinds of data about Egyptian hieroglyphs available in Unicode. (Thus does not include extended hieroglyphs.)"
  },
  "hieroglyphs": []
}
```

## Change objects

Note that the changeset above contains a `changes` array. Each element in the array is a change object. A change object has three properties:

- `operation`: This is the operation to perform on the database. It can be one of the following:
  - `add`: Add the data to the database at the paths.
  - `update`: Update the data in the database at the path.
- `path`: This is an array of strings representing the path to the data in the database. For example, if the data is at `db.hieroglyphs[0].name`, the path would be `["hieroglyphs", "0", "name"]`.

The following changeset (`003-initialize-tags.changeset.json`) adds an empty `tags` array to each hieroglyph in the array at the path ["hieroglyphs"]:

```json
{
  "description": "Add empty tags array",
  "changes": [
    {
      "operation": "update",
      "path": [
        "hieroglyphs"
      ],
      "data": {
        "tags": []
      }
    }
  ]
}

```

In this case, I simply wrote the changeset by hand. In other, more complicated cases, I write a script alongside the changeset, with the `.json` suffix replaced by `.js`. Running each of those generation scripts outputs a `.changeset.json` file, whose file name can be added to the delta file and run. 


## `match` query objects

To apply a change to an object in an array, we use a `match` object. 

Here is a very clumsy changeset that looks for certain objects with a particular field (`hieroglyph`) having a particular value (a particular Unicode hieroglyph), and which then applies a tag to that object’s `tags` array.

(A better operation type would probably be in order here.)

```json
{
  "description": "Tag hieroglyphs found in Maria Carmella Betrò “Hieroglyphics: The Writings of Ancient Egypt” as betro",
  "changes": [
    {
      "operation": "update",
      "path": [
        "hieroglyphs"
      ],
      "match": {
        "hieroglyph": "𓀀"
      },
      "data": {
        "tags": [
          "betro"
        ]
      }
    },
    {
      "operation": "update",
      "path": [
        "hieroglyphs"
      ],
      "match": {
        "hieroglyph": "𓏢"
      },
      "data": {
        "tags": [
          "betro"
        ]
      }
    },
    // a few hundred more…
    {
      "operation": "update",
      "path": [
        "hieroglyphs"
      ],
      "match": {
        "hieroglyph": "𓏣"
      },
      "data": {
        "tags": [
          "betro"
        ]
      }
    }
  ]
}
```

## Usage

To use `delta.js`, run the script with `deno`. The script will look for a `.delta.json` or `delta.json` file in the current directory or its subdirectories. 


## Functions

In the current implementation `delta.js` just has two functions:

### `applyChangesetToDatabase(db, changeset)`

This function applies a changeset to a database. It takes two arguments:

- `db`: The database to which the changeset should be applied.
- `changeset`: The changeset to apply to the database.

### `runChangesets(config)`

This function runs all changesets specified in the configuration. It takes one argument:

- `config`: The configuration specifying the changesets to run.


## Example

To run `delta.js`, navigate to the directory containing your `.delta.json` or `delta.json` file and run the following command:

```bash
$ deno run --allow-read --allow-write
```


## Installing

You can also install `delta.js`:

```bash
$ deno install --allow-read --allow-write https://pathall.net/modules/delta/v0.0.1/delta.js
```

This will install `delta.js` in your `~/.deno/bin` directory. You can then run it from anywhere on your system, like this:

```bash  
$ delta
```

