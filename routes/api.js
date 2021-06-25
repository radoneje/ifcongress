var express = require('express');
var moment= require('moment');
var fs= require('fs');
var path= require('path');
var router = express.Router();
const nodemailer = require("nodemailer");
const { check } = require('express-validator');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(true);
});
function adminLogin(req, res, next) {
  if(req.session.admin)
    return next();
  res.sendStatus(401);
}
function userLogin(req, res, next) {
  if(req.session.user && req.session.user.id)
    return next();
  res.sendStatus(401);
}
router.post('/adminContent' ,adminLogin ,async(req, res, next)=> {
  var row=await req.knex.select("*").from("t_cbrf_settings").orderBy("id", 'desc');
  var id=row[0].id;
  row=await req.knex("t_cbrf_settings").insert({site:JSON.stringify(row[0].site), content:JSON.stringify(row[0].content), speakers:JSON.stringify(row[0].speakers)},"*").where({id:id});
  var ret=await req.knex("t_cbrf_settings").update({content:req.body.data},"*").where({id:row[0].id})
  res.json(ret[0]);

});


router.post('/adminSpeakers' ,adminLogin ,async(req, res, next)=> {
  var row=await req.knex.select("*").from("t_cbrf_settings").orderBy("id", 'desc');
  var id=row[0].id;
  row=await req.knex("t_cbrf_settings").insert({site:JSON.stringify(row[0].site), content:JSON.stringify(row[0].content), speakers:JSON.stringify(row[0].speakers)},"*").where({id:id});
  var ret=await req.knex("t_cbrf_settings").update({speakers:req.body.data},"*").where({id:row[0].id})
  res.json(ret[0]);

});
router.post('/adminSite' ,adminLogin ,async(req, res, next)=> {

  var row=await req.knex.select("*").from("t_cbrf_settings").orderBy("id", 'desc');
  var id=row[0].id;
  row=await req.knex("t_cbrf_settings").insert({site:JSON.stringify(row[0].site), content:JSON.stringify(row[0].content), speakers:JSON.stringify(row[0].speakers)},"*").where({id:id});
  var ret=await req.knex("t_cbrf_settings").update({site:req.body.data},"*").where({id:row[0].id});
  res.json(ret[0]);

});

router.get('/content' , adminLogin,async(req, res, next)=> {

  var ret=await req.knex.select("*").from("t_cbrf_settings").orderBy("id", 'desc')
  if(ret.length==0)
    ret=await req.knex("t_cbrf_settings").insert({},"*")
  res.json(ret[0]);
});

router.get('/regUser', adminLogin ,async(req, res, next)=> {
  var ret=await req.knex.select("*").from("t_cbrf_users").orderBy("id", 'desc')
  ret.forEach(u=>{
    u.online=(req.counter.filter(user=>{return user.id==u.id}).length>0);
  })
  res.json(ret);
});




router.post("/q", [
  check('text').isLength({ min: 2, max:600 }).trim().escape(),
  check('trackid').isInt(),
      check('userid').isInt(),
],
async(req, res, next)=> {
  if(!req.body.text)
    return res.sendStatus(405)
  if(!req.body.text.length>1200)
    return res.sendStatus(405)


  var ret=await req.knex("t_cbrf_q").insert({text:req.body.text, userid:req.body.userid, date:new Date(), trackid:req.body.trackid}, "*")
  ret=await req.knex.select("*").from("v_cbrf_q").where({id:ret[0].id})

  res.json(ret[0]);
});
router.post("/chat", async(req, res, next)=> {
  if(!req.body.text)
    return res.sendStatus(405)
  if(!req.body.text.length>1200)
    return res.sendStatus(405)


  var ret=await req.knex("t_cbrf_chat").insert({text:req.body.text, userid:req.body.userid, date:new Date()}, "*")
  ret=await req.knex.select("*").from("v_cbrf_chat").where({id:ret[0].id})

  res.json(ret[0]);
});


router.post("/approveQ",adminLogin, async(req, res, next)=> {

  var ret=await req.knex("t_cbrf_q").update({isReady:req.body.isReady}, "*").where({id:req.body.id})
  ret=await req.knex.select("*").from("v_cbrf_q").where({id:ret[0].id})
  res.json(ret[0]);
});
router.post("/stateQ",adminLogin, async(req, res, next)=> {

  var ret=await req.knex("t_cbrf_q").update({state:req.body.state}, "*").where({id:req.body.id})
  ret=await req.knex.select("*").from("v_cbrf_q").where({id:ret[0].id})
  res.json(ret[0]);
});

