const {openDb} = require("./projet_db")
const tablesNames = ["user","lien"]


async function createusername(db){
    await db.run(`
    INSERT INTO user (username,mailaddress,secretcode,isAdmin) VALUES("Yixin","lyx990816@gmail.com","donttouch",1)
    `)
}

async function createlink(db){
    await db.run(`
    INSERT INTO lien (Title,content,user_id) VALUES("fisrt_article","Helloworld","1")
    `)
}



async function createTables(db){
   const userlist = db.run(`
     CREATE TABLE IF NOT EXISTS user(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        username varchar(255),
        mailaddress varchar(255),
        secretcode varchar(255),
        isAdmin int(1)
       );   
`) //isAdmin correspond au fait de pouvoir editer tous les posts
      // comme dans le TP précédent
      // A voir si on le gardera
      
   const lienlist = db.run(`
     CREATE TABLE IF NOT EXISTS lien(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        Title varchar(255),
        Content varchar(255),
        user_id int(11) NOT NULL,
        FOREIGN KEY	(user_id) REFERENCES user (id)

       );   
`) 
   return await Promise.all([userlist,lienlist])
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