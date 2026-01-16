import { jsPDF } from 'jspdf'
import vuetifyColors from 'vuetify/lib/util/colors'
import Swal from 'sweetalert2/dist/sweetalert2.js'

function getColorRGB(colorName) {
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

async function generateCanvas(data) {
  const { injuries, genderIsMale } = data
  const colorsList = data.colors || ['orange', 'pink', 'indigo', 'green', 'red', 'cyan']
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.src = require(`@/assets/images/${genderIsMale ? 'Homme' : 'Femme'}.svg`)

  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = 600
      canvas.height = 600
      ctx.drawImage(img, 0, 0)

      injuries.forEach((injury, index) => {
        const colorKey = colorsList[index]
        const colorHex = vuetifyColors[colorKey]?.base || colorKey

        ctx.fillStyle = colorHex
        injury.points.forEach(point => {
          ctx.beginPath()
          ctx.arc(point.x, point.y, 6.5, 0, 2 * Math.PI)
          ctx.fill()
        })
        
        if (injury.points.length > 0) {
          const avgY = injury.points.reduce((sum, p) => sum + p.y, 0) / injury.points.length
          const centerX = canvas.width / 2
          
          let labelY = avgY
          const labelRadius = 14
          const minSpacing = labelRadius * 2 + 5 
          
          const usedPositions = []
          for (let i = 0; i < index; i++) {
            if (injuries[i].points.length > 0) {
              const otherAvgY = injuries[i].points.reduce((sum, p) => sum + p.y, 0) / injuries[i].points.length
              let adjustedY = otherAvgY
              for (const usedY of usedPositions) {
                if (Math.abs(adjustedY - usedY) < minSpacing) {
                  adjustedY = usedY + minSpacing
                }
              }
              usedPositions.push(adjustedY)
            }
          }
          
          for (const usedY of usedPositions) {
            if (Math.abs(labelY - usedY) < minSpacing) {
              labelY = usedY + minSpacing
            }
          }
          
          if (labelY < labelRadius + 5) labelY = labelRadius + 5
          if (labelY > canvas.height - labelRadius - 5) labelY = canvas.height - labelRadius - 5
          
          ctx.strokeStyle = colorHex
          ctx.fillStyle = colorHex
          ctx.lineWidth = 1.5
          
          injury.points.forEach(point => {
            const dx = point.x - centerX
            const dy = point.y - labelY
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            const ndx = dx / distance
            const ndy = dy / distance
            
            const startX = centerX + ndx * (labelRadius + 5)
            const startY = labelY + ndy * (labelRadius + 5)
            
            const arrowHeadLength = 10
            const arrowHeadWidth = Math.PI / 8
            const endX = point.x - ndx * (6.5 + 5 + arrowHeadLength)
            const endY = point.y - ndy * (6.5 + 5 + arrowHeadLength)
            
            ctx.beginPath()
            ctx.moveTo(startX, startY)
            ctx.lineTo(endX, endY)
            ctx.stroke()
            
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
          
          ctx.fillStyle = colorHex
          ctx.beginPath()
          ctx.arc(centerX, labelY, labelRadius, 0, 2 * Math.PI)
          ctx.fill()
          
          ctx.fillStyle = '#000000'
          ctx.font = 'bold 17px Arial' 
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(index + 1, centerX, labelY)
        }
      })
      resolve(canvas)
    }
    img.onerror = () => resolve(canvas)
  })
}

export async function generateReport(data, canvasElement = null) {
  let finalCanvas = canvasElement
  if (!finalCanvas) {
    finalCanvas = await generateCanvas(data)
  }

  const { 
    name, 
    cid, 
    genderIsMale, 
    doctor, 
    legist, 
    injuries, 
    bloodBilan, 
    diagnostic, 
    interventionReport, 
    eventChronology, 
    autopsySummary, 
    autopsyDate,
    colors
  } = data

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
    doc.text(` ${name} (${cid})`, margin + 4 + doc.getTextWidth('Victime :'), yPosition)
    yPosition += 8

    // Médecin légiste
    doc.setFont('helvetica', 'bold')
    doc.text('Médecin légiste :', margin, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(` Dr ${legist}`, margin + 4 + doc.getTextWidth('Médecin légiste :'), yPosition)
    yPosition += 8

    // Médecin intervenant
    doc.setFont('helvetica', 'bold')
    doc.text('Médecin intervenant :', margin, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(` ${doctor}`, margin + 4 + doc.getTextWidth('Médecin intervenant :'), yPosition)
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
    
    injuries.forEach((injury, index) => {
      if (leftYPosition > pageHeight - margin - 30) {
        doc.addPage()
        addDarkBackground()
        addHeader()
        leftYPosition = 38
      }
      
      const rgb = getColorRGB(colors[index])
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
    
    // Canvas passed as argument
    const imgData = finalCanvas.toDataURL('image/png')
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
    if (bloodBilan) {
      addText(bloodBilan, 10)
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
    if (diagnostic) {
      addText(diagnostic, 10)
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
    if (interventionReport) {
      addText(interventionReport, 10)
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
    if (eventChronology) {
      addText(eventChronology, 10)
    }
    yPosition += 5

    // Bilan de l'autopsie
    // Vérifier s'il y a assez d'espace pour le bilan, la signature et le stamp (environ 150px)
    const bilanLines = autopsySummary ? doc.splitTextToSize(autopsySummary, pageWidth - 2 * margin) : []
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
    if (autopsySummary) {
      addText(autopsySummary, 10)
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
    const signature = legist || 'Médecin légiste'
    
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
      const dateStr = new Date(autopsyDate).toLocaleDateString('fr-FR')
      const timeStr = new Date(autopsyDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      doc.text(`Fait le ${dateStr} à ${timeStr}`, margin, pageHeight - 10)
      doc.text(`${name} (${cid})`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
    }

    // Save PDF
    const civility = genderIsMale ? 'Mr' : 'Mme'
    const dateFile = new Date(autopsyDate).toLocaleDateString('fr-FR').replace(/\//g, '-')
    const fileName = `LSES - Rapport d'autopsie ${civility} ${name} (${cid}) - ${dateFile}.pdf`
    doc.save(fileName)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    Swal.fire('Erreur', 'Une erreur est survenue lors de la génération du rapport.', 'error')
  }
}