router.post("/spkQ", async(req, res, next)=> {

  var ret=await req.knex("t_cbrf_q").update({isSpk:req.body.isSpk}, "*").where({id:req.body.id})
  ret=await req.knex.select("*").from("v_cbrf_q").where({id:ret[0].id})
  res.json(ret[0]);
});
router.post("/addChatAnswer",adminLogin, async(req, res, next)=> {

  var ret=await req.knex("t_cbrf_chat").update({answer:req.body.answer}, "*").where({id:req.body.id})
  ret=await req.knex.select("*").from("v_cbrf_chat").where({id:ret[0].id})
  res.json(ret[0]);
});
router.delete("/deleteAllQ",adminLogin, async(req, res, next)=> {
  var ret=await req.knex("t_cbrf_q").update({isDeleted:true}, "*")
  res.json(1);
});



router.get("/chat/:trackid", adminLogin, async(req, res, next)=> {
  var ret={};
  ret.q=ret.q=await req.knex.select("*").from("v_cbrf_q").where({ trackid: req.params.trackid}).orderBy("id");
  ret.chat=await req.knex.select("*").from("v_cbrf_chat").orderBy("id");
  ret.state=(await req.knex.select("*").from("t_cbrf_state"))[0].val;
  return res.json(ret);
});

router.get("/chat", adminLogin, async(req, res, next)=> {
  var ret={};
  ret.q=ret.q=await req.knex.select("*").from("v_cbrf_q").orderBy("id");
  ret.chat=await req.knex.select("*").from("v_cbrf_chat").orderBy("id");
  ret.state=(await req.knex.select("*").from("t_cbrf_state"))[0].val;
  return res.json(ret);
});

router.get("/q", async(req, res, next)=> {
  var ret={};
  ret.q=await req.knex.select("*").from("v_cbrf_q").orderBy("id");
  return res.json(ret);
});
router.get("/q/:trackid", async(req, res, next)=> {
  var ret={};
  ret.q=await req.knex.select("*").from("v_cbrf_q").where({ trackid: req.params.trackid}).orderBy("id");
  return res.json(ret);
});


router.delete("/chat/:id",async(req, res, next)=> {
  var ret =await req.knex("t_cbrf_chat").update({isDeleted:true}, "*").where({id:req.params.id})
  return res.json({id:req.params.id});
});
router.delete("/q/:id",async(req, res, next)=> {
  var ret =await req.knex("t_cbrf_q").update({isDeleted:true}, "*").where({id:req.params.id})
  return res.json({id:req.params.id});
});

router.post("/chatToQ",async(req, res, next)=> {

  console.log("chatToQ", req.body)
  var ret =await req.knex("t_cbrf_q").insert({text:req.body.text, userid:req.body.userid, date:req.body.date, isDeleted:false}, "*");

  return res.json(ret[0]);
});



router.get('/stat', adminLogin ,async(req, res, next)=> {

  var ret={};
  ret.now=req.counter.length;
  ret.loginsCount=(await req.knex.select("*").from("t_cbrf_logins")).length;
  ret.counts=[];// await req.knex.select("*").from("t_cbrf_count").where('date','>=', moment().add(-1, 'hours').toISOString())
  res.json(ret);
});
router.get('/spk' ,async(req, res, next)=> {
  var ret= await req.knex.select("*").from("t_cbrf_spk").where({isDeleted:false}).orderBy("sortOrder")
  res.json(ret);
});
router.delete('/spk/:id', adminLogin ,async(req, res, next)=> {
  await req.knex("t_cbrf_spk").where({id:req.params.id}).delete();
  res.json(req.params.id);
});
router.post('/spk/', adminLogin ,async(req, res, next)=> {

  var id=req.body.id;
  delete req.body.id;
  var ret=await req.knex("t_cbrf_spk").update(req.body, "*").where({id:id})
  res.json(ret[0]);
});
router.get('/redirect', adminLogin ,async(req, res, next)=> {
  var ret=await req.knex.select("*").from("t_cbrf_redirect").orderBy("id")
  res.json(ret);
});


