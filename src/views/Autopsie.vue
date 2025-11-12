<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Autopsie :</h3>

      <v-row class="mt-3" justify="center">
        <v-col cols="12">
          <v-card class="bg-background pa-3 mb-3">
            <h3>Identité :</h3>
            <div class="d-flex flex-row align-center justify-center">
              <v-text-field label="Nom" class="mx-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="name"></v-text-field>
              <v-text-field label="CID" class="mx-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="cid"></v-text-field>
            </div>
            <div class="d-flex flex-row align-center justify-center">
              <h3 class="text-cyan">Femme</h3>
              <v-switch color="cyan" base-color="cyan" class="px-3" hide-details v-model="genderIsMale"></v-switch>
              <h3 class="text-cyan">Homme</h3>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-3" justify="center">
        <v-col cols="12" md="4"  style="height:728px;">
          <v-card class="bg-background pa-3 h-100" style="overflow-y:auto;">
            <div class="d-flex flex-row align-center justify-space-between flex-wrap">
              <h3>Blessures :</h3>
              <v-btn density="compact" variant="tonal" color="cyan" @click="addInjury">
                <p>🩹 Ajouter</p>
              </v-btn>
              <v-btn density="compact" variant="tonal" color="cyan" @click="deleteInjury(selectedInjury)" :disabled="selectedInjury==null || injuries.length <= 1">
                <p>❌ Supprimer</p>
              </v-btn>
            </div>
            <div class="py-2" v-for="(injury, index) in injuries" :key="index">
              <span class="d-flex flex-row align-center justify-start">
                <h2 :class="`text-on-surface bg-${colors[index]} rounded-circle d-flex align-center justify-center cursor-pointer`" :style="'width: '+(selectedInjury==index?'60':'40')+'px; height: '+(selectedInjury==index?'60':'40')+'px;'+(selectedInjury==index?'border:white 3px solid;':'')" @click="selectedInjury = index">{{index + 1}}</h2>
                <v-divider vertical :color="colors[index]" thickness="2" class="mx-3 border-opacity-100"></v-divider>
                <div class="d-flex flex-column align-center justify-start w-100">
                  <v-textarea rows="2" label="Annalyse externe" class="my-1 w-100" :color="colors[index]" :base-color="colors[index]" variant="outlined" hide-details v-model="injury.externalAnalysis"></v-textarea>
                  <v-textarea rows="2" label="Annalyse interne" class="my-1 w-100" :color="colors[index]" :base-color="colors[index]" variant="outlined" hide-details v-model="injury.internalAnalysis"></v-textarea>
                </div>
              </span>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="8">
          <v-card class="bg-background py-3 d-flex flex-row align-center justify-center mb-3">
            <v-btn class="ma-1" :color="tool==='add' ? 'cyan' : 'grey'" variant="tonal" @click="tool='add'">✏️ Ajouter une annotation</v-btn>
            <v-btn class="ma-1" :color="tool==='move' ? 'cyan' : 'grey'" variant="tonal" @click="tool='move'">✋ Bouger une annotation</v-btn>
            <v-btn class="ma-1" :color="tool==='delete' ? 'cyan' : 'grey'" variant="tonal" @click="tool='delete'">❌ Supprimer une annotation</v-btn>
          </v-card>
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-center">
            <canvas ref="canvasElement" @mousedown="useTool" @mousemove="useTool" @mouseup="useTool"></canvas>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="3" label="Diagnostique médical" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="diagnostic"></v-textarea>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="5" label="Rapport d'intervention" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="interventionReport"></v-textarea>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="5" label="Chronologie probable des évènements" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="eventChronology"></v-textarea>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="3" label="Bilan de l'autopsie" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="autopsySummary"></v-textarea>
          </v-card>
          <div class="mt-5 d-flex align-center justify-center">
            <v-btn color="cyan" size="x-large" variant="tonal" @click="generateReport">Generer le rapport</v-btn>
          </div>
        </v-col>
      </v-row>

    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import colors from 'vuetify/lib/util/colors'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import logger from '../functions/logger'
import { jsPDF } from 'jspdf'

