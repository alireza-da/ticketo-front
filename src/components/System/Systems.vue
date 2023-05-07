<script>
import System from './System.vue'
import axios from 'axios'

export default {
    props: {
        path: {
            type: Array,
            default: ['Systems'],
            lang: Object,
            selectedLang: String
        },
        systems: {
            type: Array,
            default: []
        },
        userData: {
            type: Object,
            default: null
        },
        lang: Object,
        selectedLang: String
    },
    data() {
        return {
            isActive: false,
            isSystemSelected: false,
            ownedSystems: [],
            publicSystem: [],
            selectedSystem: null,
            sysRoles: {},
            passedSystems: [],
            passedUserData: [],
            // APIs //
            sysRoleAPI: "https://62.3.14.249/api/roles/details/", // roles/details/<int:sysid>/<int:uid>,
            roleListAPI: "https://62.3.14.249/api/roles/list/", // roles/details/<int:sysid>/<int:uid>,
            sysListAPI: "https://62.3.14.249/api/systems/list/", // roles/details/<int:sysid>/<int:uid>,
            sysCategoryListAPI: 'https://62.3.14.249/api/system/categories/list/',
            // create system data
            sysName: "",
            sysAbout: "",
            sysBanner: "",
            sysPfp: "",
            sysPrivacy: false,
            sysTicketPrefix: ""

        }
    },
    async created() {
        this.token = localStorage.getItem('token')
        await this.fetchRoles()
    },
    watch: {
        systems(newVal) {
            this.passedSystems = newVal
            this.fetchRoles()
        },
        userData(newVal) {
            this.passedUserData = newVal
            this.fetchRoles()
        }
    },
    methods: {
        goToSystem(selected) {
            var temp = this.path
            if (temp.length > 1) {
                temp.pop()
            }
            temp.push(selected['name'])
            this.$emit('updatePath', temp)
            this.isSystemSelected = true
            this.selectedSystem = selected
            // this.$router.push({name: 'systems', params: {id: 1}})
        },
        backToSystems() {
            this.isSystemSelected = false
            this.fetchSystems()
            location.reload()
        },
        isAdmin(roles) {
            for (const role of roles) {

                if (role.level > 10 || role.owner) {
                    return true
                }
            }
            return false
        },
        async fetchRoles() {
            this.passedSystems.forEach(async sys => {
                await axios.get(`${this.sysRoleAPI}${sys['id']}/${this.passedUserData['id']}`, { headers: { 'Authorization': `Token ${this.token}` } }).then(async (response) => {
                    this.sysRoles[sys['id']] = response.data
                    if (this.isAdmin(response.data)) {
                        await this.ownedSystems.push(sys)
                        console.log(this.ownedSystems);
                    }
                    else {
                        await this.publicSystem.push(sys)
                        console.log(this.publicSystem);
                    }

                })
            })
        },
        async fetchSystems() {
            await axios.get(`${this.sysListAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(async res => {
                this.passedSystems = res.data
            })
            this.$emit('fetch-system')
        },
        async fetchClientUserData() {
            await axios.get(`${this.userDataAPI}`, { headers: { Authorization: `Token ${this.token}` } }).then(res => {
                this.passedUserData = res.data
            })
        },
        async createSys() {
            await axios.post(`${this.sysListAPI}`, {
                name: this.sysName,
                about_system: this.sysAbout,
                ticket_prefix: this.sysTicketPrefix,
                banner: this.sysBanner,
                pfp: this.sysPfp,
                is_private: this.sysPrivacy,
                ref_url: `${this.sysName}-${this.makeid(7)}`
            }, { headers: { Authorization: `Token ${this.token}`, 'Content-Type': 'multipart/form-data' } }).then(async res => {
                this.$notify({
                    group: "foo",
                    title: "Success",
                    text: `${this.sysName} has been created`
                })
                await this.createOwnership(res.data['id'])
                await this.createDefaultCategory(res.data['id'])
                location.reload()

            }).catch(err => {
                this.$notify({
                    group: "error",
                    title: "Error",
                    text: `Something wrong`
                })
            })
        },
        async createDefaultCategory(sid) {
            await axios.post(`${this.sysCategoryListAPI}`, {
                name: "Default",
                sys_id: sid
            }, { headers: { Authorization: `Token ${this.token}` } })
        },
        async createOwnership(sys_id) {
            await axios.post(`${this.roleListAPI}`, {
                "color": "#000000",
                "create_ticket": true,
                "delete_messages": true,
                "delete_ticket": true,
                "level": 200,
                "manage_members": true,
                "manage_role": true,
                "manage_system": true,
                "name": "Owner",
                "owner": true,
                "read_history": true,
                "read_messages": true,
                "sys_id": sys_id,
                "update_ticket": true,
                "upload_media": true,
                "user_id": this.passedUserData['id'],
                "write_messages": true
            }, { headers: { Authorization: `Token ${this.token}` } }).then(res => {

            })
        },

        updateSysPfp(event) {
            this.sysPfp = event.target.files[0]
        },
        updateSysBanner(event) {
            this.sysBanner = event.target.files[0]
        },
        navigateToTicketPage(ticket) {
            this.isSystemSelected = false
            this.$emit("navigate-to-ticket-page", ticket)
        },
        makeid(length) {
            let result = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            let counter = 0;
            while (counter < length) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
                counter += 1;
            }
            return result;
        },
        performReloadSys(sys) {
            location.reload()
            window.addEventListener("load", (event) => {
                this.goToSystem(sys)
            });

        }

    },
    components: {
        System
    }
}
</script>

<template>
    <div v-show="isActive" class="p-2 overflow-auto">
        <div v-show="isSystemSelected" class="overflow-auto">
            <System :system="selectedSystem" v-on:navigate-to-ticket-page="navigateToTicketPage"
                v-on:back-to-systems="backToSystems" v-on:perform-reload-sys="performReloadSys" :lang="lang" :selectedLang="selectedLang"></System>
        </div>
        <div class="flex flex-col w-full h-full" v-show="!isSystemSelected">
            <div class="grid h-full card bg-base-300 rounded-box place-items-center p-3"  v-if="userData && userData.is_staff">
                <label class="btn gap-2 w-full bg-accent text-primary hover:(text-white)" for="create-sys-modal">
                    <i class='bx bx-plus-medical'></i>
                    {{lang[selectedLang].createyourownsystem}}
                </label>
                <!-- <label class="btn" for="sys-logs-modal"><i class='bx bxl-blogger mr-2'></i>Logs</label> -->
                <input type="checkbox" id="create-sys-modal" class="modal-toggle" />
                <div class="modal">
                    <div class="modal-box w-11/12 max-w-5xl">
                        <h3 class="font-bold text-lg"> {{lang[selectedLang].createsystem}}</h3>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text"> {{lang[selectedLang].systemname}}</span>
                            </label>
                            <label class="input-group">
                                <span> {{lang[selectedLang].name}}</span>
                                <input type="text" placeholder="Sample Shop" class="input input-bordered"
                                    v-model="sysName" />
                            </label>
                            <label class="label">
                                <span class="label-text"> {{lang[selectedLang].about}}</span>
                            </label>
                            <label class="input-group">
                                <span> {{lang[selectedLang].about}}</span>
                                <input type="text" placeholder="24/7 support" class="input input-bordered"
                                    v-model="sysAbout" />
                            </label>
                            <label class="label">
                                <span class="label-text">Ticket Prefix</span>
                            </label>
                            <label class="input-group">
                                <span>Prefix</span>
                                <input type="text" placeholder="shop-ticket-{ticket_id}" class="input input-bordered"
                                    v-model="sysTicketPrefix" />
                            </label>
                            <label class="label">
                                <span class="label-text"> {{lang[selectedLang].bannerpicture}}</span>
                            </label>
                            <label class="input-group">
                                <span> {{lang[selectedLang].banner}}</span>
                                <input type="file" v-on:change="updateSysBanner"
                                    class="file-input file-input-bordered file-input-primary w-full max-w-xs" />
                            </label>
                            <label class="label">
                                <span class="label-text"> {{lang[selectedLang].profilepicture}}</span>
                            </label>
                            <label class="input-group">
                                <span> {{lang[selectedLang].profile}}</span>
                                <input type="file" v-on:change="updateSysPfp"
                                    class="file-input file-input-bordered file-input-primary w-full max-w-xs" />
                            </label>
                            <label class="label cursor-pointer justify-start mt-2">
                                <span class="label-text mr-5"> {{lang[selectedLang].private}}</span>
                                <input type="checkbox" checked="checked" class="checkbox checkbox-primary"
                                    v-model="sysPrivacy" />
                            </label>
                        </div>
                        <div class="modal-action">
                            <label for="create-sys-modal" class="btn bg-primary text-black hover:(bg-accent text-white)"
                                @click="createSys"> {{lang[selectedLang].create}}</label>
                            <label for="create-sys-modal"
                                class="btn bg-red text-black hover:(bg-accent text-white)"> {{lang[selectedLang].close}}</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="divider">Systems</div>
            <div class="grid h-full w-full card bg-base-300 rounded-box place-items-center">

                <ul class="menu bg-base-100 p-2 rounded-box h-full w-full" v-show="!isSystemSelected">
                    <li class="menu-title">
                        <span><i class='bx bxs-crown'></i>  {{lang[selectedLang].owned}}</span>
                    </li>
                    <li v-for="sys in ownedSystems" v-bind:key="sys.id" @click="goToSystem(sys)"><a>{{ sys.name }}</a></li>
                    <li class="menu-title">
                        <span><i class='bx bx-globe'></i>  {{lang[selectedLang].public}}</span>
                    </li>
                    <li v-for="sys in publicSystem" v-bind:key="sys.id" @click="goToSystem(sys)"><a>{{ sys.name }}</a></li>
                </ul>
            </div>

        </div>
    </div>
</template>