router.get('/codes', adminLogin ,async(req, res, next)=> {
  var ret=await req.knex.select("*").from("t_cbrf_codes").orderBy("f").orderBy("i").orderBy("o")
  res.json(ret);
});
router.post('/codes', adminLogin ,async(req, res, next)=> {

   let ret=await req.knex("t_cbrf_codes").insert(req.body.users,"*");
  res.json(ret);
});

router.post('/redirect', adminLogin ,async(req, res, next)=> {
 var id=req.body.id;
 console.log("dd", req.body)
 delete req.body.id;
  var ret=await req.knex("t_cbrf_redirect").update({value:req.body.value}, "*").where({id:id});
  res.json(ret[0]);
});
router.post('/redirectAdd', adminLogin ,async(req, res, next)=> {
  var ret=await req.knex("t_cbrf_redirect").insert({value:req.body.value}, "*");
  res.json(ret[0]);
});

router.post('/repositionSpk/', adminLogin ,async(req, res, next)=> {

  var id=req.body.id;
  delete req.body.id;
  await req.knex("t_cbrf_spk").update({sortOrder:req.body.sortOrder}, "*").where({id:id});
  var ret=await req.knex.select("*").from("t_cbrf_spk").orderBy("sortOrder");
  var i=0;
  for(var item  of ret){
    i=i+10;
    await req.knex("t_cbrf_spk").update({sortOrder:i}).where({id:item.id});
  }

  res.json(ret);
});



router.post('/spkImage', adminLogin ,async(req, res, next)=> {
  if(!req.files["image"])
    return res.sendStatus(404)
  //var ret= await req.knex.select("*").from("t_cbrf_spk").where({isDeleted:false}).orderBy("sortOrder")

  var filename=path.basename(req.files.image.path)
  var pathname=path.join(__dirname, '../public/images/spk/'+filename)
  fs.renameSync( req.files.image.path, pathname )
  res.json("/images/spk/"+filename);
});


router.post('/trackImage', adminLogin ,async(req, res, next)=> {
  if(!req.files["image"])
    return res.sendStatus(404)
  //var ret= await req.knex.select("*").from("t_cbrf_spk").where({isDeleted:false}).orderBy("sortOrder")

  var filename=path.basename(req.files.image.path)
  var pathname=path.join(__dirname, '../public/images/spk/'+filename)
  fs.renameSync( req.files.image.path, pathname )
  res.json("/images/spk/"+filename);
});


router.post('/addSpk', adminLogin ,async(req, res, next)=> {

  delete req.body.id;
  req.body.sortOrder=(await req.knex("t_cbrf_spk").max("sortOrder"));
  req.body.sortOrder=req.body.sortOrder?req.body.sortOrder[0].max:0;
  req.body.sortOrder=req.body.sortOrder+10;

  var ret=await req.knex("t_cbrf_spk").insert(req.body, "*");
  res.json(ret[0]);

})




router.post('/regUser/:lang',[
  check('f').isLength({ min: 2 }).trim().escape(),
  check('i').isLength({ min: 2 }).trim().escape(),
  check('company').isLength({ min: 2, max:20000 }).trim().escape(),
  check('email').isEmail().normalizeEmail()
], async(req, res, next)=> {

  var usr = await req.knex("t_cbrf_users").insert({
    f: req.body.f,
    i: req.body.i,
    o: req.body.o,
    company:req.body.company,
    email: req.body.email.toLowerCase(),
    date: new Date(),
    deptTitle:req.params.lang
  }, "*")
  try {
    await sendMailToUser(usr[0], req.params.lang)
  }
  catch (e) {
    console.warn(e);
  }
  res.json(usr[0]);
});


router.post('/logUser/:lang',[
  check('email').isEmail().normalizeEmail()
], async(req, res, next)=> {

  var usr = await req.knex.select("*").from("t_cbrf_users").orderBy("id");
  var find=null;
  var txt=req.body.email.toLowerCase().replace(/\./g,"")
  usr.forEach(u=>{
    if(u.email.toLowerCase().replace(/\./g,"")==txt)
      find=u;
  })
  console.log("usr", req.body.email);
  if(!find)
    return res.json(null);

  await req.knex("t_cbrf_userLogins").insert({userid:find.id});
  res.json(find);
});


