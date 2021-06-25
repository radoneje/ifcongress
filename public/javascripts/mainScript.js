var app;
var PlayerObserver=false;
        app = new Vue({
            el: "#app",
            data: {
                pgmItemModal: null,
                spkItemModal: null,
                reqModal: null,
                user: JSON.parse(localStorage.getItem("user") || '{"isPromice":false}'),
                reqProcess: false,
                tracks: [],
                tracksDate: [],
                currTrack: {},
                currShowTrack: {},
                trackRotateTimeout: 0,
                pgm: [],
                spk: [],
                curSpeakersPage: 0,
                curSpeakers: [],
                faq: [],
                menuModal: false,
                lang:lang,
                loginModal:false,
                recModal:null,
                loginUser:JSON.parse(localStorage.getItem("user") || '{"isPromice":false}'),
                loginUserErr:false,
                liveTracks:[],
                currLiveTrack:null,
                isQ:true,
                q:[],
                qText:"",
                chat:[],
                chatText:"",
                chatTextSend:false,
                votes:[],
                myVotes:[],

            },
            methods: {
                voting:async function(answer){

                    var myVote={voteid:answer.voteid, id:answer.id};
                    var len=this.myVotes.length;
                    var old=this.myVotes.filter(v=>v.voteid==myVote.voteid);
                    if(old.length>0){
                        await axios.post("/api/unvote",old);
                        this.myVotes=this.myVotes.filter(v=>v.voteid!=myVote.voteid);
                    }
                    this.myVotes.push(myVote);
                    await axios.post("/api/voting",myVote);
                    localStorage.setItem("votes",JSON.stringify(this.myVotes) )
                },
                checkVote: function(answer){
                    console.log(this.myVotes.filter(v=>v.voteid==answer.voteid && v.id==answer.id).length>0)
                    return this.myVotes.filter(v=>v.voteid==answer.voteid && v.id==answer.id).length>0
                },
                reloadQ:async function(){
                    console.log("reloadQ", "/api/q/"+this.currLiveTrack.id)
                    try {
                        if (this.currLiveTrack)
                            this.q = (await axios.get("/api/q/" + this.currLiveTrack.id)).data.q;
                        console.log(this.q)
                    }
                    catch (e) {
                        console.warn(e)
                    }
                },
                reloadChat:async function(){

                    try {
                    if(this.currLiveTrack)
                        this.chat=(await axios.get("/api/chat/"+this.currLiveTrack.id)).data.chat;
                    }
                    catch (e) {
                        console.warn(e)
                    }
                },
                reloadVote:async function(){
                    try {
                        var ret = await axios.get("/api/votes/"+this.currLiveTrack.id);
                        this.votes = ret.data;
                    }
                    catch (e) {
                        console.warn(e)
                    }


                },
                updateChat:async function(){
                    if(this.currLiveTrack)
                        await this.reloadChat();
                    setTimeout(()=>{this.updateChat()},10000);
                },
                updateVote:async function(){
                    if(this.currLiveTrack)
                        await this.reloadVote();
                    setTimeout(()=>{this.updateVote()},10000);
                },
                updateQ:async function(){
                    if(this.currLiveTrack)
                        await this.reloadQ();
                    setTimeout(()=>{this.updateQ()},10000);
                },
                newChat:async function(){
                    this.chatTextSend=true
                    try{

                        if(this.chatText.length>0){
                            var ret=await axios.post("/api/chat",{text:this.chatText, trackid:this.currLiveTrack.id, userid:this.user.id });
                            this.chatText="";
                            this.chat.push(ret.data);
                            var objDiv = document.getElementById("chatBox");
                            if(objDiv)
                                setTimeout(function () {
                                    objDiv.scrollTop = objDiv.scrollHeight;
                                }, 0)
                            setTimeout(()=>{this.chatTextSend=false},2000)
                        }
                        else
                            this.chatTextSend=false
                    }
                    catch (e) {
                        console.warn(e);
                        this.chatTextSend=false

                    }
                },
                newQ:async function(){
                    this.chatTextSend=true
                    try{

                        if(this.qText.length>0){
                            var ret=await axios.post("/api/q",{text:this.qText, trackid:this.currLiveTrack.id, userid:this.user.id});
                            this.qText="";
                            this.q.push(ret.data);
                            var objDiv = document.getElementById("qBox");
                            if(objDiv)
                                setTimeout(function () {
                                    objDiv.scrollTop = objDiv.scrollHeight;
                                }, 0)
                            setTimeout(()=>{this.chatTextSend=false},2000)
                        }
                        else
                            this.chatTextSend=false
                    }
                    catch (e) {
                        console.warn(e);
                        this.chatTextSend=false

                    }
                },
                getSessionFromSpk: function (spk) {
                    var ret = [];

                    this.pgm.forEach(p => {
                        if (p.moderators)
                            p.moderators.forEach(m => {
                                if (m == spk.id)
                                    ret.push(p);
                            })
                        if (p.speakers)
                            p.speakers.forEach(m => {
                                if (m == spk.id)
                                    ret.push(p);
                            })

                    })

                    ret.forEach(p => {
                        //   var track=this.tracks.filter(t=>t.id==p.trackid);
                        //   p.key=moment(track[0].data).format("DD MMM")
                    });


                    return ret;
                },
                curSpeakersPagePreview: function () {
                    this.curSpeakersPage--;
                    if (this.curSpeakersPage < 0)
                        this.curSpeakersPage = parseInt(this.spk.length / 8);
                },
                curSpeakersPageNext: function () {
                    this.curSpeakersPage++;
                    if (this.curSpeakersPage > parseInt(this.spk.length / 8))
                        this.curSpeakersPage=0;
                },
                getHtml: function (string) {
                    if (!string)
                        return "<br/>";
                    string = string.replace(/\n/g, "<br/>");
                    return string
                },
                goToReg:function(){
                    this.user={"isPromice":false};
                    localStorage.setItem("user", JSON.stringify(this.user))
                    this.reqModal=true
                },
                regUser: async function () {
                    if (this.reqProcess)
                        return;
                    if (!this.checkUser())
                        return;
                    if (this.user.id)
                        return;
                    this.reqProcess = true;
                    var ret = await axios.post("/api/regUser/" + lang, this.user);
                    this.user = ret.data;
                    this.user.isPromice = true;
                    localStorage.setItem("user", JSON.stringify(this.user))
                    this.reqProcess = false;
                    this.loginUser= this.user;
                    localStorage.setItem("loginUser", JSON.stringify(this.user))
                },
                logOut:function(){
                    this.loginUser={"isPromice":false};
                    localStorage.setItem("loginUser", JSON.stringify(this.loginUser))
                    this.user={"isPromice":false};
                    localStorage.setItem("user", JSON.stringify(this.user))
                },
                logUser:async function () {
                    if (this.reqProcess)
                        return;
                    if (!this.checkLoginUser())
                        return;

                    this.reqProcess = true;
                    var ret = await axios.post("/api/logUser/" + lang, this.user);
                    console.log(" ret.data",  ret.data)
                    if(!ret.data) {
                        this.loginUserErr=true;
                        this.reqProcess = false;
                        return;
                    }

                    this.reqProcess = false;
                    this.user = ret.data;
                    this.loginUser= ret.data;
                    this.loginModal=false;
                    localStorage.setItem("loginUser", JSON.stringify(this.user))
                    localStorage.setItem("user", JSON.stringify(this.user))

                },
                checkLoginUser:function () {

                    if (!validateEmail(this.user.email))
                        return false
                    return true;
                },
                checkUser: function () {

                    if (!this.user.f)
                        return false
                    if (!this.user.i)
                        return false
                    if (!this.user.email)
                        return false
                    if (!this.user.company)
                        return false
                    if (!this.user.isPromice)
                        return false

                    if (this.user.f.length < 2)
                        return false
                    if (this.user.i.length < 2)
                        return false
                    if (this.user.company < 2)
                        return false

                    console.log("validateEmail", validateEmail(this.user.email))
                    if (!validateEmail(this.user.email))
                        return false


                    return true;


                },
                getSpk: function (id) {
                    var ret = this.spk.filter(s => s.id == id);
                    return ret[0];
                }

                ,
                rotateTrack: function () {
                    return;
                    this.currShowTrack = this.tracks.shift();
                    this.tracks.push(this.currShowTrack);
                    this.trackRotateTimeout = setTimeout(() => {
                        this.rotateTrack()
                    }, 10000)
                },
                previewTrack: function () {
                    var lastid = this.currShowTrack.id;
                    this.currShowTrack = this.tracks.pop();
                    this.tracks.unshift(this.currShowTrack);
                    if (lastid == this.currShowTrack.id)
                        return this.previewTrack();
                    if(!this.currShowTrack.showInBanner)
                        return this.previewTrack();
                    clearTimeout(this.trackRotateTimeout)
                    this.trackRotateTimeout = setTimeout(() => {
                        this.rotateTrack()
                    }, 10000)

                },
                nextTrack: function () {
                    var lastid = this.currShowTrack.id;
                    this.currShowTrack = this.tracks.shift();
                    this.tracks.push(this.currShowTrack);
                    if (lastid == this.currShowTrack.id)
                        return this.nextTrack();
                    if(!this.currShowTrack.showInBanner)
                        return this.nextTrack();
                    clearTimeout(this.trackRotateTimeout)
                    this.trackRotateTimeout = setTimeout(() => {
                        this.rotateTrack()
                    }, 10000)
                },
                changePgmItem: function (track) {
                    this.currTrack = track;

                    EPPZScrollTo.scrollVerticalToElementById('pgmItems', 100)
                },
                showPopSpeaker: function (item) {
                    this.spkItemModal = item
                },
                copyPgmLink:async function(pgmItemModal, event){
                    var url_string= window.location.href
                    var url = new URL(url_string);
                    var link=url.origin+""+ url.pathname+"?sessionid="+pgmItemModal.id;
                    var txt=event.target.innerHTML;
                    await navigator.clipboard.writeText(link)
                    console.log("event",event)
                    event.target.innerHTML= lang=="ru"?"Скопировано" :"Copied";
                    setTimeout(async ()=>{
                        event.target.innerHTML=txt;
                    },2000)
                    console.log(event, url)
                },
                updatePlayer:async function () {
                    try {
                        this.liveTracks=(await axios.get("/api/liveTracks")).data;

                    }
                    catch (e) {
                        console.warn(e)
                    }
                    setTimeout(()=>{this.updatePlayer()},10000);
                }
            },
            watch: {
                pgmItemModal: function () {
                    if (this.pgmItemModal)
                        document.body.style.overflow = "hidden";
                    else
                        document.body.style.overflow = "scroll";
                },
                spkItemModal: function () {
                    if (this.spkItemModal)
                        document.body.style.overflow = "hidden";
                    else
                        document.body.style.overflow = "scroll";
                },
                reqModal: function () {
                    if (this.reqModal) {
                        this.menuModal = false;
                        this.loginModal=false;
                        document.body.style.overflow = "hidden";
                    } else
                        document.body.style.overflow = "scroll";
                },
                menuModal: function () {
                    if (this.menuModal)
                        document.body.style.overflow = "hidden";
                    else
                        document.body.style.overflow = "scroll";
                },
                loginModal: function () {
                    if (this.loginModal) {
                        document.body.style.overflow = "hidden";
                        this.loginUserErr=false;
                        this.menuModal = false;
                        this.reqModal= false;
                    }
                    else
                        document.body.style.overflow = "scroll";
                },
                liveTracks:function () {

                    if(this.liveTracks.length==0)
                        return this.currLiveTrack=null;
                    if(!this.currLiveTrack )
                        return this.currLiveTrack=this.liveTracks[0];
                    if(this.liveTracks.filter(t=>{return t.id==this.currLiveTrack.id}).length==0)
                        return this.currLiveTrack=this.liveTracks[0];

                },
                currLiveTrack:function () {
                    this.reloadQ();
                    this.reloadVote();
                    console.log("init on")
                    if(this.currLiveTrack && !PlayerObserver){
                        PlayerObserver = new IntersectionObserver((entries, observer)=>{
                            console.log("INTERSEPT", entries[0])
                            var elem=document.querySelector('#playerBody').querySelector("iframe")
                            console.log(elem)
                            if(elem) {
                                if (!entries[0].isIntersecting) {
                                    var top = document.querySelector('#playerBody').offsetTop;
                                    if(window.pageYOffset>top)
                                    elem.classList.add("fixed")
                                }
                                else
                                    elem.classList.remove("fixed")

                            }

                                }, {
                                    //root: document.querySelector('#spkPage'),
                                    rootMargin: '0px',
                                    threshold: .0
                                });


                        setTimeout(() => {
                            PlayerObserver.observe(document.querySelector('#playerBody'));
                        }, 1000)
                    }
                    if(!this.currLiveTrack ){
                        PlayerObserver=null;
                        console.log("init off")
                    }
                }
            },
            mounted: async function () {
                moment.locale(lang)
                console.log("loginUser", this.loginUser)
                this.tracks = (await axios.get('/api/tracks')).data;

                this.tracks.forEach(t => {
                    var key = moment(t.date).format("DD MMMM")
                    var items = this.tracksDate.filter(t => {
                        return t.key == key
                    })
                    if (items.length == 0) {
                        this.tracksDate.push({key: key, tracks: []})
                    }
                    items = this.tracksDate.filter(t => {
                        return t.key == key
                    })
                    t.key = key;
                    items[0].tracks.push(t);
                    items.sort(function (a, b) {
                        if (a.key < b.key) {
                            return -1;
                        }
                        if (a.key > b.key) {
                            return 1;
                        }
                        return 0;
                    })

                });
                this.tracks.sort(function (a, b) {
                    if (a.key < b.key) {
                        return -1;
                    }
                    if (a.key > b.key) {
                        return 1;
                    }
                    return 0;
                });
                this.rotateTrack();
                this.currTrack = this.tracksDate[0].tracks[0];
                var plenar = this.tracks.filter(t => t.id == 6);
                if (plenar.length > 0)
                    this.currShowTrack = plenar[0]
                else
                    this.currShowTrack = this.tracks[0]
                this.currTrack = this.currShowTrack
                this.pgm = (await axios.get('/api/pgm')).data;

                this.pgm.forEach(p => {
                    var track = this.tracks.filter(t => t.id == p.trackid);
                    if (track.length > 0) {
                        p.key = track[0].key;

                    }

                })




                this.spk = (await axios.get('/api/spk')).data;
                this.spk.forEach(s => {
                    if (s.i)
                        s.i = s.i.replace(/\s/g, "")
                    if (s.f)
                        s.f = s.f.replace(/\s/g, "")
                })
                var i = 0;
                var page = 0;
                this.curSpeakers[page] = []
                this.spk.forEach(s => {
                    this.curSpeakers[page].push(s);
                    i++;
                    if (i >= 8) {
                        i = 0;
                        page++;
                        this.curSpeakers[page] = []
                    }
                })
                this.faq = (await axios.get('/api/faq')).data;

                var url_string= window.location.href
                var url = new URL(url_string);
                var sessionid = url.searchParams.get("sessionid");
                if(sessionid && sessionid.match(/\d{1,2}/)){
                    this.pgm.forEach(p=>{
                        if(p.id==sessionid){
                            this.tracks.forEach(t=>{
                                if(t.id==p.trackid)
                                    this.currTrack=t;
                            })
                            console.log("this.pgmItemModa", p)
                            this.pgmItemModal=p;
                        }
                    });
                }


                var options = {
                    root: document.querySelector('#spkPage'),
                    rootMargin: '0px',
                    threshold: 0.1
                }
                var callback = (entries, observer) => {
                    if (entries[0].isIntersecting) {
                        var currLen = this.curSpeakers[this.curSpeakersPage].length
                        var inserted=0;
                        for (var i = currLen; i < this.spk.length && i < currLen + 8; i++) {
                            this.curSpeakers[this.curSpeakersPage].push(this.spk[i])
                            inserted++;
                        }
                        if(inserted==0){
                            var tmp=[];
                            this.curSpeakers[this.curSpeakersPage].forEach(c=>{tmp.push(c)});
                            console.log("push all spk", tmp)
                            tmp.forEach(c=>{this.curSpeakers[this.curSpeakersPage].push(c)})
                        }
                        this.curSpeakers = this.curSpeakers.filter(r => {
                            return true
                        })
                    }
                };
                var observer = new IntersectionObserver(callback, options);
                var target = document.querySelector('#spkChild');
                setTimeout(() => {
                    observer.observe(target);
                    document.querySelectorAll('#spkChild').forEach(img => observer.observe(img))
                }, 1000)


                var pgmobserver = new IntersectionObserver((entries, observer)=>{
                    if (entries[0].isIntersecting)
                        document.getElementById("progUpBtnWr").classList.add("fixedBottomButton")
                    else
                        document.getElementById("progUpBtnWr").classList.remove("fixedBottomButton")


                }, {
                    //root: document.querySelector('#spkPage'),
                    rootMargin: '0px',
                    threshold: 0
                });


                setTimeout(() => {
                    pgmobserver.observe(document.querySelector('#pgmItems'));
                }, 1000)



                var spkbserver = new IntersectionObserver((entries, observer)=>{
                    if (entries[0].isIntersecting)
                        document.getElementById("progUpBtnWr").classList.add("hide")
                    else
                        document.getElementById("progUpBtnWr").classList.remove("hide")


                }, {
                    //root: document.querySelector('#spkPage'),
                    rootMargin: '0px',
                    threshold: .01
                });


                setTimeout(() => {
                    spkbserver.observe(document.querySelector('#spkPage'));
                }, 1000)

                document.body.style.opacity = "1"
                await this.updatePlayer();
                this.updateQ();
                this.updateChat();
                this.updateVote();
                try {
                    var jsonvotes = localStorage.getItem("votes")
                    if (jsonvotes) {
                        this.myVotes = JSON.parse(jsonvotes)

                    }
                }catch (e) {
                    console.warn(e)
                }
            }


        })

        window.addEventListener("scroll", setMenu)
        setMenu();

