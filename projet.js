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
    ////console.log("connect-sqlite3 wasn't found. Aborting.")
}
const {openDb} = require("./projet_db")

const userAdmin=["root","retel","admin@test.com"];



const sess={
    //store: new SQLiteStore,
    secret: 'secret key',
    resave: true,
    rolling: true,
    
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

function isIterable(obj){
    try{
        for (const tmp of obj){
            break;
        }
    }
    catch(TypeError){
        return false;
    }
    return true;
}

function URLify(posts_responses){
    ////console.log("-------------")
    ////console.log(posts_responses)
    ////console.log("-----------")
    let tmp=0;
    let URL="";
    let keys;
    let changed;
    ////console.log(posts_responses);
    for (type of posts_responses){                   // we check for url in every post
        if (!isIterable(type)){
            type=[type];
        }
        for (post of type){
            if (post){
                ////console.log(post)
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
                        CompleteURL="<a style='width:max-content;' href="+word+">"+URL+"</a>";
                        }
                    words[words.indexOf(word)]=CompleteURL;
                    tmp=0;
                    changed=true;
                    }
                }
            }
            
            if (changed){
                changed=false;
                post.Content="";
                for (let i=0;i<words.length;i++){
                    post.Content=post.Content.concat(' ',words[i]);
                }
                ////console.log(post.Content)
            }
        }
    }
    
}

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
    ////console.log(users)
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
                //////console.log(req.body.username.length)
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
                ////console.log("pls enter secret code")
                res.redirect("/home")
            }
        
        } 
        //alert("pls enter the correct mail！")
       //res.redirect("/inscription")
        else{
        //res.render("addressmailfaute")
        ////console.log("pls enter email correct")
        res.redirect("/inscription")
        }
    }
    else{
    //res.render("username4")
    ////console.log("user name must have 4")
    res.redirect("/inscription")
    }
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
    ////console.log('this is result')
    //console.log(result)

    let secret_verifi = await db.all(`
        SELECT * FROM user
        where secretcode=?
    `,[secretInBody])                                                               // request for password
    ////console.log('this is seccret')
    ////console.log(secret_verifi)
    
    if(result != ""&& secret_verifi != ""&& result[0].id==secret_verifi[0].id)      // correct user
    {
        req.session.logged=true;
        req.session.user = result[0].id
        //console.log(req.session)
        res.redirect("/home")                                                       // login succesful
    }
    else{
        failed=true;                                                                // for redirection
        res.redirect("/authen")                                                     // login failed
    }
    
})



app.get('/home',async(req, res) =>{
    data={};
    //console.log(req.session)
    if (req.session.logged){
        data.logged=true;
    }
    else{
        res.redirect('/authen')
        return;
    }
    const user_id = req.session.user
    ////console.log(user_id)
    const db = await openDb()
    const id = req.params.id 
    ////console.log("id is ",id)
    const posts = await db.all(`
    SELECT * FROM lien
    `)
    const votes = await db.all(`
    SELECT * FROM votes
    `,[id])
    const user_votes = await db.all(`
    SELECT * FROM votes WHERE user_id=?`,user_id);

    //console.log(posts)

    
    //////console.log(posts_responses)
    let content;
    let tmp=0;
    let URL="";
    let CompleteURL="";
    let changed;
    
    URLify(posts)
    let author;
    if (posts){
        try{
            for (const P of posts){
                author=await db.get(`SELECT * FROM user WHERE id=?`,[P.user_id]);
                titleRaw=P.Title
                P.Title="<a style='color: white; font-size:14pt;padding-bottom:10px;', href='http://localhost:3000/post/"+P.id+"'>"+titleRaw+"</a>";
                P.authorName=author.username;
            }
        }catch(TypeError){
            author=await db.get(`SELECT * FROM user WHERE id=?`,[posts.user_id]);
            posts.authorName=author.username;
        }   
    }
    
    

    // VOTES DISPLAY FOR USER
    for (const user_vote of user_votes){             // iterates through the user's votes
        if (user_vote.response_id){
            // TODO
        }else{
            for (const post of posts){
                if (user_vote.lien_id == post.id){
                    if (user_vote.type){
                        post.upvoted=true;
            
                    }else{
                        post.downvoted=true;
            
                    }
                }
            }
        }
    }



    const user_profile=await db.get(`SELECT * FROM user WHERE id=?`,[req.session.user]);
    data.username=user_profile.username;
    data.posts = posts
    data.user_id=req.session.user;
    res.render("home",data)
})

