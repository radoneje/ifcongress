var pgm=new Vue({
    el:"#app",
    data:{
        q:[],
        tracks:[],
        track:null,
    },
    methods:{
        reloadQ:async function(){
            try {
                var ret = await axios.get("/api/q/"+this.track);
                ret.data.q.reverse()
                this.q = ret.data.q.filter(q=>{return q.isSpk});
            }
            catch (e) {
                console.warn(e)
            }
        },
        updateQ:async function(){
           if(this.track)
               await this.reloadQ();
            setTimeout(()=>{this.updateQ()},10*1000)
        },
    },
    watch: {
        track:async function(){
            if(this.track)
                await this.reloadQ();
        }
    },
    mounted:async function () {
        this.tracks=(await axios.get("/api/tracks")).data;
        console.log(this.tracks);
        this.updateQ();
        setTimeout(()=>{   document.body.style.opacity=1;
        },500)
    }

})


