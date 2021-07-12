var express = require('express');
var router = express.Router();
var content=require('./../content')
var fs=require('fs')



router.get('/ifsuper', async (req, res, next) =>{
  if(req.session.admin)
    res.render('admin', { title: 'admin' ,disable:[] });
  else
    res.render('adminLogin', { title: 'admin' });
});

router.post('/admin', async (req, res, next) =>{
  if(req.body.l!="editor" || req.body.p!="dfczgegrby" )
    res.render('adminlogin', { title: 'admin' });
  else
  {
    req.session.admin=true;
    res.render('admin', { title: 'admin' ,disable:[] });
  }
});

router.get('/moderator', async (req, res, next) =>{
  if(req.session.admin)
    res.render('admin', { title: 'admin' ,disable:[1,0,3,5,6,7] });
  else
    res.render('adminLogin', { title: 'admin' });
});

router.post('/moderator', async (req, res, next) =>{
  if(req.body.l!="editor" || req.body.p!="dfczgegrby" )
    res.render('adminlogin', { title: 'admin' });
  else
  {
    req.session.admin=true;
    res.render('admin', { title: 'admin' ,disable:[1,0,3,5,6,7] });
  }
});

router.get('/user_agreement', async (req, res, next) =>{
  return res.redirect('/ua_ru.pdf');
  //res.render('work', { title: 'under constaction' });

});
router.get('/eng/user_agreement/', async (req, res, next) =>{
  return res.redirect('/ua_en.pdf');
  //res.render('work', { title: 'under constaction' });

});
router.get('/zoom/:id' ,async(req, res, next)=> {
  var ret=await req.knex.select("*").from("t_cbrf_redirect").where({id:req.params.id});
  console.log("ret", ret)
  if(ret.length==0)
    return res.status(404).send("not found");
  res.redirect(ret[0].value)
});
router.get('/', async (req, res, next) =>{
  //return res.render('start_bak');
  //res.render('work', { title: 'under constaction' });
  res.redirect("/index/ru")

});
router.get('/player/:id/:lang?', async (req, res, next) =>{
  if(!req.params.lang)
    req.params.lang="ru"
res.render("player",{id:req.params.id, lang:req.params.lang})
})
router.get('/import', async (req, res, next) =>{
  const photos = await fs.promises.readdir(__dirname+"/../"+"public/images/photos/lores");
  for(var photo of photos) {
    await req.knex("t_cbrf_photos").insert({
      lores: '/images/photos/lores/' +photo,
      hires: '/images/photos/hires/' +photo
    })
  }
  res.json(1)

});

router.get('/index/:lang?', async (req, res, next) =>{

  //const photos = await fs.promises.readdir(__dirname+"/../"+"public/images/photos/lores");
  const photos = await req.knex.select("*").from("t_cbrf_photos").where({isDeleted:false}).orderBy("id")

  if(!req.params.lang)
    req.params.lang="ru"
  req.params.lang=req.params.lang.toLowerCase();
  if(!(req.params.lang=="ru" || req.params.lang=="en"))
    return res.redirect("/index/ru")
  //res.render('work', { title: 'under constaction' });
  var content=await req.knex.select("*").from("t_cbrf_settings").orderBy("id", 'desc')
  res.render('start', {  lang:req.params.lang, content:(content[0].content)[req.params.lang], photos:photos});

});

router.get('/test/:lang?', async (req, res, next) =>{
  if(!req.params.lang)
    req.params.lang="ru"
  req.params.lang=req.params.lang.toLowerCase();
  if(!(req.params.lang=="ru" || req.params.lang=="en"))
    return res.redirect("/test/ru")
  //res.render('work', { title: 'under constaction' });
  var content=await req.knex.select("*").from("t_cbrf_settings").orderBy("id", 'desc')
  res.render('test_start', {  lang:req.params.lang, content:(content[0].content)[req.params.lang]});

});

router.get('/login/:lang?', async (req, res, next) =>{
  return res.render('start');
  req.session["user"]=null;
  if(!req.params.lang)
    req.params.lang="ru"
  if(!(req.params.lang=="ru" || req.params.lang=="en"))
    req.params.lang="ru"
  var dept=await req.knex.select("*").from("t_cbrf_dept").orderBy("order")
  dept.forEach(d=>{
    delete d.code;
  })
  res.render('login', {  lang:req.params.lang, dept:dept });

})
router.get('/player', async (req, res, next) =>{
  if(!req.session.user)
    return next();
  res.render("player")
})

router.get('/badbrowser', async (req, res, next) =>{
  res.render("badbrowser")
})


router.get('/zoom/:id', async (req, res, next) =>{
  //res.render('work', { title: 'under constaction' });
  var ret=await req.knex.select("*").from("t_cbrf_redirect").where({id:req.params.id});
  if(ret.length<1)
    return res.sendStatus(404);

  res.redirect(ret[0].value)

});


module.exports = router;