router.post('/messageToUser', async(req, res, next)=> {
  var usr = await req.knex("t_cbrf_users").update({message:req.body.user.message, messageIsActive:req.body.user.messageIsActive}, "*").where({id:req.body.user.id})

  res.json(usr[0]);
});

router.post('/loginUser', async(req, res, next)=> {
  console.log("loginUser");
  var usrs = await req.knex.select("*").from("t_cbrf_users").where({email:req.body.user.email.toLowerCase()});
  if(usrs.length==0)
    return res.json(false);
  return res.json(usrs[0]);
})
router.post('/aliveUser', userLogin, async(req, res, next)=> {

  if(req.counter.filter(c=>{return c.id==req.session.user.id}).length==0)
  {
    req.counter.push({id:req.session.user.id, date:moment().unix()});
    await req.knex("t_cbrf_count").insert({count:req.counter.length, date:new Date()})
    await req.knex("t_cbrf_logins").insert({
      userid:req.session.user.id,
      date: new Date(),
    })
  }
  else{
    req.counter.forEach(c=>{
      if(c.id==req.session.user.id)
        c.date=moment().unix()
    })
  }
  let messages=await req.knex.select("message").from("t_cbrf_users").where({id:req.session.user.id, messageIsActive:true})
  let q=await req.knex.select("*").from("v_cbrf_q").where({userid:req.session.user.id}).orWhere({isReady:true}).orderBy("id");
  q=q.filter(q=>!q.isDeleted);
  let chat =await req.knex.select("*").from("v_cbrf_chat").where({userid:req.session.user.id}).orderBy("id");

  if(!messages)
    messages=[];
  messages=messages.filter(m=>{return m.message.length>0});

  res.json({
    userid:req.session.user.id,
    date: new Date(),
    messages:messages,
    q,
    chat,
    state:(await req.knex.select("*").from("t_cbrf_state"))[0].val
  })
});

router.get('/count', function(req, res, next) {
  res.json(req.counter.length);
});

router.post('/registerUser', async(req, res, next) =>{

  try {
    var ret = await req.knex.select("*").from("t_cbrf_codes").where({
      code: req.body.code,
      f: req.body.f,
      i: req.body.i
    });
    if (ret.length == 0)
      return res.json({status: -1});
    req.body.deptId = req.body.dept.id;
    req.body.deptTitle = req.body.dept.title;
    delete req.body.dept;

    req.body.date = new Date();

    ret = await req.knex("t_cbrf_users").insert(req.body, "*");
    req.session["user"] = ret[0];
    res.json({status: 1});
  }
  catch (e) {
    res.status(500).json(e);
  }
});
router.get('/votes', async(req, res, next) =>{

//  req.knex.select("*").from("t_cbrf_codes")
  var ret=await req.knex.select("*").from("t_cbrf_vote").where({isDeleted:false}).orderBy("id");;

  for(var item of ret){
    var total=0;
    var a=await req.knex.select("*").from("t_cbrf_voteanswers").where({isDeleted:false, voteid:item.id}).orderBy("id");
    a.forEach(b=>{total+=b.count});

    a.forEach(b=>{b.perc=parseFloat(parseFloat(b.count)/parseFloat(total==0?1:total))});
    item.total=total;
    item.answers=a

  }
  res.json(ret);

})
router.get('/votes/:trackid', async(req, res, next) =>{

//  req.knex.select("*").from("t_cbrf_codes")
  var ret=await req.knex.select("*").from("t_cbrf_vote").where({isDeleted:false, trackid:req.params.trackid}).orderBy("id");;

  for(var item of ret){
    var total=0;
    var a=await req.knex.select("*").from("t_cbrf_voteanswers").where({isDeleted:false, voteid:item.id}).orderBy("id");
    a.forEach(b=>{total+=b.count});

    a.forEach(b=>{b.perc=parseFloat(parseFloat(b.count)/parseFloat(total==0?1:total))});
    item.total=total;
    item.answers=a

  }
  res.json(ret);

})
router.get('/tracks', async(req, res, next) =>{

//  req.knex.select("*").from("t_cbrf_codes")
  var ret=await req.knex.select("*").from("t_cbrf_tracks").where({isDeleted:false}).orderBy("date");
  res.json(ret);

})
router.get('/faq', async(req, res, next) =>{

//  req.knex.select("*").from("t_cbrf_codes")
  var ret=await req.knex.select("*").from("t_cbrf_faq").where({isDeleted:false}).orderBy("id");
  res.json(ret);

})
router.get('/pgm', async(req, res, next) =>{

//  req.knex.select("*").from("t_cbrf_codes")
  var ret=await req.knex.select("*").from("t_cbrf_pgm").where({isDeleted:false}).orderBy(["trackid", "time"]);;
  res.json(ret);

})


