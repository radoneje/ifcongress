var pgm=new Vue({
    el:"#app",
    data:{
        q:[],
        tracks:[],
        track:null,
    },
    methods:{
        updateQ:async function(){
            try {
                var ret = await axios.get("/api/q");
                ret.data.q.reverse()
                this.q = ret.data.q.filter(q=>{return !q.isSpk});
            }
            catch (e) {
                console.warn(e)
            }
            setTimeout(()=>{this.updateQ()},10*1000)
        },
    },
    watch: {
    },
    mounted:async function () {
        this.tracks=(await axios.get("/api/tracks")).data;
        console.log(this.tracks);
        this.updateQ();
        setTimeout(()=>{   document.body.style.opacity=1;
        },500)
    }

})


