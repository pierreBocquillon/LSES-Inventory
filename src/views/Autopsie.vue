<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100" style="overflow-y: auto;">

      <div class="d-flex align-center justify-center position-relative mb-3">
        <v-btn
          style="position: absolute; left: 0;"
          color="secondary"
          variant="tonal"
          prepend-icon="mdi-arrow-left"
          @click="$router.push({ name: 'Rapport d\'autopsie' })"
        >Retour</v-btn>
        <h3>Autopsie :</h3>
      </div>

      <v-row class="mt-3" justify="center">
        <v-col cols="12">
          <v-card class="bg-background pa-3 mb-3">
            <h3 class="mb-3">Victime :</h3>
            <div class="mb-3 d-flex flex-row align-center justify-center">
              <v-text-field label="Nom" class="mx-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="name"></v-text-field>
              <v-text-field label="CID" class="mx-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="cid"></v-text-field>
            </div>
            <div class="mb-3 d-flex flex-row align-center justify-center">
              <h3 class="text-cyan">Femme</h3>
              <v-switch color="cyan" base-color="cyan" class="px-3" hide-details v-model="genderIsMale"></v-switch>
              <h3 class="text-cyan">Homme</h3>
            </div>
            <h3 class="mb-3">Médecin intervenant :</h3>
            <div class="d-flex flex-row align-center justify-center">
              <v-text-field label="Nom" class="mx-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="doctor"></v-text-field>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-3" justify="center">
        <v-col cols="12" md="4"  style="height:calc(728px + 180px);">
          <v-card class="bg-background pa-3 h-100">
            <div class="d-flex flex-row align-center justify-space-between flex-wrap" style="height:50px;">
              <h3>Blessures :</h3>
              <v-btn density="compact" variant="tonal" color="cyan" @click="addInjury">
                <p>🩹 Ajouter</p>
              </v-btn>
              <v-btn density="compact" variant="tonal" color="cyan" @click="deleteInjury(selectedInjury)" :disabled="selectedInjury==null || injuries.length <= 1">
                <p>❌ Supprimer</p>
              </v-btn>
            </div>
            <div style="height: calc(100% - 50px); overflow-y:auto;">
              <div class="py-2" v-for="(injury, index) in injuries" :key="index">
                <span class="d-flex flex-row align-center justify-start">
                  <h2 :class="`text-on-surface bg-${colors[index]} rounded d-flex align-center justify-center cursor-pointer`" :style="'width: '+(selectedInjury==index?'70':'50')+'px; height: 170px;'+(selectedInjury==index?'border:white 3px solid;':'')" @click="selectedInjury = index">{{index + 1}}</h2>
                  <div class="ml-1 d-flex flex-column align-center justify-start w-100">
                    <v-textarea rows="2" no-resize label="Analyse externe" class="my-1 w-100" :color="colors[index]" :base-color="colors[index]" variant="outlined" hide-details v-model="injury.externalAnalysis"></v-textarea>
                    <v-textarea rows="2" no-resize label="Analyse interne" class="my-1 w-100" :color="colors[index]" :base-color="colors[index]" variant="outlined" hide-details v-model="injury.internalAnalysis"></v-textarea>
                  </div>
                </span>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="8" class="h-100">
          <v-card class="bg-background py-3 d-flex flex-row align-center justify-center mb-3">
            <v-btn class="ma-1" :color="tool==='add' ? 'cyan' : 'grey'" variant="tonal" @click="tool='add'">✏️ Ajouter une annotation</v-btn>
            <v-btn class="ma-1" :color="tool==='move' ? 'cyan' : 'grey'" variant="tonal" @click="tool='move'">✋ Bouger une annotation</v-btn>
            <v-btn class="ma-1" :color="tool==='delete' ? 'cyan' : 'grey'" variant="tonal" @click="tool='delete'">❌ Supprimer une annotation</v-btn>
          </v-card>
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-center">
            <canvas ref="canvasElement" @mousedown="useTool" @mousemove="useTool" @mouseup="useTool"></canvas>
          </v-card>
          <v-card class="bg-background mt-5 pa-3" style="overflow-y:auto;">
            <div class="d-flex flex-row align-center justify-space-between flex-wrap">
              <v-textarea rows="4" label="Bilan sanguin" no-resize class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="bloodBilan"></v-textarea>
            </div>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="4" no-resize label="Diagnostique médical" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="diagnostic"></v-textarea>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="10" no-resize label="Rapport d'intervention" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="interventionReport"></v-textarea>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="10" no-resize label="Chronologie probable des évènements" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="eventChronology"></v-textarea>
          </v-card>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-card class="bg-background pa-3 d-flex flex-row align-center justify-start">
            <v-textarea rows="5" no-resize label="Bilan de l'autopsie" class="my-1 w-100" color="cyan" base-color="cyan" variant="outlined" hide-details v-model="autopsySummary"></v-textarea>
          </v-card>
          <div class="mt-5 d-flex align-center justify-center">
            <v-btn color="primary" class="mx-3" size="x-large" variant="tonal" @click="saveReport">Sauvegarder le rapport</v-btn>
            <v-btn color="cyan" class="mx-3" size="x-large" variant="tonal" @click="generateReport">Generer le rapport en PDF</v-btn>
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

