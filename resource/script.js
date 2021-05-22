// ATTENTION : C'est un extrait de fichier NodeJs (pas le fichier complet). En l'état, il ne fonctionnera pas.


const sess={
    //store: new SQLiteStore,
    secret: 'secret key',
    resave: true,
    rolling: true,
    admin: false,
    name: undefined, // sera remplacé par le username dès la connexion au site.
    cookie: {
        maxAge: 10000*3600
    },
    saveUninitialized: true
}

// Normalement notre sess ressemble déjà globalement à ça, tu peux toujours ajouter/retirer des champs, selon les besoins.


// POUR UNE PAGE NECESSITANT LES INFORMATIONS DE L'UTILISATEUR

app.get("/home",(req,res)=>{
    let logged;
    let username;
    let isAdmin;
    try{
        if (req.session.name!=undefined){ // si l'utilisateur a un nom de session
            logged=true;
            username=req.session.name
            isAdmin=req.session.admin
        }
    }catch(e){                            // si la session n'existe pas
        logged=false;
        username=undefined;
        isAdmin=false;
    }

    data={
        logged: logged,
        username: username,
        admin: isAdmin
    }

    res.render("home",data);
});

// POUR UNE PAGE PERMETTANT DE SE CONNECTER

app.get("/login",(req,res)=>{
    res.render("login",data);
});

app.post("/login",async (req,res)=>{
    const nameInBody=req.body.nameSent;
    const passInBody = req.body.passWordSent;
    let user=undefined;
    let db = await openDb()

    if (nameInBody){
        // l'utilisateur a entré un username
        try{
            user = await db.get(`SELECT * FROM users WHERE username=`+nameInBody);
        }catch(e){
            // utilisateur inexistant dans la Db
            user=null;
            data={
                // par exemple si tu veux mettre un message d'erreur dans la page
                error: true
            }
            res.render("login",data);
            return; // évite de traiter la suite de la fonction en cas d'erreur.
        }
        req.session.name=nameInBody;
        if (user.isAdmin==1){
            // vérifie si l'utilisateur est administrateur
            req.session.admin=true;
        }
    }
    res.redirect("/"); // l'utilisateur est connecté, on le ramène à la page principale.
});


