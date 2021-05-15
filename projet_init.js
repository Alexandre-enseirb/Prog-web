const {openDb} = require("./projet_db")
const tablesNames = ["user","lien","message"]


async function createusername(db){
    await db.run(`
    INSERT INTO user (username,mailaddress,secretcode,isAdmin) VALUES("Yixin","lyx990816@gmail.com","donttouch",1),
    ("Alexandre","alexandre@gmail.com","qwerty",0);
    `)
}

async function createlink(db){
    await db.run(`
    INSERT INTO lien (Title,Content,user_id,votes) VALUES("first article","How are you ?","1","0")
    `)
}

async function createmessage(db){
  await db.run(`
  INSERT INTO message (Content,user_id,lien_id) VALUES("I'm fine thank you ","2","1")
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
        votes int(11) NOT NULL,
        FOREIGN KEY	(user_id) REFERENCES user (id)

       );   
`) 
    const messagelist = db.run(`
    CREATE TABLE IF NOT EXISTS message(
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      Content varchar(200) NOT NULL,
      lien_id INT(10) NOT NULL,
      user_id INT(10) NOT NULL,
      FOREIGN KEY	(user_id) REFERENCES user (id)
      FOREIGN KEY (user_id) REFERENCES lien (id)
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
    await createlink(db)
    await createmessage(db)
  })()