app.get('/profile/:id',async(req,res)=>{
    const db = await openDb()
    const id= req.params
    ////console.log("id is")
    
    const ourusers = await db.all(`
    SELECT * FROM user
    `)
    ////console.log(id)
    if(req.params.id)
    {
        const youruserid = req.params.id ? req.params.id : ""
        const useractive = ourusers.find(c=> c.id == youruserid)
        const posts = await db.all(`
        SELECT * FROM lien
        where user_id=?
        `,[youruserid])
        const response = await db.all(`
        SELECT * FROM message
        where user_id=?
        `,[youruserid])
        const votes = await db.all(`
        SELECT * FROM votes
        where user_id=?
        `,[youruserid])
        const allliens = await db.all(`
        SELECT * FROM lien
        `)
        const allresponse = await db.all(`
        SELECT * FROM message
        `)
        res.render("prof",{posts:posts,response:response,useractive:useractive,votes:votes,allliens:allliens,allresponse:allresponse})        
    }
    else
    {
        res.redirect("/home")
    }

})



app.get('/WIP',(req,res)=>{
    // placeholder
    res.render("wip");
})





app.post('/add',async(req,res)=>{
    
    const db=await openDb()
    let username;
    let content;
    let Title;
    let user_id;
    
    let TitleError=false;
    let ContentError=false;



    if (req.session.user!=undefined){
        user_id=req.session.user;
    
    
    content=req.body.post;
    Title=req.body.title;
    
    }
    if (TitleError || ContentError){
        //pass
    }else{

        addPost(db,[Title,content,user_id,"0"])
    }
    res.redirect("home");
    
})

app.post('/comment',async(req,res)=>{
    
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
    
    if (req.session.user!=undefined){
        user_id=req.session.user
    }

    

    Comment.user_id=user_id;
    
    const insertRequest = await db.prepare("INSERT INTO message (Content, user_id, lien_id,votes) VALUES (?,?,?,0)")
    await insertRequest.run([Comment.content, Comment.user_id, Comment.post_id])
    res.redirect("post/"+post_id.toString())
})


app.post("/vote",async(req,res)=>{
    /*
     * This post serves two purposes
     *
     * First, it checks if a given user has already upvoted/downvoted a link/comment
     *  if a vote already exists for the given link/comment, it is updated
     *  else, we create a new vote for this link/comment, stored in votes, linked to user_id
     *
     * Then, it gets the link/comment, extracts their votes count, and adds/substracts 1 or 2
     *
     * The only case where two votes have to be counted is if we go from an upvote to a downvote
     *  or the other way
     *
     */

    console.log("vote called")
    const db=await openDb();
    let user_id=req.session.user; 
    let previous_vote=undefined;
    let current_vote=req.body.vote_type;
    console.log(await db.all(`SELECT * FROM votes`))
    console.log(user_id, current_vote, req.body.msg_id, req.body.comm_id)


    
    // check if the user exists
    if (user_id==undefined){
        console.log("ERREUR ! Un utilisateur non connecté a tenté de voter.");
        return;
    } 
    
    // Query for vote
    const Votes= await db.get(`SELECT * FROM votes WHERE lien_id=? and response_id=? and user_id=?`,[req.body.msg_id,req.body.comm_id, user_id]);

    
    
    if (Votes){
        // user already votedi
        previous_vote=Votes.type;
        const updateRequest= await db.prepare("UPDATE votes SET type=? WHERE id=?")
        await updateRequest.run([req.body.vote_type, Votes.id])
        
        
    }else{

        // user didn't vote
        await addVote(db,[req.body.msg_id,  user_id,req.body.comm_id, req.body.vote_type]);
       
    }

    // updating the link/comment's vote count

    if (req.body.comm_id){
        // we're looking for a comment
        const comment=await db.get(`SELECT * FROM message WHERE id=?`,[req.body.comm_id]);
        
        if (current_vote){                           // we're upvoting
            if (previous_vote!=undefined){           // we were downvoting
                // if vote cancel : change 1. Else, change 2.
                comment.votes+=(req.body.cancel ? 1:2);
            }else{                                   // we just upvoted first time
                comment.votes+=1;
            } 
        }else{                                       // we're downvoting
            if (previous_vote){                      // we were upvoting
                comment.votes-=(req.body.cancel ? 1:2);
            }else{
                comment.votes-=1;
            }
        }
        const updateComment=await db.prepare("UPDATE message SET votes=? WHERE id=?")
        await updateComment.run([comment.votes, req.body.comm_id])
    }else{                                           // means comm_id is 0 : we're a link
        const link=await db.get(`SELECT * FROM lien WHERE id=?`,[req.body.msg_id]);
       
        if (current_vote){                           // we're upvoting
            if (previous_vote!=undefined){           // we were downvoting
                // if vote cancel : change 1. Else, change 2.
                link.votes+=(req.body.cancel ? 1:2);
            }else{                                   // we just upvoted first time
                link.votes+=1;
            } 
        }else{                                       // we're downvoting
            if (previous_vote){                      // we were upvoting
                link.votes-=(req.body.cancel ? 1:2);
            }else{
                link.votes-=1;
            }
        }
        const updateLink = await db.prepare("UPDATE lien SET votes=? WHERE id=?")
        await updateLink.run([link.votes, req.body.msg_id])
    }
    


        



   
});