function setMenu() {
    var a=window.scrollY;
    var elem=document.getElementById("headerMenuWr")
    if(a>15 )
        elem.classList.add("fixedMenu")
    if(a<=14 )
        elem.classList.remove("fixedMenu")

    elem=document.getElementById("firstWr")
    if(a>15 )
        elem.classList.add("fixedMenufirstWr")
    if(a<=14 )
        elem.classList.remove("fixedMenufirstWr")
}
var EPPZScrollTo =
    {
        /**
         * Helpers.
         */
        documentVerticalScrollPosition: function()
        {
            if (self.pageYOffset) return self.pageYOffset; // Firefox, Chrome, Opera, Safari.
            if (document.documentElement && document.documentElement.scrollTop) return document.documentElement.scrollTop; // Internet Explorer 6 (standards mode).
            if (document.body.scrollTop) return document.body.scrollTop; // Internet Explorer 6, 7 and 8.
            return 0; // None of the above.
        },

        viewportHeight: function()
        { return (document.compatMode === "CSS1Compat") ? document.documentElement.clientHeight : document.body.clientHeight; },

        documentHeight: function()
        { return (document.height !== undefined) ? document.height : document.body.offsetHeight; },

        documentMaximumScrollPosition: function()
        { return this.documentHeight() - this.viewportHeight(); },

        elementVerticalClientPositionById: function(id)
        {
            var element = document.getElementById(id);
            var rectangle = element.getBoundingClientRect();
            return rectangle.top;
        },

        /**
         * Animation tick.
         */
        scrollVerticalTickToPosition: function(currentPosition, targetPosition)
        {
            var filter = 0.2;
            var fps = 60;
            var difference = parseFloat(targetPosition) - parseFloat(currentPosition);

            // Snap, then stop if arrived.
            var arrived = (Math.abs(difference) <= 0.5);
            if (arrived)
            {
                // Apply target.
                scrollTo(0.0, targetPosition);
                return;
            }

            // Filtered position.
            currentPosition = (parseFloat(currentPosition) * (1.0 - filter)) + (parseFloat(targetPosition) * filter);

            // Apply target.
            scrollTo(0.0, Math.round(currentPosition));

            // Schedule next tick.
            setTimeout("EPPZScrollTo.scrollVerticalTickToPosition("+currentPosition+", "+targetPosition+")", (1000 / fps));
        },

        /**
         * For public use.
         *
         * @param id The id of the element to scroll to.
         * @param padding Top padding to apply above element.
         */
        scrollVerticalToElementById: function(id, padding)
        {
            var element = document.getElementById(id);
            if (element == null)
            {
                console.warn('Cannot find element with id \''+id+'\'.');
                return;
            }

            var targetPosition = this.documentVerticalScrollPosition() + this.elementVerticalClientPositionById(id) - padding;
            var currentPosition = this.documentVerticalScrollPosition();

            // Clamp.
            var maximumScrollPosition = this.documentMaximumScrollPosition();
            if (targetPosition > maximumScrollPosition) targetPosition = maximumScrollPosition;

            // Start animation.
            this.scrollVerticalTickToPosition(currentPosition, targetPosition);
        }
    };
function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    })
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
}
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}