router.post('/voting', async(req, res, next) =>{
  var a=await req.knex.select("*").from("t_cbrf_voteanswers").where({id:req.body.id})
  await req.knex("t_cbrf_voteanswers").update({count:(a[0].count+1)}).where({id:req.body.id})
  res.json(req.body.id)
});

router.post('/unvote', async(req, res, next) =>{
  for(var item of req.body) {

    var a = await req.knex.select("*").from("t_cbrf_voteanswers").where({id: item.id})
    if(a[0].count>0) {
      console.log("unvote", {count: (a[0].count - 1), id:req.body.id})
      await req.knex("t_cbrf_voteanswers").update({count: (a[0].count - 1)}).where({id: item.id})
    }
  }
  res.json(req.body.id)
});



router.post('/voteAdd', adminLogin,async(req, res, next) =>{
  var ret=await req.knex("t_cbrf_vote").insert({trackid:req.body.trackid},"*");
  ret[0].answers=await req.knex("t_cbrf_voteanswers").insert([{voteid:ret[0].id},{voteid:ret[0].id}],"*");
  res.json(ret[0]);

})


router.post('/trackAdd', adminLogin,async(req, res, next) =>{
  var ret=await req.knex("t_cbrf_tracks").insert({},"*");
  //ret[0].answers=await req.knex("t_cbrf_voteanswers").insert([{voteid:ret[0].id},{voteid:ret[0].id}],"*");
  res.json(ret[0]);

})
router.post('/pgmAdd', adminLogin,async(req, res, next) =>{
  var ret=await req.knex("t_cbrf_pgm").insert({},"*");
  //ret[0].answers=await req.knex("t_cbrf_voteanswers").insert([{voteid:ret[0].id},{voteid:ret[0].id}],"*");
  res.json(ret[0]);

})
router.post('/faqAdd', adminLogin,async(req, res, next) =>{
  var ret=await req.knex("t_cbrf_faq").insert({},"*");
  //ret[0].answers=await req.knex("t_cbrf_voteanswers").insert([{voteid:ret[0].id},{voteid:ret[0].id}],"*");
  res.json(ret[0]);

})

router.post('/trackChange', adminLogin,async(req, res, next) =>{

  var id=req.body.id;
  delete  req.body.id;
  var ret=await req.knex("t_cbrf_tracks").update(req.body,"*").where({id:id});
  res.json(ret[0]);

})

router.post('/pgmChange', adminLogin,async(req, res, next) =>{

  var id=req.body.id;
  delete  req.body.id;
  var ret=await req.knex("t_cbrf_pgm").update(req.body,"*").where({id:id});
  res.json(ret[0]);

})
router.post('/faqChange', adminLogin,async(req, res, next) =>{

  var id=req.body.id;
  delete  req.body.id;
  var ret=await req.knex("t_cbrf_faq").update(req.body,"*").where({id:id});
  res.json(ret[0]);

})


router.post('/addVoteAnswer', adminLogin,async(req, res, next) =>{
  var ret=await req.knex("t_cbrf_voteanswers").insert({voteid:req.body.id},"*");
  res.json(ret[0]);

})



router.post('/voteChange', adminLogin,async(req, res, next) =>{
  var id=req.body.id;
  delete req.body.id;
  delete req.body.answers;
  delete req.body.total;
  var ret=await req.knex("t_cbrf_vote").update(req.body,"*").where({id:id});
  res.json(ret[0]);

})
router.post('/answerChange', adminLogin,async(req, res, next) =>{
  var id=req.body.id;
  delete req.body.id;
  var ret=await req.knex("t_cbrf_voteanswers").update({title:req.body.title, title_en:req.body.title_en},"*").where({id:id});
  res.json(ret[0]);

})

