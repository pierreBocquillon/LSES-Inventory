<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Rapports Autopsie :</h3>

      <div class="mt-4">
        <div class="d-flex align-center mb-4">
          <v-text-field v-model="search" append-inner-icon="mdi-magnify" label="Rechercher" single-line hide-details
            variant="outlined" density="compact"></v-text-field>
          <v-btn class="ml-4" color="deep-purple" variant="tonal" prepend-icon="mdi-slot-machine" @click="openRandomizer">
            Randomizer
          </v-btn>
          <v-btn class="ml-4" color="cyan" variant="tonal" prepend-icon="mdi-plus" @click="$router.push('/autopsie')">
            Nouvelle autopsie
          </v-btn>
        </div>

        <v-data-table :headers="headers" :items="reports" :search="search" class="elevation-1"
          :sort-by="[{ key: 'autopsyDate', order: 'desc' }]">
          <template v-slot:item.autopsyDate="{ item }">
            {{ new Date(item.autopsyDate).toLocaleDateString('fr-FR') }} {{ new
              Date(item.autopsyDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
          </template>

          <template v-slot:item.doctor="{ item }">
            {{ item.doctor ? 'Dr ' + item.doctor : '' }}
          </template>

          <template v-slot:item.legists="{ item }">
            {{ (Array.isArray(item.legists) ? item.legists : (item.legist ? [item.legist] : [])).filter(Boolean).map(l => 'Dr ' + l).join(', ') }}
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex">
              <v-btn color="cyan" variant="text" icon="mdi-pencil" @click="viewReport(item)"
                title="Consulter"></v-btn>
              <v-btn color="orange" variant="text" icon="mdi-download" @click="downloadPdf(item)"
                title="Télécharger"></v-btn>
              <v-btn color="red" variant="text" icon="mdi-delete" @click="deleteReport(item)" title="Supprimer"></v-btn>
            </div>
          </template>
        </v-data-table>
      </div>

    </v-card>

    <!-- Randomizer Dialog -->
    <v-dialog v-model="randomizerDialog" max-width="520" @after-leave="resetRandomizer">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-center pt-5 pb-2">
          <v-icon color="deep-purple" class="mr-2">mdi-slot-machine</v-icon>
          Randomizer Légiste
        </v-card-title>

        <!-- Étape 1 : Configuration -->
        <template v-if="randomizerStep === 1">
          <v-card-text>
            <p class="mb-3 text-medium-emphasis text-body-2">Sélectionnez les légistes à inclure dans la roue :</p>
            <div v-if="legistesLoading" class="d-flex justify-center my-6">
              <v-progress-circular indeterminate color="deep-purple"></v-progress-circular>
            </div>
            <template v-else>
              <v-list lines="one" density="compact">
                <v-list-item v-for="legiste in legistes" :key="legiste.id">
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="selectedLegistes"
                      :value="legiste.id"
                      hide-details
                      color="deep-purple"
                      density="compact"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>{{ legiste.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
              <div v-if="legistes.length === 0" class="text-center text-medium-emphasis py-4">
                Aucun légiste trouvé.
              </div>
            </template>
          </v-card-text>
          <v-card-actions class="pb-4 px-4">
            <v-btn variant="text" @click="randomizerDialog = false">Annuler</v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="deep-purple"
              variant="tonal"
              :disabled="selectedLegistes.length === 0"
              @click="goToWheel"
              append-icon="mdi-arrow-right"
            >
              Lancer la roue
            </v-btn>
          </v-card-actions>
        </template>

        <!-- Étape 2 : Roue -->
        <template v-if="randomizerStep === 2">
          <v-card-text class="d-flex flex-column align-center py-4">
            <div class="wheel-wrapper">
              <div class="wheel-pointer"></div>
              <canvas ref="wheelCanvas" width="420" height="420"></canvas>
            </div>
            <div v-if="wheelResult" class="text-center mt-4">
              <span class="text-h6 font-weight-bold" style="color: #7B1FA2;">🎉 {{ wheelResult }}</span>
            </div>
          </v-card-text>
          <v-card-actions class="pb-4 px-4">
            <v-btn variant="text" :disabled="isSpinning" @click="randomizerStep = 1">Retour</v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="deep-purple"
              variant="tonal"
              :disabled="isSpinning"
              @click="spinWheel"
              prepend-icon="mdi-rotate-right"
            >
              {{ isSpinning ? 'En cours...' : 'Tourner !' }}
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import Autopsie from '../classes/Autopsie.js'
import Profile from '../classes/Profile.js'
import { generateReport } from '../functions/autopsieManager'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      search: '',
      reports: [],
      randomizerDialog: false,
      randomizerStep: 1,
      legistes: [],
      selectedLegistes: [],
      legistesLoading: false,
      isSpinning: false,
      currentRotation: 0,
      wheelResult: null,
      _animFrame: null,
      headers: [
        { title: 'Date', key: 'autopsyDate', align: 'start' },
        { title: 'Nom', key: 'name', align: 'start' },
        { title: 'CID', key: 'cid', align: 'start' },
        { title: 'Médecin intervenant', key: 'doctor', align: 'start', sortable: false },
        { title: 'Médecin(s) légiste(s)', key: 'legists', align: 'start', sortable: false },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
    }
  },

  computed: {
    selectedLegistesNames() {
      return this.legistes
        .filter(l => this.selectedLegistes.includes(l.id))
        .map(l => l.name)
    }
  },

  mounted() {
    const unsub = Autopsie.listenAll((list) => {
      this.reports = list.sort((a, b) => b.autopsyDate - a.autopsyDate)
    })
    this.unsub.push(unsub)
  },

  methods: {
    viewReport(item) {
      // Assuming route is /autopsie/:id
      this.$router.push({ name: 'Autopsie', params: { id: item.id } })
    },
    async downloadPdf(item) {
      const data = {
        ...item,
        colors: ['orange', 'pink', 'indigo', 'green', 'red', 'cyan']
      }
      await generateReport(data)
    },
    // ----- Randomizer -----
    async openRandomizer() {
      this.randomizerDialog = true
      this.randomizerStep = 1
      this.wheelResult = null
      this.legistesLoading = true
      try {
        const profiles = await Profile.getAll()
        this.legistes = profiles.filter(
          p => p.activated && Array.isArray(p.permissions) && p.permissions.includes('legist')
        )
        this.selectedLegistes = this.legistes.map(l => l.id)
      } catch (err) {
        console.error(err)
      } finally {
        this.legistesLoading = false
      }
    },

    async goToWheel() {
      this.randomizerStep = 2
      this.currentRotation = 0
      this.wheelResult = null
      await this.$nextTick()
      this.drawWheel()
    },

    drawWheel() {
      const canvas = this.$refs.wheelCanvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const radius = Math.min(cx, cy) - 8

      const names = this.selectedLegistesNames
      const n = names.length
      if (n === 0) return

      const COLORS = [
        '#E91E63', '#9C27B0', '#3F51B5', '#2196F3', '#00BCD4',
        '#4CAF50', '#CDDC39', '#FF9800', '#FF5722', '#795548',
        '#607D8B', '#F44336'
      ]
      const seg = (2 * Math.PI) / n

      ctx.clearRect(0, 0, W, H)

      for (let i = 0; i < n; i++) {
        const start = i * seg + this.currentRotation
        const end = start + seg

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, radius, start, end)
        ctx.closePath()
        ctx.fillStyle = COLORS[i % COLORS.length]
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(start + seg / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = 'white'
        const fontSize = Math.max(10, Math.min(14, Math.floor(120 / n) + 6))
        ctx.font = `bold ${fontSize}px Arial, sans-serif`
        ctx.shadowColor = 'rgba(0,0,0,0.6)'
        ctx.shadowBlur = 3
        const centerPad = 24
        const edgePad = 12
        const maxW = radius - edgePad - centerPad

        // Retour à la ligne automatique
        const words = names[i].split(' ')
        const lines = []
        let currentLine = words[0]
        for (let w = 1; w < words.length; w++) {
          const testLine = currentLine + ' ' + words[w]
          if (ctx.measureText(testLine).width <= maxW) {
            currentLine = testLine
          } else {
            lines.push(currentLine)
            currentLine = words[w]
          }
        }
        lines.push(currentLine)

        // Centrage vertical des lignes
        const lineHeight = fontSize * 1.2
        const totalHeight = (lines.length - 1) * lineHeight
        const startY = -totalHeight / 2 + fontSize * 0.35
        lines.forEach((line, li) => {
          ctx.fillText(line, radius - edgePad, startY + li * lineHeight)
        })
        ctx.restore()
      }

      // Centre
      ctx.beginPath()
      ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
      ctx.fillStyle = '#212121'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    },

    spinWheel() {
      if (this.isSpinning) return
      this.isSpinning = true
      this.wheelResult = null

      const names = this.selectedLegistesNames
      const n = names.length
      const seg = (2 * Math.PI) / n
      const targetIndex = Math.floor(Math.random() * n)

      // Angle final souhaité : centre du segment targetIndex à −π/2 (haut)
      const targetFinal = -Math.PI / 2 - (targetIndex * seg + seg / 2)
      let delta = ((targetFinal - this.currentRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      if (delta < 0.1) delta += 2 * Math.PI
      const extraSpins = (6 + Math.floor(Math.random() * 5)) * 2 * Math.PI
      const totalDelta = delta + extraSpins

      const startRotation = this.currentRotation
      const duration = 5000
      const startTime = performance.now()

      const animate = (ts) => {
        const t = Math.min((ts - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - t, 4)
        this.currentRotation = startRotation + totalDelta * eased
        this.drawWheel()
        if (t < 1) {
          this._animFrame = requestAnimationFrame(animate)
        } else {
          this.currentRotation = startRotation + totalDelta
          this.isSpinning = false
          this.wheelResult = names[targetIndex]
          this.drawWheel()
        }
      }
      this._animFrame = requestAnimationFrame(animate)
    },

    resetRandomizer() {
      if (this._animFrame) {
        cancelAnimationFrame(this._animFrame)
        this._animFrame = null
      }
      this.randomizerStep = 1
      this.legistes = []
      this.selectedLegistes = []
      this.isSpinning = false
      this.currentRotation = 0
      this.wheelResult = null
    },
    // ---- fin Randomizer ----

    async deleteReport(item) {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: "Vous ne pourrez pas revenir en arrière !",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, supprimer !',
        cancelButtonText: 'Annuler'
      })

      if (result.isConfirmed) {
        try {
          await item.delete()
          Swal.fire(
            'Supprimé !',
            'Le rapport a été supprimé.',
            'success'
          )
        } catch (error) {
          console.error(error)
          Swal.fire(
            'Erreur',
            'Une erreur est survenue lors de la suppression.',
            'error'
          )
        }
      }
    }
  },

  beforeUnmount() {
    if (this._animFrame) cancelAnimationFrame(this._animFrame)
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  }
}
</script>

<style scoped>
.wheel-wrapper {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.wheel-pointer {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 13px solid transparent;
  border-right: 13px solid transparent;
  border-top: 26px solid #d32f2f;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}
</style>
