<script>

import axios from "axios";
import ShowProfile from "@/components/Profile/ShowProfile.vue";
import EditProfile from "@/components/Profile/EditProfile.vue";

export default {
    components: {EditProfile, ShowProfile},
    props: {
        title: {
            type: String,
            default: 'Tab'
        },
        lang: Object,
        selectedLang: String
    },
    data() {
        return {
            isActive: false,
            selectedIndex: 0,
            _ptabs: ["showProfile", "editProfile",],
            path: [],
            navigatedTicket: null,
            token: null,
            // API URIs
            userAPI: "http://127.0.0.1:8000/api/users/details/ata/", // e.g http://127.0.0.1:8000/api/users/details/1
            userData: null,
            systemsData: null,
            ticketsData: null,
            step: 0,
        }
    },
    created() {
        this.token = localStorage.getItem('token')
    },
    async mounted() {
        this.selectTab(0)
        await this.fetchUserData()
    },
    methods: {
        async selectTab(i) {

            this.selectedIndex = i
            this.step = i
            // loop over all the tabs
            this._ptabs.forEach((tab, index) => {
                this.$refs[tab].isActive = (index === i)
                if (this.$refs[tab].isActive) {
                    this.path = []
                    this.path.push(tab)
                }
            })

        },
        updatePath(val) {
            this.path = val
        },
        async fetchUserData() {
            await axios.get(`${this.userAPI}`, {headers: {'Authorization': `Token ${this.token}`}}).then((response) => {
                this.userData = response.data
            })
        },
        backToMainOption(elem) {
            this.$refs[elem.toLowerCase()].isSystemSelected = false
            this.path = [elem]
        },
        printTest() {
            this.step = 0
        },
    }
}
</script>

<template>
    <div v-show="isActive" >

        <div class="h-full w-full ">
            <div class="dashboard flex p-3 space-x-4 " style="width: 100%; ">
                <div class="sidebar h-full" style="display: inline-block;">
                    <ul class="menu bg-base-100 w-56 h-full p-2 rounded-box">
                        <li v-bind:class="{ 'bg-accent': selectedIndex == 0 }">
                            <a @click="selectTab(0)">
                                <i class='bx bx-user'></i>
                                {{lang[selectedLang].showprofile}}
                            </a>
                        </li>
                        <li v-bind:class="{ 'bg-accent': selectedIndex == 1 }">
                            <a @click="selectTab(1)">
                                <i class='bx bx-edit-alt'></i>
                                {{lang[selectedLang].editprofile}}
                            </a>
                        </li>

                    </ul>
                </div>
                <div class="h-full w-full rounded-xl bg-base-100"
                     style="display: inline-block;">
                    <div class="text-sm breadcrumbs m-2 mb-0 ">
                        <ul>
                            <li v-for="p in this.path" v-bind:key="p">
                                <a @click="backToMainOption(p)">
                                    <i v-if="selectedIndex == 0" class="bx bx-support m-2"></i>
                                    <i v-if="selectedIndex == 1" class="bx bx-envelope m-2"></i>

                                    {{ p }}
                                </a>
                            </li>
                        </ul>
                    </div>
                    <show-profile v-if="step == 0" ref="showProfile"  :lang="lang" :selectedLang="selectedLang"></show-profile>
                    <edit-profile v-if="step == 1" ref="editProfile" @selectTab="selectTab" :lang="lang" :selectedLang="selectedLang"></edit-profile>

                </div>
            </div>
        </div>
    </div>
</template>