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


router.post("/q",userLogin, async(req, res, next)=> {
  if(!req.body.text)
    return res.sendStatus(405)
  if(!req.body.text.length>1200)
    return res.sendStatus(405)


  var ret=await req.knex("t_cbrf_q").insert({text:req.body.text, userid:req.session.user.id, date:new Date()}, "*")
  ret=await req.knex.select("*").from("v_cbrf_q").where({id:ret[0].id})

  res.json(ret[0]);
});
router.post("/chat",userLogin, async(req, res, next)=> {
  if(!req.body.text)
    return res.sendStatus(405)
  if(!req.body.text.length>1200)
    return res.sendStatus(405)


  var ret=await req.knex("t_cbrf_chat").insert({text:req.body.text, userid:req.session.user.id, date:new Date()}, "*")
  ret=await req.knex.select("*").from("v_cbrf_chat").where({id:ret[0].id})

  res.json(ret[0]);
});


router.post("/approveQ",adminLogin, async(req, res, next)=> {

  var ret=await req.knex("t_cbrf_q").update({isReady:req.body.isReady}, "*").where({id:req.body.id})
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



router.get("/chat", adminLogin, async(req, res, next)=> {
  var ret={};
  ret.q=await req.knex.select("*").from("v_cbrf_q").orderBy("id");;
  ret.chat=await req.knex.select("*").from("v_cbrf_chat").orderBy("id");
  ret.state=(await req.knex.select("*").from("t_cbrf_state"))[0].val;
  return res.json(ret);
});

router.get("/q", async(req, res, next)=> {
  var ret={};
  ret.q=await req.knex.select("*").from("v_cbrf_q").where({isReady:true}).orderBy("id");;
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
  check('email').isEmail().normalizeEmail()
], async(req, res, next)=> {

  var usr = await req.knex("t_cbrf_users").insert({
    f: req.body.f,
    i: req.body.i,
    o: req.body.o,
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


router.post('/voting', userLogin, async(req, res, next) =>{
  var a=await req.knex.select("*").from("t_cbrf_voteanswers").where({id:req.body.id})
  await req.knex("t_cbrf_voteanswers").update({count:(a[0].count+1)}).where({id:req.body.id})
  res.json(req.body.id)
});

router.post('/unvote', userLogin, async(req, res, next) =>{
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
  var ret=await req.knex("t_cbrf_vote").insert({},"*");
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
  var ret=await req.knex("t_cbrf_voteanswers").update({title:req.body.title},"*").where({id:id});
  res.json(ret[0]);

})

router.post('/state', adminLogin,async(req, res, next) =>{
  req.state=req.body;
  console.log("req.state", req.state)
  await req.knex("t_cbrf_state").update({val:JSON.stringify(req.state)});
  res.json(req.state);
})


async function sendMailToUser(user, lang){
  var headerImg="data:image/png;base64,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";
  var headerImg_en="data:image/png;base64,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";
  var footerImg="data:image/png;base64,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";

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
      "<div style='width: 100%; text-align: center'><img  src='"+headerImg+"'  style='margin: 24px auto;width: 280px;height: auto;'/></div>"+
      "<div style='background-color: #E2F0FF;padding:24px;border-radius: 24px'><p>Здравствуйте <b>"+user.i+",</b></p>\n" +
      "\n" +
      "<p>Благодарим за регистрацию <br>на Международный Финансовый Конгресс. </p>\n" +
      "\n" +
      "<p><b>Ваша регистрация прошла успешно.</b></p>\n" +
      "\n" +
      "<p>Вы можете смотреть мероприятия конгресса, задавать вопросы спикерам и участвовать в опросах на сайте <a href='https://ifcongress.ru'>ifcongress.ru</a>. <br>Трансляция будет доступна на YouTube канале Банка России." +
      "\n" +
      "\n" +
      "<p><b>Команда МФК</b>\n" +
      "<br>e-mail: info@ifcongress.org</p></div>"+
      "<div style='width: 100%; text-align: right'><img src='"+footerImg+"'  style='margin: 24px auto'></div>"+
      "</div>";

 if(lang=="en")
      text="<div style='background-color: #EFF7FF; padding: 24px'>"+
       "<div style='width: 100%; text-align: center'><img  src='"+headerImg_en+"'  style='margin: 24px auto;width: 280px;height: auto;'/></div>"+
       "<div style='background-color: #E2F0FF;padding:24px;border-radius: 24px'><p>Dear Mr/Ms  <b>"+user.i+",</b></p>\n" +
       "\n" +
       "<p>Thank you for registering <br>for the International Financial Congress 2021. </p>\n" +
       "\n" +
       "<p><b>Your registration is successfully completed.</b></p>\n" +
       "\n" +
       "<p> You can watch IFC 2021’s events, send your questions to speakers and participate in polls at  <a href='https://ifcongress.ru'>ifcongress.ru</a>. <br>The broadcast will also be available on the Bank of Russia’s YouTube channel." +
       "\n" +
       "\n" +
       "<p><b>Sincerely, IFC Team </b>\n" +
       "<br>e-mail: info@ifcongress.org</p></div>"+
       "<div style='width: 100%; text-align: right'><img src='"+footerImg+"'  src='https://ifcongress.ru/images/letterfooter.png'  style='margin: 24px auto'></div>"+
       "</div>";

  let info = await transporter.sendMail({
    from: 'info@ifcongress.org', // sender address
    to: user.email, // list of receivers
    subject: "Registering for the International Financial Congress 2021", // Subject line
    //text: , // plain text body
    html: text, // html body
  });

}






module.exports = router;
