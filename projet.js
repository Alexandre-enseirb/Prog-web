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
    username: undefined,
    logged: false,
    user_id: undefined,
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
app.use(bodyParser.json());
app.use(express.static("public")); // not mine, for image display
app.use(session(sess))
app.set('views', './views'); //les views sont dans le dossier views
app.set('view engine', 'jade');
//on a mis ces 2 lignes apres avoir installé jade

// Useful functions
async function addPost(db,post){
    const insertRequest = await db.prepare("INSERT INTO lien (Title, Content, user_id, votes) VALUES (?,?,?,?)")
    return await insertRequest.run(post)
}

async function addUser(db, user){
    const insertRequest = await db.prepare("INSERT INTO user (username, mailaddress, secretcode, isAdmin) VALUES (?,?,?,?)")
    return await insertRequest.run(user)
}

async function addComment(db, comment){
    const insertRequest = await db.prepare("INSERT INTO message (Content, user_id, lien_id,votes) VALUES (?,?,?,0)")
    return await insertRequest.run(comment)
}
/*
async function addVote(db, Vote_type, Vote){
    if (Vote_type){
        // 1 is for upvote
        const insertRequest = await db.prepare("INSERT INTO upvotes (lien_id, response_id, user_id) VALUES (?,?,?)")
    }
    else
    {
        const insertRequest = await db.prepare("INSERT INTO downvotes (lien_id, response_id, user_id) VALUES (?,?,?)")
    }
    return await insertRequest.run(Vote)
}*/

async function addVote(db, Vote){
    const insertRequest = await db.prepare("INSERT INTO votes (lien_id, user_id, response_id, type) VALUES (?,?,?,?)")
    return await insertRequest.run(Vote)
}


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
                    sAdmin=0;
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
    }else{
        //res.redirect("/authen");
    }
    const db = await openDb()
    const id = req.params.id 
    const posts = await db.all(`
    SELECT * FROM lien
    `,[id])
    const response = await db.all(`
    SELECT * FROM message
    `,[id])
    const votes = await db.all(`
    SELECT * FROM votes
    `,[id])

    let posts_responses=[posts,response];
    console.log(posts_responses)
    let content;
    let tmp=0;
    let URL="";
    let CompleteURL="";
    let changed;
    for (type of posts_responses){                         // we check for url in every post
        for (post of type){
            
            console.log(post)
            content=post.Content;                    // therefore we check the content
            words=content.split(" ");                // we split it per word
            for (const word of words){               // for every word of our content
                if (word.indexOf("http")==0){        // check if it's an URL
                    URL="";                          // variable reset
                    for (const index in word){       // if yes, we do a last check on it 
                    
                        if (tmp==2){                 // means we passed the "http://" or "https://"
                            URL=URL+word[index];     // we create a string with the URL
                        }
                        if (tmp==3){                 // means we've got the "www.something.com"
                            break;
                        }
                        if (word[index]=='/'){
                            tmp++;
                        }
                    CompleteURL="<a href="+word+">"+URL+"</a>";
                    }
                words[words.indexOf(word)]=CompleteURL;
                tmp=0;
                changed=true;
                }
            }
            if (changed){
                changed=false;
                post.Content="";
                for (let i=0;i<words.length;i++){
                    post.Content=post.Content.concat(' ',words[i]);
                }
                console.log(post.Content)
            }
        }
    }
    for (tmp of votes){
        console.log(tmp)
        if (tmp.response_id==0){
            for (post of posts){
                if (post.id==tmp.lien_id){
                    if (tmp.type){
                        post.votes++;
                    }else{
                        post.votes--;
                    }
                }
            }
        }else{
            for (rep of response){
                if ((rep.lien_id==tmp.lien_id) && (rep.id==tmp.response_id)){
                    if (tmp.type){
                        rep.votes++;
                    }else{
                        rep.votes--;
                    }
                }
            }
        }
        
    }
    //posts[0].Content="Trop bien ce site : <a href='http://www.google.fr'>Google</a>";
    //posts[1].Centent=`a href="http://www.google.fr"`
    //posts[2].Content="a href='http://www.google.fr' text='Google'"
    //posts[3].Content="a href='http://www.google.fr/'> Google"
    data.posts = posts
    data.response = response
    console.log(response)
    //console.log(data)
    res.render("test",data)
})

app.post('/add',async(req,res)=>{
    // fonction doublon de postpost, afin de ne pas tout casser avec mes tests
    const db=await openDb()
    let username;
    let content;
    let user_id;
    let Title="New post"                                    // until I add a Title input
    let TitleError=false;
    let ContentError=false;



    if (req.session.user_id!=undefined){
        user_id=req.session.user_id;
    }else{
        user_id=2; // temporary solution
    }
    console.log(req.query);
    content=req.body.post;
    //await db.run(`
    //INSERT INTO lien (Title, Content, user_id, votes) VALUES (`+Title+`,`+content+`,`+user_id+`,`+"0"+`)`)
    
    if (TitleError || ContentError){
        //pass
    }else{

        addPost(db,[Title,content,user_id,"0"])
    }
    res.redirect("test");
    
})

app.post('/comment',async(req,res)=>{
    // encore une fois, fonction doublon, je ferai un big merge quand tout fonctionnera impeccablement
    const db=await openDb()
    let username;
    let comment;
    let user_id;
    let post_id;
    
    // we get the comment

    comment=req.body.comment
    post_id=req.body.post_id
    let Comment={};
    Comment.content=comment;
    Comment.post_id=post_id;
    
    if (req.session.user_id!=undefined){
        user_id=req.session.user_id
    }else{
        user_id=2;
    }
    Comment.user_id=user_id;
    console.log(Comment);
    addComment(db, [comment,user_id,post_id])
    res.redirect("test")
})

app.post("/vote",async(req,res)=>{
    const db=await openDb();
    const user_id=1; //temporary
    //console.log(tables[req.body.vote_type], [req.body.msg_id, req.body.comm_id, user_id])
    console.log([req.body.msg_id,  user_id,req.body.comm_id, req.body.vote_type])
    await addVote(db,[req.body.msg_id,  user_id,req.body.comm_id, req.body.vote_type]);
    console.log(req.body);    
});


app.listen(port,() => {
    console.log("Listening on port ", port)
})

