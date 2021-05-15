// requirements and vars
const express = require('express'); // equivaut a un include
const bodyParser = require('body-parser');
const app = express() //express sans argument : cree une app?
const port = 3000
const session = require("express-session");
let hasSQLite=false;
try{
    const SQLiteStore = require('connect-sqlite3')(session);
    hasSQLite=true;
}catch(e){
    console.log("connect-sqlite3 wasn't found. Aborting.")
}
const {openDb} = require("./projet_db")

const userAdmin=["root","retel","admin@test.com"];

const sess={
    //store: new SQLiteStore,
    secret: 'secret key',
    resave: true,
    rolling: true,
    admin: false,
    name: undefined,
    logged: false,
    cookie: {
        maxAge: 10000*3600
    },
    saveUnitialized: true
}

if (hasSQLite){
    sess.store=new SQLiteStore
}

// app setup
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static("public")); // not mine, for image display
app.use(session(sess))
app.set('views', './views'); //les views sont dans le dossier views
app.set('view engine', 'jade');
//on a mis ces 2 lignes apres avoir installé jade



app.get("/",(req,res)=>{
    // main redirection for the website
    res.redirect("/home");
})

app.get('/inscription',async(req, res) =>{
    let data={};
    if (req.session.logged){
        data={
            logged: true
        }
    }
    if (req.query.shortuname){
        data={
            shortUsername: true
        }
    }
    if (req.query.nomail){
        data={
            nomail: true
        }
    }
    if (req.query.nopasswd){
        data={
            nopasswd: true
        }
    }
    const db = await openDb()
    const id = req.params.id // ?
    const users = await db.all(`
    SELECT * FROM user
    `,[id])
    console.log(users)
    data.user=users;
    res.render("inscription",data)
})


app.post('/inscriptionadd',async(req,res)=>{
    const nameInBody = req.body.username
    const addressInBody = req.body.address
    const secretInBody = req.body.secretcode
    let isAdmin;
    
    if(nameInBody.length>=4){ // check for uname length
        req.params.username = nameInBody;
    
        if(addressInBody.indexOf(".com")!= -1){ // verify that mail is valid
            req.params.address = addressInBody;
            
            if(secretInBody){ // verify passwd has been entered
                req.params.secretcode = secretInBody;
                //console.log(req.body.username.length)
                req.session.name=nameInBody;
                const db = await openDb()
                const id = req.params.id
                if (nameInBody==userAdmin[0] && secretInBody==userAdmin[1] && addressInBody==userAdmin[2]){
                    req.session.admin=true;
                    isAdmin=1;
                }else{
                    isAdmin=0;
                }
                await db.run(`
                    INSERT INTO user (username,mailaddress,secretcode,isAdmin) VALUES(?,?,?,?)
                `,req.params.username,req.params.address,req.params.secretcode,isAdmin)
                
                res.redirect("/home")
            }
            else{ 
                //res.render("username4")
                console.log("pls enter secret code")
                res.redirect("/home")
            }
        
        } 
        //alert("pls enter the correct mail！")
       //res.redirect("/inscription")
        else{
        //res.render("addressmailfaute")
        console.log("pls enter email correct")
        res.redirect("/inscription")
        }
    }
    else{
    //res.render("username4")
    console.log("user name must have 4")
    res.redirect("/inscription")
    }
})

app.post('/postpost',async(req,res)=>{
  const contentinbody = req.body.content
  const titleinbody = req.body.title
  const useridinbody = req.body.userid
  const db = await openDb()
  req.params.content = contentinbody;
  req.params.title = titleinbody;
  req.params.userid = useridinbody
  await db.run(`
        INSERT INTO lien (Title,Content,user_id,votes) VALUES(?,?,?,0)
    `,req.params.content,req.params.title,req.params.userid)
  
    res.redirect("/home")  // how to use userid? 
})

app.post('/response',async(req,res)=>{
    const contentinbody = req.body.res_content
    const useridinbody = req.body.res_userid
    const lienidinbody = req.body.res_lienid
    const db = await openDb()
    req.params.content = contentinbody;
    req.params.userid = useridinbody;
    req.params.lienid = lienidinbody;
    await db.run(`
        INSERT INTO message(Content,user_id,lien_id) VALUES(?,?,?)
    `,req.params.content,req.params.userid,req.params.lienid)

    res.redirect("/home")
})

app.get('/authen',async(req,res)=>{

    res.render("authen",{failed: req.query.failed})    
})

app.post('/signin',async(req,res)=>{
    // login page
    let failed=false;
    const db = await openDb()
    const id = req.params.id
    const addressInBody = req.body.address                                          
    // suggestion : 
    // addressInBody=addressInBody.toLowerCase(); // pour eviter que les majuscules faussent la comparaison
    const secretInBody = req.body.secretcode                                        
    let result = await db.all(`
    SELECT * FROM user
    where mailaddress=?
    `,[addressInBody])                                                              // request for user
    console.log('this is result')
    console.log(result)

    let secret_verifi = await db.all(`
        SELECT * FROM user
        where secretcode=?
    `,[secretInBody])                                                               // request for password
    console.log('this is seccret')
    console.log(secret_verifi)
    
    if(result != ""&& secret_verifi != ""&& result[0].id==secret_verifi[0].id)      // correct user
    {
        res.redirect("/home")                                                       // login succesful
    }
    else{
        failed=true;                                                                // for redirection
        res.redirect("/authen")                                                     // login failed
    }
    
})



app.get('/home',async(req, res) =>{
    data={};
    if (req.session.logged){
        data.logged=true;
    }
    const db = await openDb()
    const id = req.params.id 
    const posts = await db.all(`
    SELECT * FROM lien
    `,[id])
    const response = await db.all(`
    SELECT * FROM message
    `,[id])
    console.log(posts)
    data.posts = posts
    data.response = response
    res.render("home",data)
})

app.get('/WIP',(req,res)=>{
    // placeholder
    res.render("wip");
})

app.get('/test',async(req,res)=>{
    // a page to edit anytime we want to make some tests without breaking the rest
    data={};
    if (req.session.logged){
        data.logged=true;
    }
    const db = await openDb()
    const id = req.params.id 
    const posts = await db.all(`
    SELECT * FROM lien
    `,[id])
    const response = await db.all(`
    SELECT * FROM message
    `,[id])
    console.log(posts)
    data.posts = posts
    data.response = response
    res.render("test",data)
})


app.listen(port,() => {
    console.log("Listening on port ", port)
})

