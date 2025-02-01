const express = require("express")
const app = express()
const PORT = 3000

//Requiring the files 
const path = require("path")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser")
const connection = require("./config/connection")
const usermodel = require("./models/user")
const postmodel = require("./models/post")

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set("view engine","ejs")
app.use(cookieParser())
app.use(express.static(path.join(__dirname,"public")))

//Creating the Routes 
app.get("/",(req,res)=>{
    res.send("Hello")
})
app.get("/register",(req,res)=>{
    res.render("register")
})
app.post("/register",async(req,res)=>{
    const {username,name,email,password,age} = req.body
    let user = await usermodel.findOne({username})
    if(user){
        res.send("User Already exist")
    }
    else{
        const saltround = await bcrypt.genSalt(10)
        const hashedpassword = await bcrypt.hash(password,saltround)
        user = await usermodel.create({
            username,
            email,
            name,
            age,
            password:hashedpassword
        })
        let token = jwt.sign({email},"hehe")
        res.cookie("token",token)
        res.send("Registered Successfully")
    }
})
app.get("/login",(req,res)=>{
    res.render("login")
})
app.post("/login",async(req,res)=>{
    const {email,password} = req.body
    let user = await usermodel.findOne({email})
    if(!user){
        return res.redirect("/register")
    }
    else{
        const verifiedpassword = await bcrypt.compare(password,user.password)
        if(!verifiedpassword){
            return res.redirect("/login")
        }
        else{
            let token = jwt.sign({email},"hehe")
            res.cookie("token",token)
            return res.redirect("/profile")
        }
    }
})
app.get("/logout",(req,res)=>{
    res.cookie("token","")
    return res.redirect("/login")
})
app.post("/post",isloggedin,async(req,res)=>{
    let user = await usermodel.findOne({email:req.user.email})
    let {content} = req.body
    let post = await postmodel.create({
        user:user._id,
        content
    })
    user.posts.push(post._id) // pushing inside the post array 
    await user.save() // saving the changes 
    res.redirect("/profile")
})
//creating the profile route 
app.get("/profile",isloggedin,async(req,res)=>{
    const user = await usermodel.findOne({email:req.user.email}).populate("posts")
    res.render("profile",{user})
})
//creating the protected route 
function isloggedin(req,res,next){
    if(req.cookies.token==""){
        return res.redirect("/login")
        next()
    }
    else{
        let data = jwt.verify(req.cookies.token,"hehe")
        req.user = data
        next()
    }
}
//Listening the App 
app.listen(PORT,()=>{
    console.log(`App is listening at ${PORT}`)
})