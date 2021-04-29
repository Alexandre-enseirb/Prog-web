const {openDb} = require("./projet_db")
const tablesNames = ["user"]


async function createusername(db){
    await db.run(`
    INSERT INTO user (username,mailaddress,secretcode) VALUES("hello","lyx990816@gmail.com","donttouch")
    `)
  }


async function createTables(db){
   const userlist = db.run(`
     CREATE TABLE IF NOT EXISTS user(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        username varchar(255),
        mailaddress varchar(255),
        secretcode varchar(255)

       );   
`) 
   return await Promise.all([userlist])
}

async function dropTables(db){
    return await Promise.all(tablesNames.map( tableName => {
        return db.run(`DROP TABLE IF EXISTS ${tableName}`)
      }
    ))
  }
  
  (async () => {
    // open the database
    let db = await openDb()
    await dropTables(db)
    await createTables(db)
    await createusername(db)
  })()
  