app.get("/post",async(req,res)=>{
    res.redirect("http://localhost:3000/home"); // REDIRECTION
});

app.get("/post/:id",async(req,res)=>{
    const db=await openDb();
    const post=await db.get(`SELECT * FROM lien WHERE id=?`,[req.params.id]);
    const responses=await db.all(`SELECT * FROM message WHERE lien_id=?`,[req.params.id]);
    const user_id=req.session.user;

    // beforehand, we check if the post does exist
    if (post==undefined){
        status=404; // not found
        res.redirect(status,"http://localhost:3000/home"); // back to mainpage
    }

    // now we can process and render
    let post_responses=[post,responses];
    URLify(post_responses);
    let data={}
    
    const user_vote=await db.get(`SELECT * FROM votes WHERE lien_id=? and response_id=0 and user_id=?`,[req.params.id,user_id]);
    
    if (user_vote==undefined){ // never voted
        //pass
    }else{
        if (user_vote.type){
            post.upvoted=true;
        }else if (user_vote.type==0){
            post.downvoted=true;
        }
    }
    let comment_votes;
    for (const resp of responses){
        comment_votes=await db.get(`SELECT * FROM votes WHERE user_id=? and lien_id=? and response_id=?`,[user_id,req.params.id,resp.id])
        
        if (comment_votes!=undefined){
            if (comment_votes.type){
                resp.upvoted=true;
            }else{
                resp.downvoted=true;
            }
            
        }
    }
    
    

    
    // looking for names
    const author=await db.get(`SELECT * FROM user WHERE id=?`,[post.user_id]);
    ////console.log(author);
    post.authorName=author.username;
    let msgauthor;
    
    for (const msg of responses){
        msgauthor=await db.get(`SELECT * FROM user WHERE id=?`,[msg.user_id]);
        msg.authorName=msgauthor.username;
    }
    

    data.lien=post;
    if (responses){
        data.msg=responses;
        
        
    }

    data.user_id=req.session.user;
    data.logged=req.session.logged;
    const user_profile=await db.get(`SELECT * FROM user WHERE id=?`,[req.session.user]);
    data.username=user_profile.username;
    
    ////console.log(data.user_id)
    //console.log(data)
    res.render("post",data);
})

app.post("/delete",async(req,res)=>{
    /*
     * handles deletion of a post
     *
     * verifies the request is legal
     *  i.e. it was send by the right user
     *
     */
    console.log("delete called")
    const db = await openDb();
    const lien_id=req.body.lien_id;
    const msg_id=req.body.msg_id;
    const user_id=req.body.user_id;
    console.log(lien_id,msg_id,user_id)
    
    if (msg_id){
        // we're deleting a comment
        console.log(await db.all(`SELECT * FROM message`))
        await db.run("DELETE FROM message WHERE lien_id=? and id=? and user_id=?",[lien_id,msg_id,user_id])
        console.log("deleted msg")
    }else{
        // we delete a post (and all the comments that come with it
        await db.run("DELETE FROM lien WHERE id=? and user_id=?",[lien_id, user_id]);
        await db.run("DELETE FROM message WHERE lien_id=? and id=? and user_id=?",[lien_id,msg_id,user_id]);
    }
    res.redirect("home")
})

app.listen(port,() => {
    ////console.log("Listening on port ", port)
})

