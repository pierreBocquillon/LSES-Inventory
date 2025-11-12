<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <h3 class="text-center">Autopsie :</h3>

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
      colors:['orange', 'pink', 'indigo', 'green', 'red', 'cyan'],
      name: '',
      cid: '',
      doctor: '',
      genderIsMale: false,
      injuries: [],
      selectedInjury: 0,
      draggingPoint: null,
      bloodBilan: '',
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

    this.name = 'John Doe'
    this.cid = '000-0000'
    this.doctor = 'Dr Honette Camille'
    this.injuries = [
      {
        externalAnalysis: 'BPB traverssante de 9mm',
        internalAnalysis: 'Fracture du sternum avec perforation du poumon droit',
        points: [
          {x: 145, y: 150},
          {x: 455, y: 150}
        ]
      },
      {
        externalAnalysis: 'BPB traverssante de 9mm',
        internalAnalysis: 'Fracture du sternum avec perforation du poumon droit',
        points: [
          {x: 145, y: 200},
          {x: 455, y: 200}
        ]
      },
      {
        externalAnalysis: 'BPB traverssante de 9mm',
        internalAnalysis: 'Fracture du sternum avec perforation du poumon droit',
        points: [
          {x: 145, y: 250},
          {x: 455, y: 250}
        ]
      },
      {
        externalAnalysis: 'BPB traverssante de 9mm',
        internalAnalysis: 'Fracture du sternum avec perforation du poumon droit',
        points: [
          {x: 145, y: 300},
          {x: 455, y: 300}
        ]
      },
      {
        externalAnalysis: 'BPB traverssante de 9mm',
        internalAnalysis: 'Fracture du sternum avec perforation du poumon droit',
        points: [
          {x: 145, y: 350},
          {x: 455, y: 350}
        ]
      },
      {
        externalAnalysis: 'BPB traverssante de 9mm',
        internalAnalysis: 'Fracture du sternum avec perforation du poumon droit',
        points: [
          {x: 145, y: 400},
          {x: 455, y: 400}
        ]
      },
    ]
    this.bloodBilan = `Perte de sang au-delà des seuils vitaux`
    this.diagnostic = `Quisque mattis accumsan neque non aliquet. In mollis elementum quam id laoreet. Donec pretium orci luctus, mollis felis sit amet, congue diam. Nullam ac metus blandit, dignissim odio ut, maximus tellus. Nulla lobortis diam et diam condimentum suscipit. Aliquam interdum convallis odio quis tincidunt.`
    this.interventionReport = `Duis erat ante, fringilla id laoreet eu, tempor ac risus. Proin eu justo sit amet augue placerat ultrices id in neque. Nulla quis volutpat risus, non pellentesque ligula. In lorem metus, sollicitudin convallis ultrices aliquet, tristique sit amet enim. Suspendisse quis molestie mi. Nunc felis ante, aliquet id nisi in, faucibus fermentum nunc. Sed venenatis dignissim molestie. Cras sit amet dolor tellus. Pellentesque nunc nisl, sagittis at sollicitudin in, commodo et sem. Sed a nisl ultricies, suscipit urna tristique, dignissim felis. Etiam lobortis erat sem, in facilisis ante tristique vitae. Integer eget nisl at dolor congue iaculis. Curabitur nisl enim, tristique vel elit at, porta consequat nulla. Duis aliquam turpis in pellentesque luctus. Donec posuere elit hendrerit ipsum dapibus, ut lacinia libero scelerisque. Sed faucibus sollicitudin dapibus. Curabitur pharetra quam enim, sed sodales eros rutrum at. Nulla dictum lacinia maximus. Integer luctus vitae magna ut bibendum. Vivamus convallis lacinia nibh, vitae ultrices dui dictum eu. Phasellus facilisis mauris erat, vel rutrum velit eleifend vel.`
    this.eventChronology = `Proin vestibulum dolor sit amet pellentesque maximus. Sed auctor leo ut lobortis tempor. Sed egestas, nisi at condimentum accumsan, mi enim fringilla justo, id aliquet nibh eros et turpis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi in orci leo. Fusce fringilla commodo mauris lobortis lacinia. Etiam malesuada dictum metus et gravida. Cras malesuada, lectus at condimentum porta, tortor metus viverra ligula, eu luctus purus lacus sed odio. Donec at ipsum arcu. Nullam malesuada magna ut erat semper facilisis. Nulla eu lacus magna. Sed scelerisque lectus vitae diam interdum commodo. Sed euismod dignissim mauris, rhoncus tristique elit ultrices sit amet.`
    this.autopsySummary = `Etiam in orci in ante eleifend bibendum. Ut ornare purus eget luctus lacinia. Quisque volutpat interdum sem, tempor iaculis nisl lobortis eget. Quisque molestie purus dolor, in pulvinar tortor facilisis ac. Nunc faucibus id urna vel vulputate. Vestibulum id orci in sem consectetur auctor. Aliquam viverra, ex quis ultrices auctor, leo massa bibendum felis, eu tincidunt nisi justo ut massa. Donec varius sem sed diam scelerisque congue.`
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
      async saveReport(){
        let reportData = {
          name: this.name,
          cid: this.cid,
          doctor: this.doctor,
          genderIsMale: this.genderIsMale,
          injuries: this.injuries,
          bloodBilan: this.bloodBilan,
          diagnostic: this.diagnostic,
          interventionReport: this.interventionReport,
          eventChronology: this.eventChronology,
          autopsySummary: this.autopsySummary,
        }
        console.log('Saving report data:', reportData)
      },
      async generateReport() {
        try {
          const doc = new jsPDF()
          const pageWidth = doc.internal.pageSize.getWidth()
          const pageHeight = doc.internal.pageSize.getHeight()
          const margin = 10
          const lineHeight = 7
          let yPosition = margin

          // Dark background for entire document
          const addDarkBackground = () => {
            doc.setFillColor(3, 15, 20) // #030F14
            doc.rect(0, 0, pageWidth, pageHeight, 'F')
          }

          // Header function
          const addHeader = () => {
            doc.setFillColor(0, 188, 212) // Cyan
            doc.rect(0, 0, pageWidth, 28, 'F')
            
            // Logo à gauche
            const logoImg = new Image()
            logoImg.src = require('@/assets/images/logo.png')
            doc.addImage(logoImg, 'PNG', margin, 3, 22, 22)
            
            // Texte à droite
            doc.setTextColor(3, 15, 20)
            doc.setFontSize(17)
            doc.setFont('helvetica', 'bold')
            doc.text('Los Santos Emergency Services', pageWidth - margin, 12, { align: 'right' })
            doc.setFontSize(14)
            doc.setFont('helvetica', 'normal')
            doc.text('RAPPORT D\'AUTOPSIE', pageWidth - margin, 20, { align: 'right' })
          }

          // Helper function to add text with word wrap
          const addText = (text, fontSize = 10, isBold = false) => {
            doc.setFontSize(fontSize)
            doc.setFont('helvetica', isBold ? 'bold' : 'normal')
            const lines = doc.splitTextToSize(text, pageWidth - 2 * margin)
            
            lines.forEach(line => {
              if (yPosition > pageHeight - margin) {
                doc.addPage()
                addDarkBackground()
                addHeader()
                yPosition = 38
              }
              doc.text(line, margin, yPosition)
              yPosition += lineHeight
            })
          }

          // First page dark background
          addDarkBackground()

          // Header
          addHeader()
          
          doc.setTextColor(255, 255, 255) // White text for dark theme
          yPosition = 38

          // Identité
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('Victime :', margin, yPosition)
          doc.setFont('helvetica', 'normal')
          doc.text(` ${this.name} (${this.cid})`, margin + 4 + doc.getTextWidth('Victime :'), yPosition)
          yPosition += 8

          // Médecin légiste
          doc.setFont('helvetica', 'bold')
          doc.text('Médecin légiste :', margin, yPosition)
          doc.setFont('helvetica', 'normal')
          doc.text(` Dr ${this.userStore.profile?.name}`, margin + 4 + doc.getTextWidth('Médecin légiste :'), yPosition)
          yPosition += 8

          // Médecin intervenant
          doc.setFont('helvetica', 'bold')
          doc.text('Médecin intervenant :', margin, yPosition)
          doc.setFont('helvetica', 'normal')
          doc.text(` ${this.doctor}`, margin + 4 + doc.getTextWidth('Médecin intervenant :'), yPosition)
          yPosition += 15

          // Schéma et Blessures côte à côte
          const startY = yPosition
          const leftColX = margin
          const leftColWidth = (pageWidth - 2 * margin) / 3
          const rightColX = margin + leftColWidth + 10
          const rightColWidth = ((pageWidth - 2 * margin) * 2 / 3) - 10
          
          // Left column: Blessures
          let leftYPosition = startY
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('Blessures :', leftColX, leftYPosition)
          leftYPosition += 10
          
          this.injuries.forEach((injury, index) => {
            if (leftYPosition > pageHeight - margin - 30) {
              doc.addPage()
              addDarkBackground()
              addHeader()
              leftYPosition = 38
            }
            
            const rgb = this.getColorRGB(this.colors[index])
            doc.setTextColor(rgb[0], rgb[1], rgb[2])
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text(`Blessure #${index + 1}`, leftColX, leftYPosition)
            leftYPosition += 6
            
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            
            if (injury.externalAnalysis) {
              const extLines = doc.splitTextToSize(`Externe: ${injury.externalAnalysis}`, leftColWidth)
              extLines.forEach(line => {
                if (leftYPosition > pageHeight - margin) {
                  doc.addPage()
                  addDarkBackground()
                  addHeader()
                  leftYPosition = 54
                }
                doc.text(line, leftColX, leftYPosition)
                leftYPosition += 5
              })
            }
            
            if (injury.internalAnalysis) {
              const intLines = doc.splitTextToSize(`Interne: ${injury.internalAnalysis}`, leftColWidth)
              intLines.forEach(line => {
                if (leftYPosition > pageHeight - margin) {
                  doc.addPage()
                  addDarkBackground()
                  addHeader()
                  leftYPosition = 54
                }
                doc.text(line, leftColX, leftYPosition)
                leftYPosition += 5
              })
            }
            
            leftYPosition += 5
          })

          // Right column: Schéma corporel
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('Schéma corporel :', rightColX, startY)
          
          const canvas = this.$refs.canvasElement
          const imgData = canvas.toDataURL('image/png')
          const imgWidth = rightColWidth
          const imgHeight = rightColWidth
          
          doc.addImage(imgData, 'PNG', rightColX, startY + 10, imgWidth, imgHeight)
          
          // Continue après les deux colonnes
          yPosition = Math.max(leftYPosition, startY + 10 + imgHeight + 10)

          // Bilan sanguin
          if (yPosition > pageHeight - margin - 30) {
            doc.addPage()
            addDarkBackground()
            addHeader()
            yPosition = 38
          }
          doc.setTextColor(255, 255, 255)
          yPosition += 3
          addText('Bilan sanguin :', 12, true)
          yPosition += 3
          if (this.bloodBilan) {
            addText(this.bloodBilan, 10)
          }
          yPosition += 5

          // Diagnostic médical
          if (yPosition > pageHeight - margin - 30) {
            doc.addPage()
            addDarkBackground()
            addHeader()
            yPosition = 38
          }
          doc.setTextColor(255, 255, 255)
          
          addText('Diagnostic médical :', 12, true)
          yPosition += 3
          if (this.diagnostic) {
            addText(this.diagnostic, 10)
          }
          yPosition += 5

          // Rapport d'intervention
          if (yPosition > pageHeight - margin - 30) {
            doc.addPage()
            addDarkBackground()
            addHeader()
            yPosition = 38
          }
          doc.setTextColor(255, 255, 255)
          
          addText('Rapport d\'intervention :', 12, true)
          yPosition += 3
          if (this.interventionReport) {
            addText(this.interventionReport, 10)
          }
          yPosition += 5

          // Chronologie des événements
          if (yPosition > pageHeight - margin - 30) {
            doc.addPage()
            addDarkBackground()
            addHeader()
            yPosition = 38
          }
          doc.setTextColor(255, 255, 255)
          
          addText('Chronologie probable des événements :', 12, true)
          yPosition += 3
          if (this.eventChronology) {
            addText(this.eventChronology, 10)
          }
          yPosition += 5

          // Bilan de l'autopsie
          // Vérifier s'il y a assez d'espace pour le bilan, la signature et le stamp (environ 150px)
          const bilanLines = this.autopsySummary ? doc.splitTextToSize(this.autopsySummary, pageWidth - 2 * margin) : []
          const bilanHeight = 12 + 3 + (bilanLines.length * lineHeight) + 15 + 60 // titre + marge + contenu + marge + signature+stamp
          
          if (yPosition + bilanHeight > pageHeight - margin) {
            doc.addPage()
            addDarkBackground()
            addHeader()
            yPosition = 38
          }
          
          doc.setTextColor(255, 255, 255)
          addText('Bilan de l\'autopsie :', 12, true)
          yPosition += 3
          if (this.autopsySummary) {
            addText(this.autopsySummary, 10)
          }

          // Signature
          yPosition += 15
          
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          doc.text('Signature :', margin, yPosition, { align: 'left' })
          
          // Signature manuscrite avec rotation
          yPosition += 20
          
          // Charger la font Caveat
          const caveatFont = require('@/assets/fonts/Caveat-Regular.ttf')
          const caveatBase64 = await fetch(caveatFont).then(res => res.arrayBuffer()).then(buffer => {
            const binary = Array.from(new Uint8Array(buffer))
              .map(byte => String.fromCharCode(byte))
              .join('')
            return btoa(binary)
          })
          doc.addFileToVFS('Caveat-Regular.ttf', caveatBase64)
          doc.addFont('Caveat-Regular.ttf', 'Caveat', 'normal')
          
          doc.setFontSize(32)
          doc.setFont('Caveat', 'normal')
          const signature = this.userStore.profile?.name || 'Médecin légiste'
          
          // Appliquer rotation de 5 degrés antihoraire
          const angle = 5 * Math.PI / 180
          const x = margin + 10
          const y = yPosition
          doc.saveGraphicsState()
          doc.setTextColor(255, 255, 255)
          
          // Transformer: translate -> rotate -> translate back
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)
          doc.text(signature, x, y, { 
            angle: 5,
            align: 'left' 
          })
          doc.restoreGraphicsState()

          // Stamp image à droite avec rotation de 20° sens horaire
          const stampImg = new Image()
          stampImg.src = require('@/assets/images/stamp_white.png')
          const stampWidth = 50
          const stampHeight = 50
          const stampX = x + 70
          const stampY = y - 40
          
          // Ajouter l'image avec rotation et opacité 80%
          doc.saveGraphicsState()
          doc.setGState(new doc.GState({ opacity: 0.8 }))
          doc.addImage(stampImg, 'PNG', stampX, stampY, stampWidth, stampHeight, undefined, undefined, -20)
          doc.restoreGraphicsState()

          // Footer
          const totalPages = doc.internal.pages.length - 1
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i)
            
            // Ajouter l'en-tête sur toutes les pages sauf la première
            if (i > 1) {
              addHeader()
            }
            
            doc.setFontSize(9)
            doc.setTextColor(180, 180, 180)
            const date = new Date().toLocaleDateString('fr-FR')
            const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            doc.text(`Fait le ${date} à ${time}`, margin, pageHeight - 10)
            doc.text(`${this.name} (${this.cid})`, pageWidth / 2, pageHeight - 10, { align: 'center' })
            doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
          }

          // Save PDF
          const civility = this.genderIsMale ? 'Mr' : 'Mme'
          const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
          const fileName = `LSES - Rapport d'autopsie ${civility} ${this.name} (${this.cid}) - ${date}.pdf`
          doc.save(fileName)
        } catch (error) {
          console.error('Erreur lors de la génération du PDF:', error)
          Swal.fire('Erreur', 'Une erreur est survenue lors de la génération du rapport.', 'error')
        }
      },
      getColorRGB(colorName) {
        const colorMap = {
          'orange': [255, 152, 0],
          'pink': [233, 30, 99],
          'indigo': [63, 81, 181],
          'green': [76, 175, 80],
          'red': [244, 67, 54],
          'cyan': [0, 188, 212],
        }
        return colorMap[colorName] || [0, 0, 0]
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
