const express = require('express'); // equivaut a un include
const bodyParser = require('body-parser');
const app = express() //express sans argument : cree une app?
const port = 3000

const {openDb} = require("./projet_db")

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.set('views', './views'); //les views sont dans le dossier views
app.set('view engine', 'jade');
//on a mis ces 2 lignes apres avoir installé jade

app.get('/inscription',async(req, res) =>{
    const db = await openDb()
    const id = req.params.id
    const users = await db.all(`
    SELECT * FROM user
    `,[id])
    console.log(users)
    res.render("inscription",{user: users})
})


app.post('/inscriptionadd',async(req,res)=>{
    const nameInBody = req.body.username
    const addressInBody = req.body.address
    const secretInBody = req.body.secretcode
    
    if(nameInBody.length>=4){
        req.params.username = nameInBody;
    
        if(addressInBody.indexOf(".com")!= -1){
            req.params.address = addressInBody;
            
            if(secretInBody){
                req.params.secretcode = secretInBody;
                console.log(req.body.username.length)

                const db = await openDb()
                const id = req.params.id
                await db.run(`
                    INSERT INTO user (username,mailaddress,secretcode) VALUES(?,?,?)
                `,req.params.username,req.params.address,req.params.secretcode)
            } 
           
            
        } 
        res.redirect("/inscription")
    }
    res.render("username4")
})

app.get('/authen',async(req,res)=>{

    res.render("authen")    
})

app.post('/signin',async(req,res)=>{
    const db = await openDb()
    const id = req.params.id
    const addressInBody = req.body.address
    const secretInBody = req.body.secretcode
/*    const user = await db.all(`
    SELECT * FROM user
    `,[id])

    const result = user.find(c=> c.mailaddress == addressInBody)
*/
    let result = await db.all(`
    SELECT * FROM user
    where mailaddress=?
    `,[addressInBody])
    console.log(result)

    
    
    console.log(result)
    if(result != "")
    {
        res.redirect("accuille")
    }
    
})

app.get('/accuille',async(req, res) =>{
    res.render("accuille")
})

app.listen(port,() => {
    console.log("Listening on port ", port)
  })
