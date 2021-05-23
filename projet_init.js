// Version rendu

const {openDb} = require("./projet_db")
const tablesNames = ["user","lien","message","votes"]


async function createusername(db){
    await db.run(`
    INSERT INTO user (username,mailaddress,secretcode,isAdmin) VALUES("Max","Max@mail.com","Max",0),
    ("Bob","Bob@mail.com","Bob",0);
    `)
}

async function createlink(db){
    await db.run(`
    INSERT INTO lien (Title,Content,user_id,votes) VALUES("Magnifique site","https://www.google.fr","1","1")
    `)
}

async function createmessage(db){
  await db.run(`
  INSERT INTO message (Content,user_id,lien_id,votes) VALUES("Excellent site pour faire des recherches !","2","1","1")
  `)
}

async function createupvote(db){
    await db.run(`
    INSERT INTO votes (lien_id, response_id, user_id, type) VALUES (1,0,2,1), (1,1,1,1)`)
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
      votes int(11) NOT NULL,
      FOREIGN KEY	(user_id) REFERENCES user (id)
      FOREIGN KEY (lien_id) REFERENCES lien (id)
      );   

`) 
    // Pour les upvotes et les downvotes
    // lien_id représente le post sur lequel on vote
    // response_id représente le commentaire de l'upvote.
    // Si le champ response_id vaut 0, le vote revient au post initial.
    const votes = db.run(`
      CREATE TABLE IF NOT EXISTS votes(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lien_id INT(10) NOT NULL,
        user_id INT(10) NOT NULL,
        response_id INT(10) NOT NULL,
        type INT(2) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user (id)
        FOREIGN KEY (lien_id) REFERENCES lien (id)
        FOREIGN KEY (response_id) REFERENCES message (id)
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
    await createupvote(db)
  })()