router.post('/state', adminLogin,async(req, res, next) =>{
  req.state=req.body;
  console.log("req.state", req.state)
  await req.knex("t_cbrf_state").update({val:JSON.stringify(req.state)});
  res.json(req.state);
})


async function sendMailToUser(user, lang){

  console.log("sendMailToUser")
  let mailAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport({
    host: "smtp.yandex.ru",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "info@ifcongress.org", // generated ethereal user
      pass: "KongresInf@", // generated ethereal password
    },
    tls: {
      ciphers:'SSLv3'
    }
  });
  var text="<div style='background-color: #EFF7FF; padding: 24px'>"+
      "<div style='width: 100%; text-align: center'><img  src='https://ifcongress.ru/images/letterheader.png'  style='margin: 24px auto;width: 280px;height: auto;'/></div>"+
      "<div style='background-color: #E2F0FF;padding:24px;border-radius: 24px'><p>Здравствуйте <b>"+user.i+",</b></p>\n" +
      "\n" +
      "<p>Благодарим за регистрацию <br>на Международный Финансовый Конгресс. </p>\n" +
      "\n" +
      "<p><b>Ваша регистрация прошла успешно.</b></p>\n" +
      "\n" +
      "<p>Вы можете смотреть мероприятия конгресса, задавать вопросы спикерам и участвовать в опросах на сайте <a href='https://ifcongress.ru'>ifcongress.ru</a>."+
      "<br>Для авторизации на сайте нажмите кнопку «Вход» и введите e-mail, который Вы использовали при регистрации. <br>Трансляция будет доступна на сайте https://ifcongress.ru с 28 июня по 2 июля 2021 года." +
      "</p>\n" +
      "<p>Трансляция будет также доступна на YouTube канале Банка России.</p>" +
      "<p><b>Команда МФК</b>\n" +
      "<br>e-mail: info@ifcongress.org</p></div>"+
      "<div style='width: 100%; text-align: right'><img src='https://ifcongress.ru/images/letterfooter.png'  src='https://ifcongress.ru/images/letterfooter.png'  style='margin: 24px auto'></div>"+
      "</div>";

 if(lang=="en")
      text="<div style='background-color: #EFF7FF; padding: 24px'>"+
       "<div style='width: 100%; text-align: center'><img  src='https://ifcongress.ru/images/letterheader_en.png'  style='margin: 24px auto;width: 280px;height: auto;'/></div>"+
       "<div style='background-color: #E2F0FF;padding:24px;border-radius: 24px'><p>Dear Mr/Ms  <b>"+user.i+",</b></p>\n" +
       "\n" +
       "<p>Thank you for registering <br>for the International Financial Congress 2021. </p>\n" +
       "\n" +
       "<p><b>Your registration is successfully completed.</b></p>\n" +
       "\n" +
       "<p> You can watch IFC 2021’s events, send your questions to speakers and participate in polls at  <a href='https://ifcongress.ru/index/en'>ifcongress.ru</a>.</p>"+
          "<p>The broadcast will start on June,28 on the website <a href='https://ifcongress.ru/index/en'>https://ifcongress.ru/index/en</a></p> " +
       "<p>To get access to all the features available to registered participants, press the “Log in” button on the IFC’s website  <a href='https://ifcongress.ru/index/en'>https://ifcongress.ru/index/en</a> and enter the email address you used for the registration.</p>" +
       "<p>The broadcast willalso be available on the Bank of Russia’s YouTube channel.</p>" +
        "<p>See you at the IFC 2021!</p>"+
       "<p><b>Sincerely, IFC Team </b>\n" +
       "<br>e-mail: info@ifcongress.org</p></div>"+
       "<div style='width: 100%; text-align: right'><img src='https://ifcongress.ru/images/letterfooter.png'  src='https://ifcongress.ru/images/letterfooter.png'  style='margin: 24px auto'></div>"+
       "</div>";

  let info = await transporter.sendMail({
    from: 'info@ifcongress.org', // sender address
    to: user.email, // list of receivers
    subject: "Registering for the International Financial Congress 2021", // Subject line
    //text: , // plain text body
    html: text, // html body
  });

}


router.get('/liveTracks',async(req, res, next) =>{
  var ret=await req.knex.select("*").from("t_cbrf_tracks").where({isDeleted:false, onAir:true});
  res.json(ret);
})





module.exports = router;