import Autopsie from '../classes/Autopsie.js'

import logger from '../functions/logger'
import { generateReport } from '../functions/autopsieManager'

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
      colors:['orange', 'pink', 'indigo', 'green', 'red', 'cyan'],
      name: '',
      cid: '',
      doctor: '',
      genderIsMale: false,
      legist: '',
      injuries: [],
      selectedInjury: 0,
      draggingPoint: null,
      bloodBilan: '',
      diagnostic: '',
      interventionReport: '',
      eventChronology: '',
      autopsySummary: '',
      autopsyDate: 0,
    }
  },

  mounted() {
    if(this.$route.params.id){
      this.loadReport(this.$route.params.id)
    } else {
      this.resetForm()
    }
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
            ctx.arc(point.x, point.y, 6.5, 0, 2 * Math.PI)
            ctx.fill()
          })
          
          // Calculer la position du numéro (centre en x, moyenne des y)
          if (injury.points.length > 0) {
            const avgY = injury.points.reduce((sum, p) => sum + p.y, 0) / injury.points.length
            const centerX = canvas.width / 2
            
            // Ajuster la position Y pour éviter les chevauchements
            let labelY = avgY
            const labelRadius = 14
            const minSpacing = labelRadius * 2 + 5 // Espace minimum entre les numéros
            
            // Créer un tableau des positions Y déjà utilisées
            const usedPositions = []
            for (let i = 0; i < index; i++) {
              if (this.injuries[i].points.length > 0) {
                const otherAvgY = this.injuries[i].points.reduce((sum, p) => sum + p.y, 0) / this.injuries[i].points.length
                // Calculer la position Y ajustée pour les blessures précédentes
                let adjustedY = otherAvgY
                for (const usedY of usedPositions) {
                  if (Math.abs(adjustedY - usedY) < minSpacing) {
                    adjustedY = usedY + minSpacing
                  }
                }
                usedPositions.push(adjustedY)
              }
            }
            
            // Ajuster la position actuelle pour éviter tous les chevauchements
            for (const usedY of usedPositions) {
              if (Math.abs(labelY - usedY) < minSpacing) {
                labelY = usedY + minSpacing
              }
            }
            
            // S'assurer que le label reste dans les limites du canvas
            if (labelY < labelRadius + 5) labelY = labelRadius + 5
            if (labelY > canvas.height - labelRadius - 5) labelY = canvas.height - labelRadius - 5
            
            // Dessiner les traits reliant les points au numéro avec flèches
            ctx.strokeStyle = this.themeColors[this.colors[index]]?.base ?? this.colors[index]
            ctx.fillStyle = this.themeColors[this.colors[index]]?.base ?? this.colors[index]
            ctx.lineWidth = 1.5
            
            injury.points.forEach(point => {
              // Calculer la direction du centre vers le point
              const dx = point.x - centerX
              const dy = point.y - labelY
              const distance = Math.sqrt(dx * dx + dy * dy)
              
              // Normaliser la direction
              const ndx = dx / distance
              const ndy = dy / distance
              
              // Point de départ (5px depuis le bord du cercle du numéro)
              const startX = centerX + ndx * (labelRadius + 5)
              const startY = labelY + ndy * (labelRadius + 5)
              
              // Point d'arrivée (5px avant le point d'annotation)
              const arrowHeadLength = 10
              const arrowHeadWidth = Math.PI / 8 // Angle de la pointe (22.5 degrés de chaque côté) - plus étroit
              const endX = point.x - ndx * (6.5 + 5 + arrowHeadLength)
              const endY = point.y - ndy * (6.5 + 5 + arrowHeadLength)
              
              // Dessiner la ligne
              ctx.beginPath()
              ctx.moveTo(startX, startY)
              ctx.lineTo(endX, endY)
              ctx.stroke()
              
              // Dessiner la pointe de flèche (triangle)
              const angle = Math.atan2(dy, dx)
              const arrowTipX = point.x - ndx * (6.5 + 5)
              const arrowTipY = point.y - ndy * (6.5 + 5)
              
              ctx.beginPath()
              ctx.moveTo(arrowTipX, arrowTipY)
              ctx.lineTo(
                arrowTipX - Math.cos(angle - arrowHeadWidth) * arrowHeadLength,
                arrowTipY - Math.sin(angle - arrowHeadWidth) * arrowHeadLength
              )
              ctx.lineTo(
                arrowTipX - Math.cos(angle + arrowHeadWidth) * arrowHeadLength,
                arrowTipY - Math.sin(angle + arrowHeadWidth) * arrowHeadLength
              )
              ctx.closePath()
              ctx.fill()
            })
            
            // Dessiner le numéro avec un fond (réduit de 30%: 20 -> 14)
            ctx.fillStyle = this.themeColors[this.colors[index]]?.base ?? this.colors[index]
            ctx.beginPath()
            ctx.arc(centerX, labelY, labelRadius, 0, 2 * Math.PI)
            ctx.fill()
            
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 17px Arial' // Réduit de 30%: 24 -> 17
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(index + 1, centerX, labelY)
          }
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
      async loadReport(id){
        const report = await Autopsie.getById(id)
        this.name = report.name
        this.cid = report.cid
        this.genderIsMale = report.genderIsMale
        this.doctor = report.doctor
        this.legist = report.legist
        this.injuries = report.injuries
        this.bloodBilan = report.bloodBilan
        this.diagnostic = report.diagnostic
        this.interventionReport = report.interventionReport
        this.eventChronology = report.eventChronology
        this.autopsySummary = report.autopsySummary
        this.autopsyDate = report.autopsyDate
        this.drawCanvas()
      },
      resetForm(){
        this.injuries = [{
          externalAnalysis: '',
          internalAnalysis: '',
          points: []
        }]
        this.drawCanvas()

        this.name = ''
        this.cid = ''
        this.genderIsMale = false
        this.doctor = ''
        this.legist = this.userStore.profile?.name || ''
        this.injuries = [
          {
            externalAnalysis: '',
            internalAnalysis: '',
            points: [
            ]
          },
        ]
        this.bloodBilan = ``
        this.diagnostic = ``
        this.interventionReport = ``
        this.eventChronology = ``
        this.autopsySummary = ``
        this.autopsyDate = new Date().getTime()
      },
      async saveReport(){
        let report = Autopsie.initOne()

        if(this.$route.params.id){
          report.id = this.$route.params.id
        }

        report.name = this.name
        report.cid = this.cid
        report.genderIsMale = this.genderIsMale
        report.doctor = this.doctor
        report.legist = this.legist
        report.injuries = this.injuries
        report.bloodBilan = this.bloodBilan
        report.diagnostic = this.diagnostic
        report.interventionReport = this.interventionReport
        report.eventChronology = this.eventChronology
        report.autopsySummary = this.autopsySummary
        report.autopsyDate = new Date().getTime()

        await report.save()
        this.$router.push('/autopsie-reports')
      },
      async generateReport() {
        const data = {
          name: this.name,
          cid: this.cid,
          genderIsMale: this.genderIsMale,
          doctor: this.doctor,
          legist: this.legist,
          injuries: this.injuries,
          bloodBilan: this.bloodBilan,
          diagnostic: this.diagnostic,
          interventionReport: this.interventionReport,
          eventChronology: this.eventChronology,
          autopsySummary: this.autopsySummary,
          autopsyDate: this.autopsyDate,
          colors: this.colors
        }
        await generateReport(data, this.$refs.canvasElement)
      },
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
