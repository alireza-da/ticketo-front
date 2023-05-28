<script>
import axios from 'axios';
export default {
    setup() {

    },
    props: {
        system: Object,
        default: null,
        lang: Object,
        selectedLang: String
    },
    async created() {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        this.today = mm + '/' + dd + '/' + yyyy;
        this.token = localStorage.getItem('token')
        await this.fetchUsers()
        await this.fetchRoles()
        await this.fetchPms()
    },
    watch: {
        async system(newVal) {
            this.passedSys = newVal
            await this.fetchUsers()
            await this.fetchRoles()
            await this.fetchTickets()
            await this.fetchClientUserData()
            await this.fetchCategories()
            await this.fetchPms()
        }
    },
    methods: {
        searchTable(tableId, inputId) {
            // Declare variables
            var input, filter, table, tr, td, i, txtValue;
            input = document.getElementById(inputId);
            filter = input.value.toUpperCase();
            table = document.getElementById(tableId);
            tr = table.getElementsByTagName("tr");

            // Loop through all table rows, and hide those who don't match the search query
            for (i = 0; i < tr.length; i++) {
                td = tr[i].getElementsByTagName("td")[0];
                if (td) {
                    txtValue = td.textContent || td.innerText;
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        tr[i].style.display = "";
                    } else {
                        tr[i].style.display = "none";
                    }
                }
            }
        },

        navigateToTicketPage(ticket) {

            this.$emit("navigate-to-ticket-page", ticket)
        },
        async fetchSys() {
            await axios.get(`${this.systemDetailsAPI}${this.passedSys['id']}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.passedSys = res.data
                // await axios.get(`${this.serverMediaAPI}${this.passedSys['banner']}`).then(res => {
                //     this.passedSys.bannerPicFile = res.data
                // })
            })
        },
        async fetchUsers() {
            await axios.get(`${this.usersSystemAPI}${this.passedSys['id']}`, { headers: { "Authorization": `Token ${this.token}` } }).then((resonse) => {
                this.users = resonse.data
                console.log(this.users);
                for (const user of this.users) {
                    this.usersObj[user.id] = user
                }
            })
        },
        async fetchTickets() {
            await axios.get(`${this.ticketsSystemAPI}${this.passedSys['id']}`, { headers: { "Authorization": `Token ${this.token}` } }).then(async (resonse) => {
                this.tickets = resonse.data
                this.tickets.forEach(async element => {
                    if (element['is_closed']) {
                        this.respondedTickets += 1
                    }
                    // fetch cat info + owner info
                    await axios.get(`${this.sysCategoryDetailsAPI}${element.sys_id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async resonse => {
                        element.category = resonse.data
                        element.ticketOwner = await this.findTicketOwner(element.id)
                        if (element.is_closed) {
                            element.status = "Closed"
                        } else element.status = "Open"
                    })
                });
            })
        },
        async fetchCategories() {
            await axios.get(`${this.sysCategoryDetailsAPI}${this.passedSys.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.categories = res.data
            })
        },
        async findTicketOwner(tid) {
            var result
            await axios.get(`${this.findTicketOwnerAPI}${tid}`, { headers: { Authorization: `Token ${this.token}` } }).then(response => {
                result = response.data
            }).catch(error => {
                result = { email: "System" }
            })
            return result
        },
        async fetchRoles() {
            // user roles
            for (const element of this.users) {
                if (element.email === "" && element.discord_id === "" && element.steam_hex === "") {
                    continue
                }
                this.userRoles[element['id']] = await this.findRolesOfAUser(element)
            }
            // all roles including non assigned roles
            await axios.get(`${this.sysRolesDetailsAPI}${this.passedSys['id']}`, { headers: { "Authorization": `Token ${this.token}` } }).then(response => {
                this.roles = response.data
            })

        },
        async fetchPms() {
            await axios.get(`${this.predefinedMessageSystemAPI}${this.passedSys.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.predefinedMessages = res.data
            })
        },
        async fetchClientUserData() {
            this.doneFetchingRoles = false
            await axios.get(`${this.userDataAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.userData = res.data
                var hr = this.findHighestRole(this.userData.id)
                this.clientCreateTicket = hr.create_ticket
                this.clientDeleteMessage = hr.delete_messages
                this.clientDeleteTicket = hr.delete_ticket
                this.clientManageRoles = hr.manage_role
                this.clientManageMembers = hr.manage_members
                this.clientManageSystem = hr.manage_system
                this.clientReadHistory = hr.read_history
                this.clientReadMessage = hr.read_messages
                this.clientUpdateTicket = hr.update_ticket
                this.clientUploadMedia = hr.upload_media
                this.clientWriteMessage = hr.write_messages
                this.doneFetchingRoles = true
            })
        },
        setRolePermissionInputs(role){
            this.roleReadMessage =  role.read_messages
            this.roleWriteMessage =  role.write_messages
            this.roleDeleteMessage =  role.delete_messages
            this.roleReadHistory = role.read_history
            this.roleUploadMedia = role.upload_media
            this.roleDeleteTicket = role.delete_ticket
            this.roleCreateTicket = role.create_ticket
            this.roleUpdateTicket = role.update_ticket
            this.roleManageSystem = role.manage_system
            this.roleManageRoles = role.manage_role
            this.roleManageMembers = role.manage_members
        },
        async changeTicketPrefix() {
            await axios.put(`${this.systemDetailsAPI}${this.passedSys['id']}`, {
                "ticket_prefix": this.ticketPrefix, "name": this.passedSys['name'], "ref_url": this.passedSys['ref_url']
            },
                { headers: { "Authorization": `Token ${this.token}`, "Content-Type": "multipart/form-data" } }).
                then(response => {
                    this.$notify({
                        group: "foo",
                        title: "Success",
                        text: "Ticket prefix has been updated"
                    }, 2000) // 2s
                    this.fetchSys()
                }).catch(error => {
                    this.$notify({
                        group: "error",
                        title: "Error",
                        text: "Action Failed "
                    }, 2000) // 2s
                })
        },
        async changeSysPrivacy() {
            await axios.put(`${this.systemDetailsAPI}${this.passedSys['id']}`, {
                "is_private": !this.passedSys['is_private'], "name": this.passedSys['name'], "ref_url": this.passedSys['ref_url']
            },
                { headers: { "Authorization": `Token ${this.token}`, "Content-Type": "multipart/form-data" } }).
                then(response => {
                    this.$notify({
                        group: "foo",
                        title: "Success",
                        text: `Privacy has been updated to ${this.passedSys['is_private'] ? 'private' : 'public'}`
                    }, 2000) // 2s
                    this.fetchSys()
                }).catch(error => {
                    this.$notify({
                        group: "error",
                        title: "Error",
                        text: "Action Failed "
                    }, 2000) // 2s
                })
        },
        async updateSys() {
            var data = { ref_url: this.passedSys['ref_url'], name: this.passedSys['name'] }

            if (this.sysName !== "") {
                data.name = this.sysName
            }
            if (this.sysBanner !== "") {
                data['banner'] = this.sysBanner
            }
            if (this.sysAbout !== "") {
                data['about_system'] = this.sysAbout
            }
            if (this.sysPfp !== "") {
                data['pfp'] = this.sysPfp
            }
            await axios.put(`${this.systemDetailsAPI}${this.passedSys['id']}`, data, { headers: { Authorization: `Token ${this.token}`, "Content-Type": "multipart/form-data" } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "System has been updated"
                }, 2500) // 2.5s
                await this.fetchSys()
            })

        },

        updateSysPfp(event) {
            this.sysPfp = event.target.files[0]

        },
        updateSysBanner(event) {
            this.sysBanner = event.target.files[0]

        },
        async updateRole(role) {
            if (this.roleName === "") {
                this.roleName = role.name
            }
            if (this.roleColor === "") {
                this.roleColor = role.color
            }
            await axios.put(`${this.rolesDetailsAPI}${role.id}`, {
                sys_id: this.passedSys['id'],
                user_id: null,
                name: this.roleName,
                color: this.roleColor,
                level: this.roleLevel,
                read_messages: this.roleReadMessage,
                write_messages: this.roleWriteMessage,
                delete_messages: this.roleDeleteMessage,
                read_history: this.roleReadHistory,
                upload_media: this.roleUploadMedia,
                delete_ticket: this.roleDeleteTicket,
                create_ticket: this.roleCreateTicket,
                update_ticket: this.roleUpdateTicket,
                manage_system: this.roleManageSystem,
                manage_role: this.roleManageRoles,
                manage_members: this.roleManageMembers
            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "Role has been updated"
                }, 2500) // 2s
                this.fetchRoles()
            }).catch(err => {
                if (err.response.status === 403) {
                    this.$notify({
                        group: "error",
                        title: "Error",
                        text: "Insufficient Privileges"
                    }, 2500) // 2s
                    return
                }
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: "Failed to update role"
                }, 2500) // 2s
            })
            for (const cat of this.categories) {
                const el = document.getElementById(`update${cat.name}-${cat.id}-${role.id}`)
                if (el.checked) {
                    await axios.post(`${this.categoryRoleListAPI}`, {
                        category: cat.id,
                        role: role.id
                    }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                    })
                }
                else {
                    await axios.delete(`${this.categoryRoleDeleteAPI}${cat.id}`, { headers: { Authorization: `Token ${this.token}` } })
                }
            }
            for (const cat of this.categories) {
                const el = document.getElementById(`closed-${cat.name}-${cat.id}-${role.id}`)
                if (el.checked) {
                    await axios.post(`${this.categoryRoleListAPI}`, {
                        category: cat.id,
                        role: role.id,
                        for_closed: true
                    }, { headers: { Authorization: `Token ${this.token}` } })
                }
                else {
                    await axios.delete(`${this.categoryRoleDeleteAPI}${cat.id}`, { headers: { Authorization: `Token ${this.token}` } })
                }
            }
        },
        async findRolesOfAUser(user) {
            var result = []
            if (user.email === "" && user.discord_id === "" && user.steam_hex === "") {
                return []
            }
            await axios.get(`${this.userRolesAPI}${this.passedSys['id']}/${user['id']}`, { headers: { "Authorization": `Token ${this.token}` } }).then(
                response => {
                    result = response.data
                }
            )
            return result
        },
        findHighestRole(uid) {

            var roles = this.userRoles[uid]
            if (roles === undefined) {
                return {}
            }
            var level = 0
            var result = roles[0]
            roles.forEach(element => {
                if (element['level'] > level) {
                    level = element['level']
                    result = element
                }
            })
            return result
        },
        async deleteUser(uid) {
            await axios.delete(`${this.userDetailsAPI}${uid}`, { headers: { 'Authorization': `Token ${this.token}` } }).then(async respone => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "User has been deleted"
                }, 2000) // 2s
                await this.fetchUsers()
            })

        },
        async deleteTicket(tid) {
            await axios.delete(`${this.ticketDetailsAPI}${tid}`, { headers: { Authorization: `Token ${this.token}` } }).then(async response => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "Ticket has been deleted"
                }, 2000) // 2s
                await this.fetchTickets()
            })
        },
        async deleteRole(rid) {
            await axios.delete(`${this.rolesDetailsDeleteAPI}${this.passedSys['id']}/${rid}`, { headers: { Authorization: `Token ${this.token}` } }).then(response => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "Role has been deleted"
                }, 2500)
            }).catch(error => {
                if (error.response.status === 403) {
                    this.$notify({
                        group: "error",
                        title: "Error",
                        text: "Insufficient Permissions"
                    }, 2500)
                }
            })
            this.fetchRoles()
        },
        async deleteSystem() {
            var hr = this.findHighestRole(this.userData.id)
            if (!hr.owner) {
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: `Insufficient Privileges: Only owner of the system can delete it.`
                }, 2500)
                return
            }
            await axios.delete(`${this.systemDetailsAPI}${this.passedSys['id']}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `System has been deleted`
                }, 2500)
                this.$emit("back-to-systems")
            })
        },
        async deleteCategory(cid) {
            await axios.delete(`${this.sysCategoryDetailsAPI}${cid}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "Category has been deleted"
                }, 2000) // 2s
                await this.fetchCategories()
            })
        },
        async removeUserFromSys(uid) {
            await axios.delete(`${this.removeUserFromSysAPI}${this.passedSys['id']}/${uid}`, { headers: { 'Authorization': `Token ${this.token}` } }).then(async respone => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: "User has been deleted"
                }, 2000) // 2s
                await this.fetchUsers()
            })

        },
        findNotAssignedRoles() {
            return this.roles.filter(x => !x.user_id);
        },
        async addRoleToUser(uid, role) {
            console.log(uid, role);
            var tempRole = role
            tempRole.parent = role.id
            tempRole.user_id = uid
            await axios.post(`${this.createRoleAPI}`, tempRole, { headers: { Authorization: `Token ${this.token}`, "Content-Type": "application/json" } }).then(response => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Role ${role.name} has been given`
                }, 2000)
                this.fetchRoles()
            }).catch(error => {

                if (error.response.status === 403) {
                    this.$notify({
                        group: "error",
                        title: "Error",
                        text: `Role ${role.name} has already given`
                    }, 2000)
                }
            })
        },
        async removeRoleFromUser(uid, rid) {
            axios.delete(`${this.rolesDetailsDeleteAPI}${this.passedSys['id']}/${uid}/${rid}`, { headers: { Authorization: `Token ${this.token}` } }).then(async response => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Role has been removed`
                }, 2000)
                await this.fetchRoles()
            })
        },
        async createRole() {
            var hr = this.findHighestRole(this.userData.id)
            if (!hr.manage_role) {
                this.$notify({
                    group: "foo",
                    title: "Error",
                    text: `Insufficient Privileges`
                }, 2000)
                return
            }
            let roleId = 0
            await axios.post(`${this.createRoleAPI}`, {
                sys_id: this.passedSys['id'],
                name: this.roleName,
                color: this.roleColor,
                level: this.roleLevel,
                read_messages: this.roleReadMessage,
                write_messages: this.roleWriteMessage,
                delete_messages: this.roleDeleteMessage,
                read_history: this.roleReadHistory,
                upload_media: this.roleUploadMedia,
                delete_ticket: this.roleDeleteTicket,
                create_ticket: this.roleCreateTicket,
                update_ticket: this.roleUpdateTicket,
                manage_system: this.roleManageSystem,
                manage_role: this.roleManageRoles,
                manage_members: this.roleManageMembers
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                roleId = res.data.id
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Role has been added`
                }, 2000)
                await this.fetchRoles()
            })
            if (roleId !== 0) {
                for (const cat of this.categories) {
                    let el = document.getElementById(`${cat.name}-${cat.id}`)
                    if (el.checked) {
                        await axios.post(`${this.categoryRoleListAPI}`, {
                            category: cat.id,
                            role: roleId
                        }, { headers: { Authorization: `Token ${this.token}` } })
                    }
                    else {
                        await axios.delete(`${this.categoryRoleDeleteAPI}${cat.id}`, { headers: { Authorization: `Token ${this.token}` } })
                    }
                }
                for (const cat of this.categories) {
                    let el = document.getElementById(`closed-${cat.name}-${cat.id}`)
                    if (el.checked) {
                        await axios.post(`${this.categoryRoleListAPI}`, {
                            category: cat.id,
                            role: roleId,
                            for_closed: true
                        }, { headers: { Authorization: `Token ${this.token}` } })
                    }
                    else {
                        await axios.delete(`${this.categoryRoleDeleteAPI}${cat.id}`, { headers: { Authorization: `Token ${this.token}` } })
                    }
                }
            }
        },
        async createCategory() {
            var keys = this.customFields.split(',')
            var customFieldsObj = {}
            for (const key of keys) {
                customFieldsObj[key.replace(/\s/g, '')] = 'text'
            }
            await axios.post(`${this.categryListAPI}`, {
                "name": this.catName,
                "color": this.catColor,
                "sys_id": this.passedSys.id,
                'custom_fields': JSON.stringify(customFieldsObj)
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Category has been added`
                }, 2000)
                await this.sendCatMessage(res.data)
                await this.fetchCategories()
            })

        },
        async updateCategory(c) {
            var customFieldsObj = JSON.parse(c.custom_fields)

            if (this.catName === "") {
                this.catName = c.name
            }
            if (this.catColor === "") {
                this.catColor = c.color
            }
            if (this.customFields !== "") {
                var keys = this.customFields.split(',')
                for (const key of keys) {
                    if (key !== '{}')
                        customFieldsObj[key.replace(/\s/g, '')] = 'text'
                }
            }
            await axios.put(`${this.categoryDetailsAPI}${c.id}`, {
                "name": this.catName,
                "color": this.catColor,
                "sys_id": this.passedSys.id,
                'custom_fields': JSON.stringify(customFieldsObj)
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Category has been updated`
                }, 2000)
                await this.updateCatMessage(res.data)
                await this.fetchCategories()
                // this.$emit('perform-reload-sys', this.passedSys)
            }).catch(async res => {
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: `Unable to make action`
                }, 2000)
                console.error(res);
                await this.fetchCategories()
            })

        },
        async addPm() {
            await axios.post(`${this.predefinedMessageListAPI}`, {
                title: this.pmTitle,
                content: this.pmContent,
                sys: this.passedSys.id
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Message has been added`
                }, 2000)
                await this.fetchPms()
            })
        },
        async deletePm(pid) {
            await axios.delete(`${this.predefinedMessageDetailsAPI}${pid}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Message has been deleted`
                }, 2000)
                await this.fetchPms()
            })
        },
        async editPm(pm) {
            if (this.pmTitle === '') {
                this.pmTitle = pm.title
            }
            if (this.pmContent === '') {
                this.pmContent = pm.content
            }
            await axios.put(`${this.predefinedMessageDetailsAPI}${pm.id}`, {
                sys: this.passedSys.id,
                title: this.pmTitle,
                content: this.pmContent
            }, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `Message has been updated`
                }, 2000)
                await this.fetchPms()
            })
            this.pmTitle = ''
            this.pmContent = ''
        },
        formatDate(date) {
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var date = new Date(date)
            return date.toLocaleString("en-US", options)
        },
        clearCustomFields(c) {
            this.customFields = '{}'
            c.custom_fields = '{}'
        },
        async stopAudioRecording() {
            this.mediaRecorder.stop();
        },
        async startAudioRecording(cat) {
            var mediaRecorder;
            if (this.recordingState === 0) {
                this.recordingState++
                let audioIN = { audio: true };
                //  audio is true, for recording

                // Access the permission for use
                // the microphone

                navigator.mediaDevices.getUserMedia(audioIN)
                    .then((mediaStreamObj) => {
                        // Connect the media stream to the
                        // first audio element
                        let audio = document.querySelector('audio');
                        let playAudio = document.querySelector('audio');
                        playAudio.pause()
                        //returns the recorded audio via 'audio' tag

                        // 'srcObject' is a property which
                        // takes the media object
                        // This is supported in the newer browsers
                        if ("srcObject" in audio) {
                            audio.srcObject = mediaStreamObj;
                        }
                        else {   // Old version
                            audio.src = window.URL
                                .createObjectURL(mediaStreamObj);
                        }

                        // It will play the audio
                        // audio.onloadedmetadata = function (ev) {

                        //     // Play the audio in the 2nd audio
                        //     // element what is being recorded
                        //     audio.play();
                        // };

                        // This is the main thing to recorded
                        // the audio 'MediaRecorder' API
                        mediaRecorder = new MediaRecorder(mediaStreamObj);
                        // Pass the audio stream
                        // Start event
                        mediaRecorder.start();

                        // If audio data available then push
                        // it to the chunk array
                        mediaRecorder.ondataavailable = function (ev) {
                            dataArray.push(ev.data);
                        }

                        // Chunk array to store the audio data
                        let dataArray = [];

                        // Convert the audio data in to blob
                        // after stopping the recording
                        mediaRecorder.onstop = async (ev) => {

                            // blob of type mp3
                            let audioData = new Blob(dataArray,
                                { 'type': 'audio/mp3;' });

                            // After fill up the chunk
                            // array make it empty
                            dataArray = [];

                            // Creating audio url with reference
                            // of created blob named 'audioData'
                            let audioSrc = window.URL
                                .createObjectURL(audioData);

                            this.audioData = audioData
                            var file = new File([this.audioData], "sample.mp3");
                            this.msgAttachment = file

                            // Pass the audio url to the 2nd video tag
                            playAudio.src = audioSrc;
                        }
                        console.log(mediaRecorder);
                        this.mediaRecorder = mediaRecorder
                    })

                    // If any error occurs then handles the error
                    .catch(function (err) {
                        console.log(err.name, err.message);
                    });

            }
            else if (this.recordingState === 1) {
                await this.stopAudioRecording()
                this.recordingState = 0
                // this.recordingState++
            }
        },
        async sendCatMessage(cat) {
            this.recordingState === 0
            // post message
            await axios.post(`${this.createMessageAPI}`, {
                content: this.sendingMessage,
                cat_id: cat.id,

            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {

                this.sendingMessage = res.data

            })
            // post attachment
            if (this.msgAttachment) {
                await axios.post(`${this.attachmentListAPI}`, {
                    "message_id": this.sendingMessage.id,
                    "media": this.msgAttachment,
                    "type": this.findFileType(this.msgAttachment)
                }, {
                    headers: {
                        Authorization: `Token ${this.token}`,
                        "Content-Type": 'multipart/form-data'
                    }
                }).then(res => {

                })
            }
            // await this.fetchMessage()
            // this.sendingMessage = null
            this.msgAttachment = null


        },
        async updateCatMessage(cat) {
            this.recordingState === 0
            let defMsg = null
            // post message
            await axios.get(`${this.defaultMessageCategoryAPI}${cat.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                defMsg = res.data
                await axios.put(`${this.messageDetailsAPI}${defMsg.id}`, {
                    content: this.sendingMessage
                }, { headers: { Authorization: `Token ${this.token}` } })
                // post attachment
                if (this.msgAttachment) {
                    await axios.post(`${this.attachmentListAPI}`, {
                        "message_id": defMsg.id,
                        "media": this.msgAttachment,
                        "type": this.findFileType(this.msgAttachment)
                    }, {
                        headers: {
                            Authorization: `Token ${this.token}`,
                            "Content-Type": 'multipart/form-data'
                        }
                    }).then(res => {

                    })
                }
                // await this.fetchMessage()
                // this.sendingMessage = null
                this.msgAttachment = null
            }).catch(err => {
                if (err.response.status === 404) {
                    this.sendCatMessage(cat)
                }
            })
            this.sendingMessage = ''
        },
        findFileType(file) {
            var ext = file.name.split('.').pop();
            ext = ext.toLowerCase()
            if (ext === 'jpg' || ext === 'png') {
                return 'picture'
            }
            if (ext === 'mp4' || ext === 'mkv' || ext === 'webm' || ext === 'mov' || ext === 'wmv' || ext === 'flv' || ext === 'avi' || ext === 'gif') {
                return 'video'
            }
            if (ext === 'mp3' || ext === 'wma' || ext === 'm4a') {
                return 'audio'
            }
            return 'other'
        },
        async getDefMsg(cat) {
            let result = null
            await axios.get(`${this.defaultMessageCategoryAPI}${cat.id}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                result = res.data.content
            })
            return result
        }
    },
    data() {
        return {
            selectedUser: null,
            selectedTicket: null,
            selectedRole: null,
            passedSys: {},
            token: "",
            today: null,
            predefinedMessages: [],
            sendingMessage: "",
            // voice message 
            mediaRecorder: null,
            recordingState: 0,
            audioData: null,
            // default message
            msgAttachment: null,
            // APIs //
            createMessageAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/list/', // tid
            messageDetailsAPI: 'https://ticket-backend.iran.liara.run/api/messages/details/', // int pk
            attachmentListAPI: 'https://ticket-backend.iran.liara.run/api/tickets/messages/details/attachment/list/',
            usersSystemAPI: 'https://ticket-backend.iran.liara.run/api/systems/details/users/',
            ticketsSystemAPI: 'https://ticket-backend.iran.liara.run/api/systems/details/tickets/',
            userRolesAPI: 'https://ticket-backend.iran.liara.run/api/roles/details/', // <int:sysid>/<int:uid>,
            userDetailsAPI: 'https://ticket-backend.iran.liara.run/api/users/details/',// <int:pk>
            removeUserFromSysAPI: 'https://ticket-backend.iran.liara.run/api/roles/details/deleteallroles/', // <int:sys_id>/uid
            sysRolesDetailsAPI: 'https://ticket-backend.iran.liara.run/api/roles/details/system/', // <int:sys_id>
            rolesDetailsAPI: 'https://ticket-backend.iran.liara.run/api/roles/details/', // <int:pk>
            rolesDetailsDeleteAPI: 'https://ticket-backend.iran.liara.run/api/roles/details/delete/', // <int:sys_id>/uid/rid
            createRoleAPI: 'https://ticket-backend.iran.liara.run/api/roles/list/',
            sysCategoryDetailsAPI: 'https://ticket-backend.iran.liara.run/api/system/categories/details/', // sid
            categoryDetailsAPI: 'https://ticket-backend.iran.liara.run/api/categories/details/',  // cid
            categryListAPI: 'https://ticket-backend.iran.liara.run/api/system/categories/list/', // cid
            findTicketOwnerAPI: 'https://ticket-backend.iran.liara.run/api/tickets/roles/ticketowner/', // tid
            ticketTicketRolesAPI: 'https://ticket-backend.iran.liara.run/api/tickets/roles/details/', // tid
            ticketDetailsAPI: 'https://ticket-backend.iran.liara.run/api/tickets/details/', // tid
            systemDetailsAPI: 'https://ticket-backend.iran.liara.run/api/systems/details/', // pk
            systemListAPI: 'https://ticket-backend.iran.liara.run/api/systems/list/', // pk
            userDataAPI: 'https://ticket-backend.iran.liara.run/api/users/details/ata/',
            serverMediaAPI: 'https://ticket-backend.iran.liara.run', //path
            categoryRoleListAPI: 'https://ticket-backend.iran.liara.run/api/category/role/list/',
            categoryRoleDetailsAPI: 'https://ticket-backend.iran.liara.run/api/category/role/details/', // int pk
            categoryRoleDeleteAPI: 'https://ticket-backend.iran.liara.run/api/category/role/delete/', // int catid
            predefinedMessageListAPI: 'https://ticket-backend.iran.liara.run/api/predefinedmsg/list/',
            predefinedMessageDetailsAPI: 'https://ticket-backend.iran.liara.run/api/predefinedmsg/details/', // int pk
            predefinedMessageSystemAPI: 'https://ticket-backend.iran.liara.run/api/system/predefinedmsg/', // sysid
            defaultMessageCategoryAPI: 'https://ticket-backend.iran.liara.run/api/categories/defaultmessage/', //cid
            //////////
            userData: null,
            users: [],
            usersObj: {},
            roles: [],
            userRoles: {},
            tickets: [],
            categories: [],
            respondedTickets: 0,
            ticketPrefix: "",
            notifMessage: "Success",
            showNotif: false,
            // roles details vars
            roleName: "",
            roleColor: "#FFFFFF",
            roleLevel: 0,
            roleReadMessage: false,
            roleWriteMessage: false,
            roleDeleteMessage: false,
            roleReadHistory: false,
            roleUploadMedia: false,
            roleDeleteTicket: false,
            roleCreateTicket: false,
            roleUpdateTicket: false,
            roleManageSystem: false,
            roleManageRoles: false,
            roleManageMembers: false,
            // permission view
            clientReadMessage: false,
            clientWriteMessage: false,
            clientDeleteMessage: false,
            clientReadHistory: false,
            clientUploadMedia: false,
            clientDeleteTicket: false,
            clientCreateTicket: false,
            clientUpdateTicket: false,
            clientManageSystem: false,
            clientManageRoles: false,
            clientManageMembers: false,
            // system details models
            sysName: "",
            sysAbout: "",
            sysBanner: "",
            sysPfp: "",
            // category details models
            catName: "",
            catColor: "",
            customFields: "",
            // predefined message
            pmTitle: "",
            pmContent: "",
            // loading states
            doneFetchingRoles: false
        }
    }


}


</script>


<template>
    <div class="w-full h-full p-3 flex-col overflow-auto">
        <div class="card w-full bg-base-100 shadow-xl mb-4">
            <figure><img :src="`${serverMediaAPI}${passedSys['banner']}`" alt="System Banner" class="w-full h-20" v-if="passedSys['banner']"
                    style="object-fit: none;" /></figure>
            <div class="card-body">
                <h2 class="card-title">
                    <div class="avatar">
                        <div class="w-14 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                            <img :src="`${serverMediaAPI}${passedSys['pfp']}`" v-if="passedSys['pfp']"/>
                            <img src="../../assets/360_F_510888200_EentlrpDCeyf2L5FZEeSfgYaeiZ80qAU.jpg" v-else/>
                        </div>
                    </div>
                    {{ passedSys['name'] }}
                    <div class="badge badge-secondary"> {{ lang[selectedLang].verified }}</div>
                </h2>
                <p>{{ passedSys['about_system'] }}</p>
                <p>Referral Link <a class="link link-success"
                        :href="`https://ticket.sunrp.ir/referral/${passedSys.ref_url}`">https://ticket.sunrp.ir/referral/{{
                            passedSys.ref_url }}</a><i class='bx bx-clipboard ml-2'></i></p>
                <div class="card-actions justify-end">
                    <div class="badge badge-outline"> {{ lang[selectedLang].support }}</div>
                    <div class="badge badge-outline"> {{ lang[selectedLang].games }}</div>
                </div>
            </div>
        </div>
        <div class="flex flex-col w-full border-opacity-50 h-full">
            <div class="stats shadow">

                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                            class="stroke-current" style="fill: currentColor;transform: ;msFilter:;">
                            <path
                                d="M8 12.052c1.995 0 3.5-1.505 3.5-3.5s-1.505-3.5-3.5-3.5-3.5 1.505-3.5 3.5 1.505 3.5 3.5 3.5zM9 13H7c-2.757 0-5 2.243-5 5v1h12v-1c0-2.757-2.243-5-5-5zm11.294-4.708-4.3 4.292-1.292-1.292-1.414 1.414 2.706 2.704 5.712-5.702z">
                            </path>
                        </svg>
                    </div>
                    <div class="stat-title">{{ lang[selectedLang].users }}</div>
                    <div class="stat-value">{{ users.length }}</div>
                    <div class="stat-desc">{{ passedSys['created_at'] }} - {{ this.today }}</div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                            class="stroke-current" style="fill: currentColor;transform: ;msFilter:;">
                            <path
                                d="M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm0 2v.511l-8 6.223-8-6.222V6h16zM4 18V9.044l7.386 5.745a.994.994 0 0 0 1.228 0L20 9.044 20.002 18H4z">
                            </path>
                        </svg>
                    </div>
                    <div class="stat-title"> {{ lang[selectedLang].tickets }}</div>
                    <div class="stat-value">{{ tickets.length }}</div>
                    <div class="stat-desc">↗︎ 400 (22%)</div>
                </div>

                <div class="stat">
                    <div class="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                            style="fill: currentColor;transform: ;msFilter:; stroke: currentColor">
                            <path d="m10.933 13.519-2.226-2.226-1.414 1.414 3.774 3.774 5.702-6.84-1.538-1.282z"></path>
                            <path
                                d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM5 19V5h14l.002 14H5z">
                            </path>
                        </svg>
                    </div>
                    <div class="stat-title"> {{ lang[selectedLang].responsedtickets }}</div>
                    <div class="stat-value">{{ respondedTickets }}</div>
                    <div class="stat-desc">↘︎ 90 (14%)</div>
                </div>

            </div>
            <progress class="progress w-full progress-accent mt-2" v-if="!doneFetchingRoles"></progress>
            <div class="divider" v-if="clientManageMembers"><i class='bx bx-group'></i>Users</div>
            <div class="grid h-20 card bg-base-300 rounded-box place-items-center" v-if="clientManageMembers && doneFetchingRoles">
                <div class="btn-group inline-block">
                    <label class="btn" for="user-manage-modal"><i class='bx bxs-cog mr-2'></i>
                        {{ lang[selectedLang].managepannel }}</label>
                    <!-- user manage modal -->
                    <input type="checkbox" id="user-manage-modal" class="modal-toggle" />
                    <div class="modal modal-bottom lg:modal-middle w-full">
                        <div class="modal-box w-11/12 max-w-7xl">
                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].systemuserpannel }}</h3>

                            <div class="modal-action justify-start mb-2">
                                <!-- <label for="user-manage-modal"
                                                                                                                                                class="btn bg-primary text-white hover:(bg-accent)">search</label> -->
                                <input type="text" placeholder="Search" class="input input-ghost w-full max-w-xs"
                                    id="usersSearchInput" @keyup="searchTable('usersTable', 'usersSearchInput')" />
                                <button class="btn btn-square">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                            <div class="overflow-auto w-full">
                                <table class="table w-full" id="usersTable">
                                    <!-- head -->
                                    <thead>
                                        <tr>
                                            <th>
                                                <label>
                                                    <input type="checkbox" class="checkbox" />
                                                </label>
                                            </th>
                                            <th> {{ lang[selectedLang].name }}</th>
                                            <th> {{ lang[selectedLang].role }}</th>
                                            <th> {{ lang[selectedLang].email }}</th>
                                            <th> {{ lang[selectedLang].steamhex }}</th>
                                            <th> {{ lang[selectedLang].discordid }}</th>
                                            <th> {{ lang[selectedLang].actions }}</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- row 1 -->
                                        <tr v-for="user in users" v-bind:key="user.id">
                                            <th>
                                                <label>
                                                    <input type="checkbox" class="checkbox" />
                                                </label>
                                            </th>
                                            <td>
                                                <div class="flex items-center space-x-3">
                                                    <div class="avatar">
                                                        <div class="mask mask-squircle w-12 h-12">
                                                            <img :src="`https://ticket-backend.iran.liara.run${user.pfp}`" v-if="user.pfp"
                                                                alt="Avatar" />
                                                            <img src="../../assets/3f9470b34a8e3f526dbdb022f9f19cf7.jpg" v-else alt="Avatar" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div class="font-bold">{{ user.name }}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="">


                                                <span class="badge badge-ghost badge-sm">{{ findHighestRole(user.id).name }}
                                                    - {{ findHighestRole(user.id).level }}</span>
                                            </td>
                                            <td>{{ user.email }}</td>
                                            <td>{{ user.steam_hex }}</td>
                                            <td>{{ user.discord_id }}</td>
                                            <th>
                                                <label class="btn btn-ghost btn-xs bg-error"
                                                    :for="`delete-user-modal${user.id}`"><i class='bx bx-user-x mr-2'></i>
                                                    {{ lang[selectedLang].remove }}</label>
                                                <input type="checkbox" :id="`delete-user-modal${user.id}`"
                                                    class="modal-toggle" />
                                                <div class="modal">
                                                    <div class="modal-box w-11/12 max-w-5xl">
                                                        <h3 class="font-bold text-lg"> {{ lang[selectedLang].warning }}!
                                                        </h3>
                                                        <p class="py-4">You're about to delete a user! This action
                                                            cannot be undone. Do it on your
                                                            own risk.</p>
                                                        <div class="modal-action">
                                                            <label :for="`delete-user-modal${user.id}`"
                                                                class="btn bg-error text-black hover:(bg-accent)"
                                                                @click="removeUserFromSys(user.id)">Delete</label>
                                                            <label :for="`delete-user-modal${user.id}`"
                                                                class="btn bg-primary text-white hover:(bg-accent)">
                                                                {{ lang[selectedLang].close }}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <label class="btn btn-ghost btn-xs bg-primary"
                                                    :for="`roles-user-modal${user.id}`"><i class='bx bxs-mask mr-2'></i>
                                                    {{ lang[selectedLang].roles }}</label>
                                                <input type="checkbox" :id="`roles-user-modal${user.id}`"
                                                    class="modal-toggle" />
                                                <div class="modal">
                                                    <div class="modal-box w-11/12 max-w-5xl">
                                                        <h3 class="font-bold text-lg"> {{ lang[selectedLang].userroles }}
                                                        </h3>
                                                        <div class="badge badge-info gap-2"
                                                            v-for="role in userRoles[user.id]" v-bind:key="role.id"
                                                            :style="{ 'background-color': role.color }"
                                                            @click="removeRoleFromUser(user.id, role.id)">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                                viewBox="0 0 24 24"
                                                                class="inline-block w-4 h-4 stroke-current">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                            </svg>
                                                            {{ role.name }} - {{ role.level }}
                                                        </div>

                                                        <div class="dropdown dropdown-right m-5">
                                                            <label tabindex="0"
                                                                class="btn btn-circle btn-ghost text-info w-10 h-10">
                                                                <i class='bx bx-plus-circle'></i>
                                                            </label>
                                                            <div tabindex="0"
                                                                class="card compact dropdown-content shadow rounded-box w-64 bg-black p-5 m-2 overflow-y-scroll">
                                                                <button class="badge  gap-2 hover:(bg-primary) m-2"
                                                                    @click="addRoleToUser(user.id, role)"
                                                                    v-for="role in findNotAssignedRoles(user.id)"
                                                                    v-bind:key="role.id"
                                                                    :style="{ 'background-color': role.color }">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        class="inline-block w-4 h-4 stroke-current">
                                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                                            stroke-width="2" d="M6 18L18 6M6 6l12 12">
                                                                        </path>
                                                                    </svg>
                                                                    {{ role.name }} - {{ role.level }}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div class="modal-action">
                                                            <label :for="`roles-user-modal${user.id}`"
                                                                class="btn bg-primary text-white hover:(bg-accent)">
                                                                {{ lang[selectedLang].done }}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </th>
                                        </tr>
                                    </tbody>


                                </table>
                            </div>
                            <div class="modal-action">
                                <label for="user-manage-modal" class="btn bg-success text-black hover:(text-white)">
                                    {{ lang[selectedLang].savechange }}
                                    <i class='bx bxs-save ml-2'></i></label>
                                <label for="user-manage-modal" class="btn bg-error text-black hover:(text-white)">
                                    {{ lang[selectedLang].close }}
                                    <i class='bx bx-x ml-2'></i></label>
                            </div>
                        </div>
                    </div>
                    <label class="btn" for="sys-logs-modal"><i class='bx bxl-blogger mr-2'></i>Logs</label>
                    <input type="checkbox" id="sys-logs-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].systemlogs }}</h3>
                            <p class="py-4">Coming soon...</p>
                            <div class="modal-action">
                                <label for="sys-logs-modal" class="btn bg-red text-black hover:(bg-error)">{{ lang[selectedLang].close }}</label>
                            </div>
                        </div>
                    </div>
                    <!--end of modal-->
                </div>
            </div>
            <div class="divider" v-if="clientManageSystem || clientUpdateTicket"><i class='bx bxs-envelope'></i>
                {{ lang[selectedLang].tickets }}</div>
            <div class="grid h-20 card bg-base-300 rounded-box place-items-center"
                v-if="clientManageSystem || clientUpdateTicket">
                <div class="btn-group inline-block">
                    <label class="btn" for="ticket-manage-modal"><i class='bx bxs-cog mr-2'></i>
                        {{ lang[selectedLang].manage }}</label>
                    <input type="checkbox" id="ticket-manage-modal" class="modal-toggle" />
                    <div class="modal modal-bottom lg:modal-middle w-full">
                        <div class="modal-box w-11/12 max-w-7xl">
                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].ticketpannel }}</h3>

                            <div class="modal-action justify-start mb-2">
                                <!-- <label for="user-manage-modal"
                                                                                                                                                class="btn bg-primary text-white hover:(bg-accent)">search</label> -->
                                <input type="text" placeholder="Search" class="input input-ghost w-full max-w-xs"
                                    id="ticketsSearchInput" @keyup="searchTable('ticketsTable', 'ticketsSearchInput')" />
                            </div>
                            <div class="overflow-auto w-full">
                                <table class="table w-full" id="ticketsTable">
                                    <!-- head -->
                                    <thead>
                                        <tr>
                                            <th>
                                                <label>
                                                    <input type="checkbox" class="checkbox" />
                                                </label>
                                            </th>
                                            <th> {{ lang[selectedLang].category }}</th>
                                            <th> {{ lang[selectedLang].name }}</th>
                                            <th>C {{ lang[selectedLang].createdby }}<i class='bx bxs-user m-1'></i></th>
                                            <th> {{ lang[selectedLang].createdat }}</th>
                                            <th> {{ lang[selectedLang].status }}</th>
                                            <th> {{ lang[selectedLang].actions }}</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- row 1 -->
                                        <tr v-for="ticket in tickets" v-bind:key="ticket.id">
                                            <th>
                                                <label>
                                                    <input type="checkbox" class="checkbox" />
                                                </label>
                                            </th>
                                            <td>
                                                <div class="flex items-center space-x-3">
                                                    <div>
                                                        <div class="font-bold"
                                                            :style="{ 'color': ticket.category[0].color }">
                                                            {{ ticket.category[0].name }}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {{ ticket.name }}
                                            </td>
                                            <td>{{ ticket.ticketOwner.email }}</td>
                                            <td>{{ formatDate(ticket.created_at) }}</td>
                                            <td>{{ ticket.status }}</td>
                                            <th>
                                                <label class="btn btn-ghost btn-xs bg-error"
                                                    :for="`delete-ticket-modal${ticket.id}`"><i
                                                        class='bx bx-user-x mr-2'></i> {{ lang[selectedLang].remove
                                                        }}</label>
                                                <input type="checkbox" :id="`delete-ticket-modal${ticket.id}`"
                                                    class="modal-toggle" />
                                                <div class="modal">
                                                    <div class="modal-box w-11/12 max-w-5xl">
                                                        <h3 class="font-bold text-lg"> {{ lang[selectedLang].warning }}!
                                                        </h3>
                                                        <p class="py-4">You're about to delete a Ticket! This action
                                                            cannot be undone. Do it on your
                                                            own risk.</p>
                                                        <div class="modal-action">
                                                            <label :for="`delete-ticket-modal${ticket.id}`"
                                                                @click="deleteTicket(ticket.id)"
                                                                class="btn bg-error text-black hover:(bg-accent)">
                                                                {{ lang[selectedLang].Delete }}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button class="btn btn-ghost btn-xs bg-primary"
                                                    @click="navigateToTicketPage(ticket)"><i
                                                        class='bx bx-window-open mr-2'></i>{{ lang[selectedLang].view
                                                        }}</button>

                                            </th>
                                        </tr>
                                    </tbody>

                                </table>
                            </div>
                            <div class="modal-action">
                                <label for="ticket-manage-modal" class="btn bg-success text-black hover:(text-white)">
                                    {{ lang[selectedLang].save }}
                                    {{ lang[selectedLang].change }}<i class='bx bxs-save ml-2'></i></label>
                                <label for="ticket-manage-modal" class="btn bg-error text-black hover:(text-white)">
                                    {{ lang[selectedLang].close }}<i class='bx bx-x ml-2'></i></label>
                            </div>
                        </div>
                    </div>
                    <label class="btn" for="ticket-prefix-modal"><i class='bx bxs-cog mr-2'></i>{{
                        lang[selectedLang].changeticketprefix }}</label>
                    <!-- The button to open modal -->
                    <!-- Put this part before </body> tag -->
                    <input type="checkbox" id="ticket-prefix-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg">{{ lang[selectedLang].changeticketprefix }}</h3>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Ticket Prefix</span>
                                </label>
                                <label class="input-group">
                                    <span>Prefix</span>
                                    <input type="text" :placeholder="passedSys['ticket_prefix']" v-model="ticketPrefix"
                                        class="input input-bordered" />
                                </label>
                            </div>
                            <div class="modal-action">
                                <label for="ticket-prefix-modal" class="btn bg-success text-black hover:(text-white)"
                                    @click="changeTicketPrefix()"> {{ lang[selectedLang].save }}
                                    {{ lang[selectedLang].change }}<i class='bx bxs-save ml-2'></i></label>
                                <label for="ticket-prefix-modal" class="btn bg-error text-black hover:(text-white)">
                                    {{ lang[selectedLang].cancel }}<i class='bx bxs-save ml-2'></i></label>
                            </div>
                        </div>
                    </div>

                    <label class="btn" for="categories-modal"><i class='bx bxs-cog mr-2'></i>
                        {{ lang[selectedLang].categories }}</label>
                    <!-- The button to open modal -->
                    <!-- Put this part before </body> tag -->
                    <input type="checkbox" id="categories-modal" class="modal-toggle" />
                    <div class="modal ">
                        <div class="modal-box w-11/12 max-w-5xl h-full">
                            <h3 class="font-bold text-lg mb-3"> {{ lang[selectedLang].categories }}</h3>
                            <table class="table w-full" id="ticketsTable">
                                <!-- head -->
                                <thead>
                                    <tr>
                                        <th> {{ lang[selectedLang].name }}</th>
                                        <th> {{ lang[selectedLang].color }}</th>
                                        <th> {{ lang[selectedLang].actions }}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- row 1 -->
                                    <tr v-for="cat in categories" v-bind:key="cat.id">
                                        <td>
                                            {{ cat.name }}
                                        </td>
                                        <td :style="{ 'color': cat.color }"><i class='bx bxs-circle'></i></td>
                                        <th>
                                            <label class="btn btn-ghost btn-xs bg-error"
                                                :for="`delete-category-modal${cat.id}`"><i class='bx bx-user-x mr-2'></i>
                                                {{ lang[selectedLang].remove }}</label>
                                            <input type="checkbox" :id="`delete-category-modal${cat.id}`"
                                                class="modal-toggle" />
                                            <div class="modal">
                                                <div class="modal-box w-11/12 max-w-5xl">
                                                    <h3 class="font-bold text-lg">Warning!</h3>
                                                    <p class="py-4">You're about to delete a category! This action
                                                        cannot be undone. Do it on your
                                                        own risk.</p>
                                                    <div class="modal-action">
                                                        <label :for="`delete-category-modal${cat.id}`"
                                                            @click="deleteCategory(cat.id)"
                                                            class="btn bg-error text-black hover:(bg-accent)">
                                                            {{ lang[selectedLang].Delete }}</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <label class="btn btn-ghost btn-xs bg-primary"
                                                :for="`edit-category-modal${cat.id}`"><i class='bx bx-window-open mr-2'></i>
                                                {{ lang[selectedLang].edit }}</label>
                                            <input type="checkbox" :id="`edit-category-modal${cat.id}`"
                                                class="modal-toggle" />
                                            <div class="modal">
                                                <div class="modal-box w-11/12 max-w-5xl">
                                                    <h3 class="font-bold text-lg"> {{ lang[selectedLang].createcategory }}
                                                    </h3>
                                                    <div class="form-control">
                                                        <label class="label">
                                                            <span class="label-text"> {{ lang[selectedLang].name }}</span>
                                                        </label>
                                                        <label class="input-group">
                                                            <span>Name</span>
                                                            <input type="text" :placeholder="cat.name" v-model="catName"
                                                                class="input input-bordered" />
                                                        </label>
                                                        <label class="label">
                                                            <span class="label-text"> {{ lang[selectedLang].color }}</span>
                                                        </label>
                                                        <label class="input-group">
                                                            <span><i class='bx bxs-palette'></i></span>
                                                            <input type="color" v-model="catColor" :placeholder="cat.color"
                                                                class="input input-bordered w-50" />
                                                        </label>
                                                        <label class="label">
                                                            <span class="label-text">
                                                                {{ lang[selectedLang].customfields }}</span>
                                                        </label>
                                                        <label class="input-group">
                                                            <input type="text" v-model="customFields"
                                                                :placeholder="cat.custom_fields"
                                                                class="input input-bordered w-50" />
                                                            <i class='bx bx-trash m-5 hover:(w-10)'
                                                                @click="clearCustomFields(cat)"></i>
                                                        </label>
                                                        <label class="label">
                                                            <span class="label-text">
                                                                {{ lang[selectedLang].defaultMessage }}</span>
                                                        </label>
                                                        <label class="input-group">
                                                            <audio></audio>
                                                            <textarea class="textarea textarea-primary w-full"
                                                                :placeholder="getDefMsg(cat)"
                                                                v-model="sendingMessage"></textarea>
                                                            <label class="btn btn-circle btn-outline btn-accent"
                                                                @click="startAudioRecording(cat)">
                                                                <i class='bx bxs-microphone lg text-xl'
                                                                    v-if="recordingState === 0"></i>
                                                                <i class='bx bxs-circle lg text-xl'
                                                                    v-if="recordingState === 1"></i>
                                                                <i class='bx bx-play lg text-xl'
                                                                    v-if="recordingState === 2"></i>
                                                            </label>
                                                        </label>
                                                    </div>
                                                    <div class="modal-action">
                                                        <label :for="`edit-category-modal${cat.id}`"
                                                            class="btn bg-success text-black hover:(text-white)"
                                                            @click="updateCategory(cat)"> {{ lang[selectedLang].save }}
                                                            {{ lang[selectedLang].change }}<i
                                                                class='bx bxs-save ml-2'></i></label>
                                                        <label :for="`edit-category-modal${cat.id}`"
                                                            class="btn bg-success text-black hover:(text-white)"> {{
                                                                lang[selectedLang].cancel }}<i
                                                                class='bx bxs-save ml-2'></i></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </th>
                                    </tr>
                                </tbody>

                            </table>
                            <div class="modal-action">
                                <label for="create-categories-modal" class="btn bg-success text-black hover:(text-white)">
                                    {{ lang[selectedLang].createcategory }}<i class='bx bx-plus-medical ml-2'></i></label>
                                <input type="checkbox" id="create-categories-modal" class="modal-toggle" />
                                <div class="modal">
                                    <div class="modal-box w-11/12 max-w-5xl">
                                        <h3 class="font-bold text-lg"> {{ lang[selectedLang].createcategory }}</h3>
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text"> {{ lang[selectedLang].name }}</span>
                                            </label>
                                            <label class="input-group">
                                                <span>Name</span>
                                                <input type="text" :placeholder="catName" v-model="catName"
                                                    class="input input-bordered" />
                                            </label>
                                            <label class="label">
                                                <span class="label-text"> {{ lang[selectedLang].color }}</span>
                                            </label>
                                            <label class="input-group">
                                                <span><i class='bx bxs-palette'></i></span>
                                                <input type="color" v-model="catColor" class="input input-bordered w-50" />
                                            </label>
                                            <label class="label">
                                                <span class="label-text"> {{ lang[selectedLang].customfields }}</span>
                                            </label>
                                            <label class="input-group">
                                                <input type="text" v-model="customFields" placeholder="SteamHex, DiscordID"
                                                    class="input input-bordered w-100" />
                                            </label>
                                            <label class="label">
                                                <span class="label-text">
                                                    {{ lang[selectedLang].defaultMessage }}</span>
                                            </label>
                                            <label class="input-group">
                                                <audio></audio>
                                                <textarea class="textarea textarea-primary w-full"
                                                    placeholder="This is a default message"
                                                    v-model="sendingMessage"></textarea>
                                                <label class="btn btn-circle btn-outline btn-accent"
                                                    @click="startAudioRecording(cat)">
                                                    <i class='bx bxs-microphone lg text-xl' v-if="recordingState === 0"></i>
                                                    <i class='bx bxs-circle lg text-xl' v-if="recordingState === 1"></i>
                                                    <i class='bx bx-play lg text-xl' v-if="recordingState === 2"></i>
                                                </label>
                                            </label>
                                        </div>
                                        <div class="modal-action">
                                            <label for="create-categories-modal"
                                                class="btn bg-success text-black hover:(text-white)"
                                                @click="createCategory()"> {{ lang[selectedLang].save }}
                                                {{ lang[selectedLang].change }}<i class='bx bxs-save ml-2'></i></label>
                                            <label for="create-categories-modal"
                                                class="btn bg-success text-black hover:(text-white)">
                                                {{ lang[selectedLang].cancel }}<i class='bx bxs-save ml-2'></i></label>
                                        </div>
                                    </div>
                                </div>
                                <label for="categories-modal" class="btn bg-success text-black hover:(text-white)">
                                    {{ lang[selectedLang].savechange }}<i class='bx bxs-save ml-2'></i></label>
                                <label for="categories-modal" class="btn bg-error text-black hover:(text-white)">
                                    {{ lang[selectedLang].close }}<i class='bx bx-x ml-2'></i></label>
                            </div>
                        </div>
                    </div>

                    <label class="btn" for="sys-logs-modal"><i class='bx bxl-blogger mr-2'></i>Logs</label>
                    <input type="checkbox" id="sys-logs-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].systemlogs }}</h3>
                            <p class="py-4">Coming soon...</p>
                            <div class="modal-action">
                                <label for="sys-logs-modal" class="btn bg-red text-black hover:(bg-error)">
                                    {{ lang[selectedLang].close }}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="divider" v-if="clientManageSystem || clientManageRoles"><i class='bx bxs-mask'></i>
                {{ lang[selectedLang].roles }}</div>
            <div class="grid h-20 card bg-base-300 rounded-box place-items-center"
                v-if="clientManageSystem || clientManageRoles">
                <div class="btn-group inline-block">
                    <!--Manage Role-->
                    <label class="btn" for="role-manage-modal"><i class='bx bxs-cog mr-2'></i>
                        {{ lang[selectedLang].manage }}</label>
                    <input type="checkbox" id="role-manage-modal" class="modal-toggle" />
                    <div class="modal modal-bottom lg:modal-middle w-full h-full">
                        <div class="modal-box w-11/12 max-w-7xl h-full">
                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].systemrolepannel }}</h3>

                            <div class="modal-action justify-start mb-2">
                                <!-- <label for="user-manage-modal"
                                                                                                                                                class="btn bg-primary text-white hover:(bg-accent)">search</label> -->
                                <input type="text" placeholder="Search" class="input input-ghost w-full max-w-xs"
                                    id="rolesSearchInput" @keyup="searchTable('rolesTable', 'rolesSearchInput')" />
                            </div>
                            <div class="overflow-auto w-full">
                                <table class="table w-full" id="rolesTable">
                                    <!-- head -->
                                    <thead>
                                        <tr>
                                            <th>
                                                <label>
                                                    <input type="checkbox" class="checkbox" />
                                                </label>
                                            </th>
                                            <th> {{ lang[selectedLang].name }}</th>
                                            <th> {{ lang[selectedLang].owner }}<i class='bx bxs-user m-1'></i></th>
                                            <th> {{ lang[selectedLang].color }}</th>
                                            <th> {{ lang[selectedLang].level }}</th>
                                            <th> {{ lang[selectedLang].actions }}</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- row 1 -->
                                        <tr v-for="role in findNotAssignedRoles()" v-bind:key="role.id">
                                            <th>
                                                <label>
                                                    <input type="checkbox" class="checkbox" />
                                                </label>
                                            </th>
                                            <td>
                                                <div class="flex items-center space-x-3">
                                                    <div>
                                                        <div class="font-bold">{{ role.name }}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <i class='bx bx-check' v-if="role.owner"></i>
                                                <i class='bx bx-x' v-if="!role.owner"></i>
                                            </td>
                                            <td><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                    viewBox="0 0 24 24"
                                                    :style="{ 'fill': role.color, 'transform': none, 'msFilter': none }">
                                                    <path
                                                        d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2z">
                                                    </path>
                                                </svg></td>
                                            <td>{{ role.level }}</td>
                                            <th>
                                                <label class="btn btn-ghost btn-xs bg-error"
                                                    :for="`delete-role-modal${role.id}`"><i class='bx bx-user-x mr-2'></i>
                                                    {{ lang[selectedLang].remove }}</label>
                                                <input type="checkbox" :id="`delete-role-modal${role.id}`"
                                                    class="modal-toggle" />
                                                <div class="modal">
                                                    <div class="modal-box w-11/12 max-w-5xl">
                                                        <h3 class="font-bold text-lg"> {{ lang[selectedLang].warning }}!
                                                        </h3>
                                                        <p class="py-4">You're about to delete a Role! This action
                                                            cannot be undone. Do it on your
                                                            own risk.</p>
                                                        <div class="modal-action">
                                                            <label :for="`delete-role-modal${role.id}`"
                                                                @click="deleteRole(role.id)"
                                                                class="btn bg-error text-black hover:(bg-accent)">
                                                                {{ lang[selectedLang].Delete }}</label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <label class="btn btn-ghost btn-xs bg-primary" @click="setRolePermissionInputs(role)"
                                                    :for="`edit-role-modal${role.id}`"><i class='bx bxs-edit-alt mr-2'></i>
                                                    {{ lang[selectedLang].edit }}</label>




                                            </th>
                                            <!--Edit Role Modal-->
                                            <input type="checkbox" :id="`edit-role-modal${role.id}`" class="modal-toggle" />
                                            <div class="modal modal-bottom lg:modal-middle w-full overflow-auto h-full">
                                                <div class="modal-box w-11/12 max-w-7xl">
                                                    <h3 class="font-bold text-lg"> {{ lang[selectedLang].createrole }}</h3>
                                                    <div class="overflow-auto w-full">
                                                        <div class="form-control flex">
                                                            <div class="grid grid-cols-3">
                                                                <div>
                                                                    <label class="label">
                                                                        <span class="label-text">
                                                                            {{ lang[selectedLang].name }}</span>
                                                                    </label>
                                                                    <label class="input-group">
                                                                        <span> {{ lang[selectedLang].roleName }}</span>
                                                                        <input type="text" :placeholder="role.name"
                                                                            v-model="roleName"
                                                                            class="input input-bordered" />

                                                                    </label>
                                                                </div>
                                                                <div>
                                                                    <label class="label">
                                                                        <span class="label-text">
                                                                            {{ lang[selectedLang].color }}</span>
                                                                    </label>
                                                                    <label class="input-group">
                                                                        <span><i class='bx bxs-palette'></i></span>
                                                                        <input type="color" v-model="roleColor"
                                                                            class="input input-bordered w-50" />
                                                                    </label>
                                                                </div>
                                                                <div>
                                                                    <label class="label">
                                                                        <span class="label-text">
                                                                            {{ lang[selectedLang].level }} (Priority of the
                                                                            role
                                                                            comparing to other
                                                                            roles)</span>
                                                                    </label>
                                                                    <label class="input-group">
                                                                        <span><i class='bx bx-menu'></i></span>
                                                                        <input type="number" v-model="roleLevel"
                                                                            :placeholder="role.level"
                                                                            class="input input-bordered w-50" />
                                                                    </label>
                                                                </div>

                                                            </div>

                                                            <div class="divider"> {{ lang[selectedLang].permisions }}</div>
                                                            <div class="grid grid-cols-6 overflow-auto justify-center">
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].readmsg }}</span>
                                                                    <input type="checkbox"
                                                                        
                                                                        v-model="roleReadMessage"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].writemsg }}</span>
                                                                    <input type="checkbox"
                                                                        v-model="roleWriteMessage"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].deletemsg }}</span>
                                                                    <input type="checkbox" v-model="roleDeleteMessage" 
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].readhistory }}</span>
                                                                    <input type="checkbox" 
                                                                        v-model="roleReadHistory"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>

                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].systems }}uploadmedia</span>
                                                                    <input type="checkbox"
                                                                        v-model="roleUploadMedia"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].deleteticket }}</span>
                                                                    <input type="checkbox" v-model="roleDeleteTicket"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].updateticket }}</span>
                                                                    <input type="checkbox" v-model="roleUpdateTicket"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].createticket }}</span>
                                                                    <input type="checkbox" 
                                                                        v-model="roleCreateTicket"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].managesystem }}</span>
                                                                    <input type="checkbox" v-model="roleManageSystem" 
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].managerole }}</span>
                                                                    <input type="checkbox" v-model="roleManageRoles" 
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>
                                                                <label class="label cursor-pointer justify-start">
                                                                    <span class="label-text">
                                                                        {{ lang[selectedLang].managemember }}</span>
                                                                    <input type="checkbox" v-model="roleManageMembers"
                                                                        class="checkbox checkbox-primary ml-2" />
                                                                </label>

                                                            </div>
                                                            <div class="divider"> {{ lang[selectedLang].categories }}</div>
                                                            <label class="label cursor-pointer justify-start"
                                                                v-for="cat in categories" v-bind:key="cat.id">
                                                                <span class="label-text"> {{ cat.name }}</span>
                                                                <input type="checkbox" 
                                                                    class="checkbox checkbox-primary ml-2"
                                                                    :id="`update${cat.name}-${cat.id}-${role.id}`" />
                                                            </label>
                                                            <div class="divider"> {{ lang[selectedLang].closed }}</div>
                                                            <label class="label cursor-pointer justify-start"
                                                                v-for="cat in categories" v-bind:key="cat.id">
                                                                <span class="label-text"> {{ cat.name }}</span>
                                                                <input type="checkbox" 
                                                                    class="checkbox checkbox-primary ml-2"
                                                                    :id="`closed-${cat.name}-${cat.id}-${role.id}`" />
                                                            </label>

                                                            <div class="modal-action">
                                                                <label :for="`edit-role-modal${role.id}`"
                                                                    @click="updateRole(role)" class="btn bg-success text-black hover:(text-white)">
                                                                    {{ lang[selectedLang].save }}
                                                                    <i class='bx bxs-save ml-2'></i>
                                                                </label>
                                                                <label :for="`edit-role-modal${role.id}`" class="btn bg-red text-black hover:(text-white)">
                                                                    {{ lang[selectedLang].close }}
                                                                    <i class='bx bx-x ml-2'></i>
                                                                </label>
                                                            </div>

                                                        </div>

                                                    </div>

                                                </div>
                                            </div>
                                        </tr>
                                    </tbody>

                                </table>
                            </div>
                            <div class="modal-action">
                                <label for="role-manage-modal" class="btn bg-success text-black hover:(text-white)">
                                    {{ lang[selectedLang].savechange }}
                                    <i class='bx bxs-save ml-2'></i></label>
                                <label for="role-manage-modal" class="btn bg-error text-black hover:(text-white)">
                                    {{ lang[selectedLang].close }}
                                    <i class='bx bx-x ml-2'></i></label>
                            </div>
                        </div>
                    </div>
                    <!--Create Role-->
                    <label class="btn" for="add-role-modal"><i class='bx bx-add-to-queue mr-2'></i>
                        {{ lang[selectedLang].create }}</label>
                    <input type="checkbox" id="add-role-modal" class="modal-toggle" />
                    <div class="modal modal-bottom lg:modal-middle w-full h-full">
                        <div class="modal-box w-11/12 max-w-7xl">
                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].createrole }}</h3>
                            <div class="overflow-auto w-full">
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text"> {{ lang[selectedLang].name }}</span>
                                    </label>
                                    <label class="input-group">
                                        <span> {{ lang[selectedLang].rolename }}</span>
                                        <input type="text" placeholder="e.g. Ticket Responder" v-model="roleName"
                                            class="input input-bordered" />
                                    </label>
                                    <label class="label">
                                        <span class="label-text"> {{ lang[selectedLang].color }}</span>
                                    </label>
                                    <label class="input-group">
                                        <span><i class='bx bxs-palette'></i></span>
                                        <input type="color" class="input input-bordered w-50" v-model="roleColor" />
                                    </label>
                                    <label class="label">
                                        <span class="label-text"> {{ lang[selectedLang].level }} (Priority of the role
                                            comparing to other
                                            roles)</span>
                                    </label>
                                    <label class="input-group">
                                        <span><i class='bx bx-menu'></i></span>
                                        <input type="number" class="input input-bordered w-50" v-model="roleLevel" />
                                    </label>
                                    <div class="divider"> {{ lang[selectedLang].permisions }}</div>
                                    <div class="grid grid-cols-4 overflow-auto">
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].readmsg }}</span>
                                            <input type="checkbox" checked="checked" v-model="roleReadMessage"
                                                class="checkbox checkbox-primary ml-2" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].writemsg }}</span>
                                            <input type="checkbox" checked="checked" v-model="roleWriteMessage"
                                                class="checkbox checkbox-primary ml-2" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].deletemsg }}</span>
                                            <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                                v-model="roleDeleteMessage" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].readhistory }}</span>
                                            <input type="checkbox" checked="checked" v-model="roleReadHistory"
                                                class="checkbox checkbox-primary ml-2" />
                                        </label>

                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].uploadmedia }}</span>
                                            <input type="checkbox" checked="checked" v-model="roleUploadMedia"
                                                class="checkbox checkbox-primary ml-2" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].deleteticket }}</span>
                                            <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                                v-model="roleDeleteTicket" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].updateticket }}</span>
                                            <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                                v-model="roleUpdateTicket" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].createticket }}</span>
                                            <input type="checkbox" checked="checked" v-model="roleCreateTicket"
                                                class="checkbox checkbox-primary ml-2" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].managesystem }}</span>
                                            <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                                v-model="roleManageSystem" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].managerole }}</span>
                                            <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                                v-model="roleManageRoles" />
                                        </label>
                                        <label class="label cursor-pointer justify-start">
                                            <span class="label-text"> {{ lang[selectedLang].manageuser }}</span>
                                            <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                                v-model="roleManageMembers" />
                                        </label>
                                    </div>
                                    <div class="divider"> {{ lang[selectedLang].categories }}</div>
                                    <label class="label cursor-pointer justify-start" v-for="cat in categories"
                                        v-bind:key="cat.id">
                                        <span class="label-text"> {{ cat.name }}</span>
                                        <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                            :id="`${cat.name}-${cat.id}`" />
                                    </label>
                                    <div class="divider"> {{ lang[selectedLang].closed }}</div>
                                    <label class="label cursor-pointer justify-start" v-for="cat in categories"
                                        v-bind:key="cat.id">
                                        <span class="label-text"> {{ cat.name }}</span>
                                        <input type="checkbox" class="checkbox checkbox-primary ml-2"
                                            :id="`closed-${cat.name}-${cat.id}`" />
                                    </label>

                                </div>

                            </div>
                            <div class="modal-action">
                                <label for="add-role-modal" class="btn bg-success text-black hover:(text-white)"
                                    @click="createRole"> {{ lang[selectedLang].savechange }}<i
                                        class='bx bxs-save ml-2'></i></label>
                                <label for="add-role-modal" class="btn bg-error text-black hover:(text-white)"
                                    @click="createRole"> {{ lang[selectedLang].close }}<i
                                        class='bx bx-x ml-2'></i></label>
                            </div>
                        </div>
                    </div>
                    <label class="btn border-none" for="sys-logs-modal"><i class='bx bxl-blogger mr-2'></i>Logs</label>
                    <input type="checkbox" id="sys-logs-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg"> {{ lang[selectedLang].systemlogs }}</h3>
                            <p class="py-4">Coming soon...</p>
                            <div class="modal-action">
                                <label for="sys-logs-modal" class="btn bg-red text-black hover:(bg-error)">{{ lang[selectedLang].close }}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="divider" v-if="clientManageSystem"><i class='bx bxs-cog'></i> {{ lang[selectedLang].systems }}</div>
            <div class="grid h-20 card bg-base-300 rounded-box place-items-center" v-if="clientManageSystem">
                <div class="btn-group inline-block">
                    <label class="btn hover:(bg-error text-black)" for="delete-system-modal"><i
                            class='bx bxs-trash mr-2'></i>{{ lang[selectedLang].deletesystem }}</label>
                    <!-- The button to open modal -->
                    <!-- Put this part before </body> tag -->
                    <input type="checkbox" id="delete-system-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg">Warning!</h3>
                            <p class="py-4">You're about to delete your system! This action cannot be undone. Do it on your
                                own risk.</p>
                            <div class="modal-action">
                                <label for="delete-system-modal" class="btn bg-red text-black hover:(text-white)">{{
                                    lang[selectedLang].cancel }}<i class='bx bx-x ml-2'></i></label>
                                <label for="delete-system-modal" class="btn bg-error text-black hover:(bg-accent)"
                                    @click="deleteSystem">{{ lang[selectedLang].Delete }}</label>
                            </div>
                        </div>
                    </div>
                    <label class="btn" for="edit-display-system-modal"><i class='bx bxs-edit-alt mr-2 '></i>{{
                        lang[selectedLang].editdisplays }}</label>
                    <input type="checkbox" id="edit-display-system-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg">Edit System Preferences & Displays</h3>
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">{{ lang[selectedLang].name }}</span>
                                </label>
                                <label class="input-group">
                                    <span>Name</span>
                                    <input type="text" placeholder="Support" class="input input-bordered"
                                        v-model="sysName" />
                                </label>
                                <div class="form-control">
                                    <label class="label">
                                        <span class="label-text">{{ lang[selectedLang].about }}</span>
                                    </label>
                                    <label class="input-group">
                                        <span>About</span>
                                        <input type="text" placeholder="24/7 online supporting" v-model="sysAbout"
                                            class="input input-bordered" />
                                    </label>

                                    <label class="label">
                                        <span class="label-text">{{ lang[selectedLang].banner }}</span>
                                    </label>
                                    <label class="input-group">
                                        <span>Banner</span>
                                        <input type="file" v-on:change="updateSysBanner"
                                            class="file-input file-input-bordered file-input-primary w-full max-w-xs" />
                                    </label>
                                    <label class="label">
                                        <span class="label-text">{{ lang[selectedLang].profile }}</span>
                                    </label>
                                    <label class="input-group">
                                        <span>Profile</span>
                                        <input type="file" v-on:change="updateSysPfp"
                                            class="file-input file-input-bordered file-input-primary w-full max-w-xs" />
                                    </label>

                                </div>
                            </div>
                            <div class="modal-action">
                                <label for="edit-display-system-modal" @click="updateSys"
                                    class="btn bg-success text-black hover:(text-white)">{{ lang[selectedLang].save }}<i
                                        class='bx bxs-save ml-2'></i></label>
                                <label for="edit-display-system-modal" class="btn bg-red text-black hover:(text-white)">{{
                                    lang[selectedLang].cancel }}<i class='bx bx-x ml-2'></i></label>
                            </div>
                        </div>
                    </div>
                    <label class="btn" for="change-visibility-modal"><i class='bx bxs-low-vision mr-2'></i>{{
                        lang[selectedLang].changevisibility }}</label>
                    <input type="checkbox" id="change-visibility-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg">System Visibility</h3>
                            <p class="py-4">Your system is private Do you want to change it to public ?</p>
                            <div class="modal-action">
                                <label for="change-visibility-modal" class="btn bg-success text-black hover:(bg-accent)"
                                    @click="changeSysPrivacy">Change</label>
                                <label for="change-visibility-modal"
                                    class="btn bg-red text-black hover:(bg-error)">Cancel</label>
                            </div>
                        </div>
                    </div>
                    <label class="btn" for="sys-prdefinedmsg-modal"><i class='bx bxl-blogger mr-2'></i>{{
                        lang[selectedLang].protocolMessages }}</label>
                    <input type="checkbox" id="sys-prdefinedmsg-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-full h-full max-w-5xl">
                            <h3 class="font-bold text-lg">{{ lang[selectedLang].protocolMessages }}</h3>
                            <table class="table w-full" id="rolesTable">
                                <!-- head -->
                                <thead>
                                    <tr>
                                        <th> {{ lang[selectedLang].title }}</th>
                                        <th> {{ lang[selectedLang].content }}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- row 1 -->
                                    <tr v-for="pm in predefinedMessages" v-bind:key="pm.id">
                                        <td>
                                            <div class="flex items-center space-x-3">
                                                <div>
                                                    <div class="font-bold">{{ pm.title }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex items-center space-x-3">
                                                <div>
                                                    <div class="font-bold">{{ pm.content }}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <th>
                                            <label class="btn btn-ghost btn-xs bg-error" :for="`delete-pm-modal${pm.id}`"><i
                                                    class='bx bx-user-x mr-2'></i>
                                                {{ lang[selectedLang].remove }}</label>
                                            <input type="checkbox" :id="`delete-pm-modal${pm.id}`" class="modal-toggle" />
                                            <div class="modal">
                                                <div class="modal-box w-11/12 max-w-5xl">
                                                    <h3 class="font-bold text-lg"> {{ lang[selectedLang].warning }}!
                                                    </h3>
                                                    <p class="py-4">You're about to delete a Predefined Message! This action
                                                        cannot be undone. Do it on your
                                                        own risk.</p>
                                                    <div class="modal-action">
                                                        <label :for="`delete-pm-modal${pm.id}`" @click="deletePm(pm.id)"
                                                            class="btn bg-error text-black hover:(bg-accent)">
                                                            {{ lang[selectedLang].Delete }}</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <label class="btn btn-ghost btn-xs bg-primary" :for="`edit-pm-modal${pm.id}`"><i
                                                    class='bx bxs-edit-alt mr-2'></i>
                                                {{ lang[selectedLang].edit }}</label>
                                            <input type="checkbox" :id="`edit-pm-modal${pm.id}`" class="modal-toggle" />
                                            <div class="modal modal-bottom lg:modal-middle w-full overflow-auto h-full">
                                                <div class="modal-box w-11/12 max-w-7xl">
                                                    <h3 class="font-bold text-lg">Edit Protocol Message</h3>
                                                    <div class="form-control">
                                                        <label class="label">
                                                            <span class="label-text">{{ lang[selectedLang].title }}</span>
                                                        </label>
                                                        <label class="input-group">
                                                            <span>{{ lang[selectedLang].title }}</span>
                                                            <input type="text" :placeholder="pm.title"
                                                                class="input input-bordered" v-model="pmTitle" />
                                                        </label>
                                                        <label class="label">
                                                            <span class="label-text">{{ lang[selectedLang].content }}</span>
                                                        </label>
                                                        <label class="input-group">
                                                            <span>{{ lang[selectedLang].content }}</span>
                                                            <textarea
                                                                class="textarea w-9/10 focus:outline-none focus:ring focus:ring-neutral"
                                                                :placeholder="pm.content" v-model="pmContent"></textarea>
                                                        </label>
                                                    </div>
                                                    <div class="modal-action">
                                                        <label :for="`edit-pm-modal${pm.id}`" @click="editPm(pm)"
                                                            class="btn bg-success text-black hover:(text-white)">{{
                                                                lang[selectedLang].save }}<i
                                                                class='bx bxs-save ml-2'></i></label>
                                                        <label :for="`edit-pm-modal${pm.id}`"
                                                            class="btn bg-red text-black hover:(text-white)">{{
                                                                lang[selectedLang].cancel }}<i class='bx bx-x ml-2'></i></label>
                                                    </div>
                                                </div>
                                            </div>
                                        </th>
                                        <!-- <input type="checkbox" :id="`edit-pm-modal${pm.id}`" class="modal-toggle" />
                                        <div class="modal modal-bottom lg:modal-middle w-full overflow-auto h-full">
                                            <div class="modal-box w-11/12 max-w-7xl">

                                            </div>
                                        </div> -->
                                    </tr>
                                </tbody>

                            </table>
                            <div class="modal-action">
                                <label for="sys-add-predefinedmsg-modal"
                                    class="btn bg-success text-black hover:(bg-error)">{{ lang[selectedLang].create
                                    }}</label>
                                <input type="checkbox" id="sys-add-predefinedmsg-modal" class="modal-toggle" />
                                <div class="modal modal-bottom lg:modal-middle w-full overflow-auto h-full">
                                    <div class="modal-box w-11/12 max-w-7xl">
                                        <h3 class="font-bold text-lg">Add Protocol Message</h3>
                                        <div class="form-control">
                                            <label class="label">
                                                <span class="label-text">{{ lang[selectedLang].title }}</span>
                                            </label>
                                            <label class="input-group">
                                                <span>{{ lang[selectedLang].title }}</span>
                                                <input type="text" placeholder="Support" class="input input-bordered"
                                                    v-model="pmTitle" />
                                            </label>
                                            <label class="label">
                                                <span class="label-text">{{ lang[selectedLang].content }}</span>
                                            </label>
                                            <label class="input-group">
                                                <span>{{ lang[selectedLang].content }}</span>
                                                <textarea class="textarea w-9/10 focus:ring focus:ring-neutral"
                                                    placeholder="It's a predefined message" v-model="pmContent"></textarea>
                                            </label>
                                        </div>
                                        <div class="modal-action">
                                            <label for="sys-add-predefinedmsg-modal" @click="addPm"
                                                class="btn bg-success text-black hover:(text-white)">{{
                                                    lang[selectedLang].save }}<i class='bx bxs-save ml-2'></i></label>
                                            <label for="sys-add-predefinedmsg-modal"
                                                class="btn bg-red text-black hover:(text-white)">{{
                                                    lang[selectedLang].cancel }}<i class='bx bx-x ml-2'></i></label>
                                        </div>
                                    </div>
                                </div>

                                <label for="sys-prdefinedmsg-modal" class="btn bg-red text-black hover:(bg-error)">{{
                                    lang[selectedLang].close }}</label>
                            </div>
                        </div>
                    </div>
                    <label class="btn" for="sys-logs-modal"><i class='bx bxl-blogger mr-2'></i>Logs</label>
                    <input type="checkbox" id="sys-logs-modal" class="modal-toggle" />
                    <div class="modal">
                        <div class="modal-box w-11/12 max-w-5xl">
                            <h3 class="font-bold text-lg">System Logs</h3>
                            <p class="py-4">Coming soon...</p>
                            <div class="modal-action">

                                <label for="sys-logs-modal" class="btn bg-red text-black hover:(bg-error)">{{
                                    lang[selectedLang].close }}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
