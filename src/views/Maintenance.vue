<template>
  <div class="d-flex align-center justify-center" style="height: 100vh;">
    <div>
      <v-card class="mt-10 rounded-xl" style="max-width: 600px; margin: auto;">
        <v-card-text class="pa-5 d-flex flex-column align-center">
          <h1 class="text-h2 text-primary mb-3">C'est tout cassé !</h1>
          <h2>L'application est actuellement en maintenance.</h2>
          <v-img class="my-3" height="300" width="300" :src="require('@/assets/images/maintenance.png')"></v-img>
          <h2 class="mt-5 font-weight-regular text-center text-justify">Si tu vois cette page, ça veut dire que je suis déjà sur le coup, alors tu peux faire une petite pause, prendre un café et revenir un peu plus tard !</h2>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

export default {
  props : [],
  data() {
    return {
      userStore: useUserStore(),
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub()
    })
  },
}
</script>