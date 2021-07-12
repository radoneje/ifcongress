var app = new Vue({
    el: "#app",
    data: {
        loaded: false,
        sect: -1,
        stage: 1,
        showLoader: true,
        users: [],
        chat: [],
        q: [],
        descr: {content: "", speakers: "", site: ""},
        stat: {},
        spk: [],
        codes: [],
        newSpk: {photo: null, f: "", i: "", o: "", position: "", id: 0},
        redirect: [],
        newRedirect: {},
        votes: [],
        tracks: [],
        pgm: [],
        disable,
        faq: [],
        state: {q: true, chat: true},
        qTrackId: 0,
        photos: []
    },
    methods: {
        visibleQ: async function (val) {
            this.state.q = val;
            var ret = await axios.post("/adminApi/state", this.state);
            this.state = ret.data;
        },
        chekDisable: function (item) {
            return !disable.filter(d => d == item).length > 0
        },
        addVoteAnswer: async function (vote) {

            var ret = await axios.post("/adminApi/addVoteAnswer", vote);
            this.votes.forEach(v => {
                if (v.id == vote.id)
                    v.answers.push(ret.data);
            })
        },
        answerChange: async function (vote) {
            var ret = await axios.post("/adminApi/answerChange", vote);
            this.votes.forEach(v => {
                if (v.id == ret.voteid) {
                    v.answers.forEach(a => {
                        if (a.id == ret.id)
                            a = ret;
                    })
                }

            })
        },
        voteShow: async function (vote) {
            vote.iscompl = !vote.iscompl;

            await this.voteChange(vote);
        },
        voteStart: async function (vote) {
            vote.isactive = !vote.isactive;

            await this.voteChange(vote);
        },
        voteChange: async function (vote) {
            var ret = await axios.post("/adminApi/voteChange", vote);
            this.votes.forEach(v => {
                if (v.id == ret.data.id)
                    v = ret.data;
            })
        },
        addVote: async function () {
            var ret = await axios.post("/adminApi/voteAdd", {trackid: this.qTrackId});
            this.votes.push(ret.data);
        },
        addTrack: async function () {
            var ret = await axios.post("/adminApi/trackAdd");
            this.tracks.push(ret.data);
        },
        addPgm: async function () {
            var ret = await axios.post("/adminApi/pgmAdd");
            this.pgm.push(ret.data);
        },
        addFaq: async function () {
            var ret = await axios.post("/adminApi/faqAdd");
            this.faq.push(ret.data);
        },
        editTrack: async function (track) {
            try {
                JSON.parse(track.speakers)
            } catch (e) {
                track.speakers = "[" + track.speakers + "]"
            }
            if (track.speakers.indexOf("[") < 0)
                track.speakers = "[" + track.speakers + "]"
            var ret = await axios.post("/adminApi/trackChange", track);
            this.tracks.forEach(v => {
                if (v.id == ret.data.id)
                    v = ret.data;
            })
        },
        deleteTrack: async function (track) {
            track.isDeleted = true;
            await this.editTrack(track);
        },
        editPgm: async function (track) {
            try {
                JSON.parse(track.speakers)
            } catch (e) {
                track.speakers = "[" + track.speakers + "]"
            }
            if (track.speakers.indexOf("[") < 0)
                track.speakers = "[" + track.speakers + "]"
            try {
                JSON.parse(track.moderators)
            } catch (e) {
                track.moderators = "[" + track.moderators + "]"
            }
            if (track.moderators.indexOf("[") < 0)
                track.moderators = "[" + track.moderators + "]"

            var ret = await axios.post("/adminApi/pgmChange", track);
            this.pgm.forEach(v => {
                if (v.id == ret.data.id)
                    v = ret.data;
            })
        },
        deletePgm: async function (track) {
            track.isDeleted = true;
            await this.editPgm(track);
            this.tracks = this.tracks.filter(t => !t.isDeleted)
        },
        editFaq: async function (track) {

            var ret = await axios.post("/adminApi/faqChange", track);
            this.faq.forEach(v => {
                if (v.id == ret.data.id)
                    v = ret.data;
            })
        },
        deleteFaq: async function (track) {
            track.isDeleted = true;
            await this.editFaq(track);
            this.faq = this.faq.filter(t => !t.isDeleted)
        },

        editPhoto: async function (track) {

            var ret = await axios.post("/adminApi/photoChange", track);
            this.photo.forEach(v => {
                if (v.id == ret.data.id)
                    v = ret.data;
            })
        },
        deletePhoto: async function (track) {
            track.isDeleted = true;
            await this.editFaq(track);
            this.photo = this.photo.filter(t => !t.isDeleted)
        },
        messageToUser: async function (item) {
            item.messageIsActive = !item.messageIsActive;
            var ret = await axios.post('/adminApi/messageToUser', {user: item});
            this.users.forEach(u => {
                if (u.id == ret.id)
                    u = ret;
            })
        },
        addCode: async function (txt) {
            var ret = [];
            var err = false;
            let arrayOfLines = txt.match(/[^\r\n]+/g);
            txt.match(/[^\r\n]+/g).forEach(line => {
                var item = line.split(";");
                if (item.length >= 2) {
                    item[0] = item[0].trim();
                    if (isNormalInteger(item[0])) {
                        item[1] = item[1].trim();
                        item[1] = item[1].substr(0, 1).toUpperCase() + item[1].substring(1);
                        var elem = {
                            code: item[0],
                            f: item[1],
                            i: item[2],
                            o: item[3],
                            sourceDept: item[4]
                        }
                        ret.push(elem)
                    } else
                        err = true

                } else
                    err = true;
            })
            if (err)
                alert("ошибка формата");
            else {
                if (ret.length > 0) {
                    console.log("addcode", ret)
                    var str = await axios.post('/adminApi/codes', {users: ret});
                    str.data.forEach(s => {
                        this.codes.push(s);
                    })
                    alert("коды добавлены!")

                }
            }

        },
        editRedirect: async function (item) {
            var ret = await axios.post("/adminApi/redirect", item);
            item = ret.data;
        },
        addRedirect: async function (item) {
            var ret = await axios.post("/adminApi/redirectAdd", item);
            this.redirect.push(ret.data);
            this.newRedirect = {};
        },
        repositionSpk: async function (item, count) {
            item.sortOrder += count;
            var ret = await axios.post("/adminApi/repositionSpk", item);
            this.spk = ret.data;

        },
        deleteSpk: async function (item) {
            if (confirm("вы уверены?")) {
                var ret = await axios.delete("/adminApi/spk/" + item.id);
                item.isDeleted = true;
            }
        },
        editSpk: async function (item) {
            var ret = await axios.post("/adminApi/spk", item);
            item = ret.data;
        },
        addSpk: async function (item) {
            var ret = await axios.post("/adminApi/addSpk", item);
            this.spk.push(ret.data)
            this.newSpk = {};
        },
        editTrackImg: async function (item) {
            var elem = document.createElement("input")
            elem.type = "file"
            elem.display = "none"
            elem.onchange = async (e) => {
                var formData = new FormData()
                formData.append("image", elem.files[0]);
                var res = await axios.post('/adminApi/trackImage', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                item.img = res.data;
                elem.parentNode.removeChild(elem);

            };
            document.body.appendChild(elem);
            elem.click()
        },

        editSpkPhoto: async function (item) {
            var elem = document.createElement("input")
            elem.type = "file"
            elem.display = "none"
            elem.onchange = async (e) => {
                var formData = new FormData()
                formData.append("image", elem.files[0]);
                var res = await axios.post('/adminApi/spkImage', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                item.photo = res.data;
                elem.parentNode.removeChild(elem);

            };
            document.body.appendChild(elem);
            elem.click()
        },
        saveContent: async function () {
            if (!confirm("Вы уверены?"))
                return;
            try {
                console.log(this.descr.content)
                var json = JSON.parse(this.descr.content)
                await axios.post("/adminApi/adminContent", {data: this.descr.content});
            } catch (e) {
                return alert("Ошибка формата JSON")
            }


        },
        saveSpeakers: async function () {
            if (!confirm("Вы уверены?"))
                return;
            try {
                var json = JSON.parse(this.descr.speakers)
                await axios.post("/adminApi/adminSpeakers", {data: this.descr.speakers});
            } catch (e) {
                return alert("Ошибка формата JSON")
            }


        },
        saveSite: async function () {
            if (!confirm("Вы уверены?"))
                return;
            try {
                var json = JSON.parse(this.descr.site)
                await axios.post("/adminApi/adminSite", {data: this.descr.site});
            } catch (e) {
                return alert("Ошибка формата JSON")
            }


        },
        updateChat: async function () {
            try {
                var ret = await axios.get("/adminApi/chat");
                var update = true;
                var elems = document.querySelectorAll(".playerChatAnswText");
                elems.forEach(e => {
                    if (document.activeElement == e)
                        update = false;
                })
                if (update)
                    this.chat = ret.data.chat;
                this.q = ret.data.q;

                this.state = ret.data.state;
                ret = await axios.get("/adminApi/tracks");
                if (this.tracks.length == 0)
                    this.tracks = ret.data;
            } catch (e) {
                console.warn(e)
            }
            setTimeout(() => {
                this.updateChat()
            }, 5 * 1000)


        },
        deleteAllQ: async function () {
            if (confirm("Вы уверены?")) {
                await axios.delete("/adminApi/deleteAllQ");
                this.q = [];
            }
        },
        deleteChat: async function (item) {
            if (!confirm("Вы действительно хотите удалить сообщение?"))
                return false
            var res = await axios.delete("/adminApi/chat/" + item.id);
            this.chat = this.chat.filter(c => c.id != item.id);
        },
        deleteQ: async function (item) {
            if (!confirm("Вы действительно хотите удалить сообщение?"))
                return false
            var res = await axios.delete("/adminApi/q/" + item.id);
            this.q = this.q.filter(c => c.id != item.id);
        },
        approveQ: async function (item) {
            var res = await axios.post("/adminApi/approveQ/", {id: item.id, isReady: !item.isReady});
            this.q.forEach(q => {
                if (q.id == res.data.id) {
                    q.isReady = res.data.isReady;
                }
            })

        },
        stateQ: async function (item) {
            var res = await axios.post("/adminApi/stateQ/", {id: item.id, state: item.state});
            this.q.forEach(q => {
                if (q.id == res.data.id) {
                    q.isReady = res.data.isReady;
                }
            })

        },
        spkQ: async function (item) {
            var res = await axios.post("/adminApi/spkQ/", {id: item.id, isSpk: !item.isSpk});
            this.q.forEach(q => {
                if (q.id == res.data.id) {
                    console.log(res.data.isSpk)
                    q.isSpk = res.data.isSpk;
                }
            })
            //    this.q=this.q.filter(()=>{return true})

        },
        addChatAnswer: async function (item) {
            var res = await axios.post("/adminApi/addChatAnswer/", {id: item.id, answer: item.answer});
            this.chat.forEach(q => {
                if (q.id == res.data.id) {
                    q.answer = res.data.answer;
                }
            })
        },
        chatToQ: async function (item) {
            if (!confirm("Вы действительно хотите коприровать сообщение?"))
                return false
            var res = await axios.post("/adminApi/chatToQ/", item);
            this.q.push(res.data);
            alert("Сообщение скопировано")
        }
    },
    watch: {

        sect: async function () {
            this.showLoader = true;
            if (this.sect == 0) {
                var ret = await axios.get("/adminApi/regUser");
                this.users = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 1000)
            }
            if (this.sect == 1) {
                // var ret=await axios.get("/adminApi/chat");
                // this.chat=ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 1000)
            }
            if (this.sect == 2) {
                //  var ret=await axios.get("/adminApi/q");
                // this.q=ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 1000)
            }
            if (this.sect == 3) {
                var ret = await axios.get("/adminApi/content");
                for (var key in ret.data) {
                    if (key != "id")
                        this.descr[key] = JSON.stringify(ret.data[key])
                }

                // {"id":1,"site":null,"content":{},"speakers":null}
                setTimeout(() => {
                    this.showLoader = false;
                }, 1000)
            }
            if (this.sect == 4) {
                var ret = await axios.get("/adminApi/stat");

                this.stat = ret.data;

                var chartData = [];
                ret.data.counts.forEach(c => {
                    chartData.push([c.date, c.count])
                })
                var chart = anychart.area();
                // set the data
                chart.data(chartData/*[
                    ["Chocolate", 5],
                    ["Rhubarb compote", 2],
                    ["Crêpe Suzette", 2],
                    ["American blueberry", 2],
                    ["Buttermilk", 1]
                ]*/);
                // set chart title
                chart.title("Просмотры за 4 часа");
                // set the container element
                chart.container("container");
                // initiate chart display
                var dateScale = anychart.scales.dateTime();
                var dateTicks = dateScale.ticks();
                dateTicks.interval(1);
                var dateMinorTicks = dateScale.minorTicks();
                dateMinorTicks.interval(0, 2);
                chart.xScale(dateScale);

                chart.draw();

                setTimeout(() => {
                    this.showLoader = false;
                }, 1000)
            }
            if (this.sect == 5) {
                var ret = await axios.get("/adminApi/spk");
                this.spk = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
            if (this.sect == 6) {
                var ret = await axios.get("/adminApi/redirect");
                this.redirect = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
            if (this.sect == 7) {
                var ret = await axios.get("/adminApi/codes");
                this.codes = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
            if (this.sect == 8) {
                var ret = await axios.get("/adminApi/votes");
                this.votes = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
            if (this.sect == 9) {
                var ret = await axios.get("/adminApi/tracks");
                this.tracks = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
            if (this.sect == 10) {
                var ret = await axios.get("/adminApi/pgm");
                this.pgm = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
            if (this.sect == 11) {
                var ret = await axios.get("/adminApi/faq");
                this.faq = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
            if (this.sect == 14) {
                var ret = await axios.get("/adminApi/photos");
                this.photos = ret.data;
                setTimeout(() => {
                    this.showLoader = false;
                }, 200)
            }
        }
    },
    mounted: function () {
        this.updateChat();
        setTimeout(() => {
            this.loaded = true;
            this.sect = 2
        }, 0)
        setTimeout(() => {
            document.body.style.opacity = 1;
        }, 500)
    }
})

function isNormalInteger(str) {
    return /^\+?(0|[1-9]\d*)$/.test(str);
}