export default {
  props : [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      headers: [
        { title: 'Nom', key: 'name', align: 'start' },
        { title: '', key: 'actions', align: 'end', sortable: false },
      ],
      themeColors: colors,
      tool: 'add',
      colors:['orange','pink','green','indigo','white','purple','red','brown','cyan','lime'],
      name: '',
      cid: '',
      genderIsMale: false,
      injuries: [],
      selectedInjury: 0,
      draggingPoint: null,
      diagnostic: '',
      interventionReport: '',
      eventChronology: '',
      autopsySummary: '',
    }
  },

  mounted() {
    this.injuries = [{
      externalAnalysis: '',
      internalAnalysis: '',
      points: []
    }]
    this.drawCanvas()
  },

  watch: {
    genderIsMale(){
      this.drawCanvas()
    }
  },

  methods: {
    drawCanvas() {
      const canvas = this.$refs.canvasElement
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.src = require(`@/assets/images/${this.genderIsMale ? 'Homme' : 'Femme'}.svg`)
      img.onload = () => {
        canvas.width = 600
        canvas.height = 600
        ctx.drawImage(img, 0, 0)

        this.injuries.forEach((injury, index) => {
          ctx.fillStyle = this.themeColors[this.colors[index]]?.base ?? this.colors[index]
          injury.points.forEach(point => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI)
            ctx.fill()
          })
        })
      }
    },
    useTool(evt) {
      let posX = evt.offsetX
      let posY = evt.offsetY

      switch(this.tool){
        case 'add':
          if (evt.type === 'mousedown') {
            this.injuries[this.selectedInjury].points.push({x: posX, y: posY})
            this.drawCanvas()
          }
          break
        case 'move':
          // Logic to move (drag and drop) the closest injury point from ANY injury if distance < 10 px
          if (evt.type === 'mousedown') {
            // Find closest point within 10px across all injuries
            let closestPoint = null
            let minDistance = 10
            this.injuries.forEach(injury => {
              injury.points.forEach(point => {
                const distance = Math.sqrt((point.x - posX) ** 2 + (point.y - posY) ** 2)
                if (distance < minDistance) {
                  minDistance = distance
                  closestPoint = point
                }
              })
            })
            if (closestPoint) {
              this.draggingPoint = closestPoint
            }
          } else if (evt.type === 'mousemove' && this.draggingPoint) {
            this.draggingPoint.x = posX
            this.draggingPoint.y = posY
            this.drawCanvas()
          } else if (evt.type === 'mouseup' && this.draggingPoint) {
            this.draggingPoint.x = posX
            this.draggingPoint.y = posY
            this.draggingPoint = null
            this.drawCanvas()
          }
          break
        case 'delete':
          if (evt.type === 'mousedown') {
            // Logic to delete the closest injury point from ANY injury
            let closestIndex = -1
            let closestInjury = -1
            let minDist = 10
            this.injuries.forEach((injury, injuryIdx) => {
              injury.points.forEach((point, idx) => {
                const distance = Math.sqrt((point.x - posX) ** 2 + (point.y - posY) ** 2)
                if (distance < minDist) {
                  minDist = distance
                  closestIndex = idx
                  closestInjury = injuryIdx
                }
              })
            })
            if (closestIndex !== -1 && closestInjury !== -1) {
              this.injuries[closestInjury].points.splice(closestIndex, 1)
              this.drawCanvas()
            }
          }
          break
      }
    },
      addInjury() {
        if (this.injuries.length >= this.colors.length) {
          Swal.fire('Erreur', "Nombre maximum de blessures atteint.", 'error')
          return
        }
        this.injuries.push({
          externalAnalysis: '',
          internalAnalysis: '',
          points: []
        })
      },
      deleteInjury(index) {
        if (this.injuries.length <= 1) {
          Swal.fire('Erreur', "Il doit y avoir au moins une blessure.", 'error')
          return
        }
        this.injuries.splice(index, 1)
        if (this.selectedInjury >= this.injuries.length) {
          this.selectedInjury = this.injuries.length - 1
        }
        this.drawCanvas()
      },
      generateReport() {
        
      }
    },

    beforeUnmount() {
      this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  }
}
</script>
