var pgm=new Vue({
    el:"#app",
    data:{
        pgmItemModal:null,
        spkItemModal:null,
        reqModal:null,
        user:JSON.parse( localStorage.getItem("user") || '{"isPromice":false}'),
        reqProcess:false,
    },
    methods:{
        regUser:async function(){
            if(this.reqProcess)
                return ;
            if(!this.checkUser())
                return ;
            if(this.user.id)
                return ;
            this.reqProcess=true;
            setTimeout(()=>{
                this.reqProcess=false;
                this.user.id=1;
                localStorage.setItem("user", JSON.stringify(this.user))
            },2000)
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
    mounted:function () {
        document.body.style.opacity="1"
    }


})
window.addEventListener("scroll",(e)=>{
return;
    var a=window.scrollY;

var elem=document.getElementById("headerMenuWr")
  if(a>69 && elem.style.top!="0px")
      elem.style.top="0px"
  if(a<=69 && elem.style.top=="0px")
        elem.style.top="-89px"


})
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