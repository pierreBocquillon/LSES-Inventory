<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" color="primary" align-tabs="center">
        <v-tab value="companies">Entreprises</v-tab>
        <v-tab value="storages">Stockage</v-tab>
        <v-tab value="items">Items</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="companies" class="pa-5">
          <CompaniesTab />
        </v-window-item>
        <v-window-item value="storages" class="pa-5">
          <StoragesTab />
        </v-window-item>
        <v-window-item value="items" class="pa-5">
          <ItemsTab />
        </v-window-item>
      </v-window>

    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import CompaniesTab from '@/components/stocks/CompaniesTab.vue'
import StoragesTab from '@/components/stocks/StoragesTab.vue'
import ItemsTab from '@/components/stocks/ItemsTab.vue'

export default {
  props : [],
  components: {
    CompaniesTab,
    StoragesTab,
    ItemsTab,
  },
  data() {
    return {
      userStore: useUserStore(),
      tab: 'companies',
    }
  },
}
</script>
