import {walk} from 'https://deno.land/std/fs/mod.ts'

const applyChangesetToDatabase = (db, changeset) => {
  changeset.changes.forEach((change) => {
    if (change.operation === "add") {
      // Handle adding data at the root of the database
      if (change.path.length === 0 || change.path[0] === "/") {
        db = { ...db, ...change.data }
      } // Handle adding data to a specific path within the database
      else {
        let target = db
        let pathLength = change.path.length

        change.path.slice(0, pathLength - 1).forEach((key) => {
          if (!target[key]) {
            target[key] = {} // Initialize a new object if the key does not exist
          }
          target = target[key]
        })

        let lastKey = change.path[pathLength - 1]
        if (Array.isArray(target[lastKey])) {
          target[lastKey] = [...target[lastKey], ...change.data]
        } else {
          target[lastKey] = change.data
        }
      }
    } // Handle 'update' operation
    else if (change.operation === "update") {
      let targetArray = change.path.slice(0, -1).reduce(
        (acc, key) => acc[key],
        db,
      )
      let lastKey = change.path[change.path.length - 1]
      let itemsToUpdate = targetArray[lastKey]

      if (Array.isArray(itemsToUpdate)) {
        // Bulk update all items if no match criteria is provided
        if (!change.match || Object.keys(change.match).length === 0) {
          itemsToUpdate.forEach((item) => Object.assign(item, change.data))
        } // Update specific items based on match criteria
        else {
          itemsToUpdate.forEach((item) => {
            if (
              Object.keys(change.match).every((key) =>
                item[key] === change.match[key]
              )
            ) {
              Object.assign(item, change.data)
            }
          })
        }
      }
    }
  })

  return db
}

let runChangesets = config => {
  if (!config || !config.metadata || !config.dbFile || !config.changesetFiles) {
    throw new Error('Invalid configuration: missing metadata, dbFile, or changesetFiles');
  }

  let {metadata, dbFile, changesetFiles} = config;
  
  let db = changesetFiles.reduce((db, changesetFile) => {
    let changeset;
    try {
      changeset = JSON.parse(Deno.readTextFileSync(changesetFile));
    } catch (error) {
      throw new Error(`Invalid JSON in changeset file: ${changesetFile}`);
    }

    return applyChangesetToDatabase(db, changeset);
  }, {});

  Deno.writeTextFileSync(dbFile, JSON.stringify(db, null, 2));
}

if(import.meta.main){
  let config
  for await (const entry of walk(Deno.cwd())) {
    if (entry.path.endsWith('.delta.json') || entry.path == 'delta.json') {
      try {
        config = JSON.parse(Deno.readTextFileSync(entry.path))
        break; // stop looking after finding the first config file
      } catch (error) {
        throw new Error(`Error parsing JSON from file ${entry.path}: ${error.message}`)
      }
    }
  }

  if(!config) throw new Error(`No .delta.json or delta.json file found in directory ${Deno.cwd()}`)

  runChangesets(config)
}