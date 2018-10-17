
const express = require('express')
const db = require('./database')
const expressSession = require('express-session')
const fileupload = require('express-fileupload')
const connectSqlite3 = require('connect-sqlite3')
const SQLiteStore = connectSqlite3(expressSession)
const cookieParser = require('cookie-parser')
var bcrypt = require('bcryptjs');
var csrf = require('csurf')

var csrfProtection = csrf({ cookie: true })

var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync(salt);
console.log(hash)


const bodyParser = require('body-parser')


const expressHandlebars =
 require('express-handlebars')

const app = express()

app.use(bodyParser.urlencoded({extended : false}))

app.use(cookieParser('victoria'))

app.use(fileupload());

app.use(expressSession({
    store: new SQLiteStore({db: "DB/websiteDB.db", table: "sessions"}),             
    secret: 'victoria',
    resave: false,
    saveUninitialized: true
}))

app.get("/create-cookie", function(request, response){
    response.cookie("lastVisit", Date.now()) })

    
app.get("/log-cookie", function(request, response){
const lastVisit = parseInt(request.cookies.lastVisit)
})

app.use(bodyParser.urlencoded({extended: false}))

app.engine('hbs', expressHandlebars({
 defaultLayout: 'main',
 extname: '.hbs'
}))

app.use(express.static('images'))

app.get('/', function(request, response) {
    const isLoggedIn = request.session.loggedin

    const model = {
        loggedin : isLoggedIn
    }
    response.render("home.hbs", model)
})

app.get('/home', function(request, response){
    const isLoggedIn = request.session.loggedin

    const model = {
        loggedin : isLoggedIn
    }

 response.render("home.hbs", model)
})

app.get('/contact', function(request, response){
    const isLoggedIn = request.session.loggedin

    const model = {
        loggedin : isLoggedIn
    }

    response.render("contact.hbs", model)
})

app.get('/about', function(request, response){
    const isLoggedIn = request.session.loggedin

    const model = {
        loggedin : isLoggedIn
    }

    response.render("about.hbs", model)
})

app.get('/loginPage', csrfProtection, function(request, response){
    const model = {
        
        csrfToken : request.csrfToken()
    }

    response.render("loginPage.hbs", model)
})

app.get('/blogpost', function(request, response){

    const isLoggedIn = request.session.loggedin

    db.getAllBlogPosts(function(error, blog) {
        if(error){
            request.status(500).send(error)
        }else{
            const model = {
                loggedin : isLoggedIn,
                blogpost : blog
            }
            response.render("blogpost.hbs", model)
        }
    })
})



app.get('/newblogpost', function(request, response){

    const isLoggedIn = request.session.loggedin

    const model = {
        loggedin : isLoggedIn
    }
    if(isLoggedIn) {
        response.render("newblogpost.hbs",model)
    }else{
        response.render("loginPage.hbs", {})
    }
})

app.get('/gallery', function(request, response){
    const isLoggedIn = request.session.loggedin
    db.getAllGalleryEntries(function(error, gallery){
    const model = {
        gallery : gallery,
        loggedin : isLoggedIn
    }
    response.render("gallery.hbs", model)
    })
})

app.get('/admin', function(request, response){
    const isLoggedIn = request.session.loggedin

    const model = {
        loggedin : isLoggedIn
    }

    if(isLoggedIn) {
        response.render("admin.hbs",model)
    }else{
        response.render("loginPage.hbs", {})
    }
})

app.get('/guestbook', csrfProtection, function(request, response){

    const isLoggedIn = request.session.loggedin

    db.getAllGuestbookEntries(function(error, guestbook) {
            if(error){
                response.status(500).send("couldnt get blogposts")
            }else{

            const model = {
                loggedin : isLoggedIn ,
                gbook : guestbook,
                csrfToken : request.csrfToken()
            }
            response.render("guestbook.hbs", model)
        }
        })
    }) 


app.post('/updateblog/:id', function(request, response) {

    const Id = request.params.id
    const Title = request.body.titleblogpost
    const Content = request.body.contentblogpost
    db.updateBlog(Id, Title, Content, function(error) {
        if(error){
            response.status(500).send("couldnt update blog")
        }else{  
    response.redirect('/blogpost')
        }
    })
})

app.post('/delbp/:id', function(request, response) {
    
        const id = request.params.id
        
        db.deleteBlogpost(id, function(error) {
            if(error){
                response.status(500).send(error)
            }else{
        response.redirect('/blogpost')
        }
    })
})

app.get('/editbp/:id', function(request, response) {

    const Id = request.params.id
    const IsloggedIn = request.session.loggedin

    db.getBlogFromBlog(Id, function(blog, error) {
        if(error){
            response.status(500).send("couldnt fetch blogposts")
        }else{
        const model = {
            blogpost : blog ,
            loggedin : IsloggedIn
        }
        response.redirect("editBlogpost.hbs", model)
    }
    })  
})

app.post('/delgallery/:id', function(request, response) {

    const id = request.params.id
    db.deleteGalleryEntry(id, function(error){
        if(error){
            response.status(500).send("couldnt delete gallery entry")
        }
    })
    response.redirect('/gallery')
})

app.post('/delg/:id', function(request, response){

    const id = request.params.id
    db.deleteGuestbookEntry(id, function(error){
        if(error){
            response.status(500).send("couldnt delete guestbook entry")
        }else{   
    response.redirect('/guestbook')
        }
    })
})

app.get('/newGalleryEntry', function(request, response){
    const isLoggedIn = request.session.loggedin
    
    const model = {
            loggedin : isLoggedIn
    }
    if(isLoggedIn) {
        response.render("newGalleryEntry.hbs",model)
    }else{
        response.render("loginPage.hbs", {})
    }
})

app.post('/submitBlogpost', function(request,response){

    const Author = "Oskar"
    const Title = request.body.title
    const Content = request.body.blogpost

    db.newBlogpost(Author, Title, Content, function(error) {
            if(error){
                response.status(500).send(error)
            }
        })    
    response.redirect('/blogpost')
    
})

app.post('/galleryEntry', function(request, response){

    if (!request.files)
    return res.status(400).send('No files were uploaded.');

    let Image = request.files.file;

    let fileName = request.files.file.name

    Image.mv('./images/'+fileName, function(err) {
        if (err)
          return response.status(500).send(err);

    db.newGalleryEntry(fileName, function() {

    })
            response.redirect('/gallery')
})
})

app.post('/guestbookEntry', csrfProtection , function(request, response){

    const Author = request.body.author
    const Message = request.body.message

    db.newGuestbookEntry(Author, Message, function(error) {
        if(error){
            response.status(500).send(error)
        }else{
            response.redirect('/guestbook')
        }
    })
})

app.post('/login', csrfProtection , function(request, response){
    const email = request.body.em
    const password = request.body.pw

    if (email == 'Attamannen' && bcrypt.compareSync(password, '$2a$10$knENzIxH4cioBhLyHKiLjuycbNkkHNZxyHCuulnlMRt5Xif6lB83m')) {
        request.session.loggedin = true
        response.redirect('/admin')
            }else{
        response.render("cantLogin.hbs")
            }
})

app.post('/logout', function(request, response) {

    request.session.loggedin = false
    response.redirect('/home')
})

app.listen(8080)