var pgm=new Vue({
    el:"#app",
    data:{
        pgmItemModal:null,
        spkItemModal:null,
        reqModal:null,
        user:JSON.parse( localStorage.getItem("user") || '{"isPromice":false}'),
        reqProcess:false,
        tracks:[],
        tracksDate:[],
        currTrack:{},
        currShowTrack:{},
        trackRotateTimeout:0,
        pgm:[],
        spk:[],
        curSpeakersPage:0,
        curSpeakers:[],
        faq:[]
    },
    methods:{
        getSessionFromSpk:function(spk){
            var ret=[];
            this.pgm.forEach(p=>{
                if(p.moderators)
                    p.moderators.forEach(m=>{
                        if(m==spk.id)
                            ret.push(p);
                    })
                if(p.speakers)
                    p.speakers.forEach(m=>{
                        if(m==spk.id)
                            ret.push(p);
                    })

            })
            ret.forEach(p=>{
                var track=this.tracks.filter(t=>t.id==p.trackid);
                p.key=moment(track[0].data).format("DD MMM")
            });
           return ret;
        },
        curSpeakersPagePreview:function(){
            this.curSpeakersPage--;
            if(this.curSpeakersPage<0)
                this.curSpeakersPage=0;
        },
        curSpeakersPageNext:function(){
            this.curSpeakersPage++;
            if(this.curSpeakersPage>parseInt(this.spk.length/8))
                this.curSpeakersPage--;
        },
        getHtml:function(string){
            if(!string)
                return "<br/>";
            string=string.replace(/\n/g,"<br/>");
            return  string
        },

        regUser:async function(){
            if(this.reqProcess)
                return ;
            if(!this.checkUser())
                return ;
            if(this.user.id)
                return ;
            this.reqProcess=true;
            var ret=await axios.post("/api/regUser", this.user);
            this.user=ret.data;
            this.user.isPromice=true;
            localStorage.setItem("user", JSON.stringify(this.user))
            this.reqProcess=false;
        },
        checkUser:function() {

            if(!this.user.f)
               return false
            if(!this.user.i)
                return false
            if(!this.user.email)
                return false
            if(!this.user.isPromice)
                return false

            if(this.user.f.length<2)
                return false
            if(this.user.i.length<2)
                return false
            console.log("validateEmail", validateEmail(this.user.email))
            if(!validateEmail(this.user.email))
                return false


            return true;



        },
        getSpk:function(id){
            var ret=this.spk.filter(s=>s.id==id);
            return ret[0];
        }

        ,
        rotateTrack:function () {
            return;
            this.currShowTrack=this.tracks.shift();
            this.tracks.push(this.currShowTrack);
            this.trackRotateTimeout=setTimeout(()=>{this.rotateTrack()}, 10000)
        },
        previewTrack:function () {
            this.currShowTrack=this.tracks.pop();
            this.tracks.unshift(this.currShowTrack);

            clearTimeout(this.trackRotateTimeout)
            this.trackRotateTimeout=setTimeout(()=>{this.rotateTrack()}, 10000)
        },
        nextTrack:function () {
            this.currShowTrack=this.tracks.shift();
            this.tracks.push(this.currShowTrack);
            clearTimeout(this.trackRotateTimeout)
            this.trackRotateTimeout=setTimeout(()=>{this.rotateTrack()}, 10000)
        },
        changePgmItem:function(track){
            this.currTrack=track;

            EPPZScrollTo.scrollVerticalToElementById('pgmItems', 100)
        },
        showPopSpeaker:function (item) {
            this.spkItemModal=item
        }
    },
    watch:{
        pgmItemModal:function () {
            if(this.pgmItemModal)
                document.body.style.overflow="hidden";
            else
                document.body.style.overflow="scroll";
        },
        spkItemModal:function () {
            if(this.spkItemModal)
                document.body.style.overflow="hidden";
            else
                document.body.style.overflow="scroll";
        },
        reqModal:function () {
            if(this.reqModal)
                document.body.style.overflow="hidden";
            else
                document.body.style.overflow="scroll";
        }
    },
    mounted:async function () {
        moment.locale('ru')

        this.tracks=(await axios.get('/api/tracks')).data;

        this.tracks.forEach(t=>{
            var key=moment(t.date).format("DD MMMM")
            var items=this.tracksDate.filter(t=>{return t.key==key})
            if(items.length==0) {
                this.tracksDate.push({key: key, tracks:[]})
            }
            items=this.tracksDate.filter(t=>{return t.key==key})
            t.key=key;
            items[0].tracks.push(t);
            items.sort(function(a, b){
                if(a.key < b.key) { return -1; }
                if(a.key > b.key) { return 1; }
                return 0;
            })

        });
        this.tracks.sort(function(a, b){
            if(a.key < b.key) { return -1; }
            if(a.key > b.key) { return 1; }
            return 0;
        });
        this.rotateTrack();
        this.currTrack=this.tracksDate[0].tracks[0];
        var plenar=this.tracks.filter(t=>t.id==6);
        if(plenar.length>0)
            this.currShowTrack=plenar[0]
        else
            this.currShowTrack=this.tracks[0]
        this.currTrack=this.currShowTrack
        this.pgm=(await axios.get('/api/pgm')).data;
        this.spk=(await axios.get('/api/spk')).data;
        var i=0;
        var page=0;
        this.curSpeakers[page]=[]
           this.spk.forEach(s=>{
               this.curSpeakers[page].push(s);
               i++;
               if(i>=8)
               {
                   i=0;
                   page++;
                   this.curSpeakers[page]=[]
               }
           })
        this.faq=(await axios.get('/api/faq')).data;



        document.body.style.opacity="1"
    }


})
window.addEventListener("scroll",setMenu)
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