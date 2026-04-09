import { jsPDF } from 'jspdf'
import Swal from 'sweetalert2/dist/sweetalert2.js'

export async function generateDismissalPDF(data) {
  const { employee, reason, type, issuer, preview, customSignature } = data
  const { name, phone } = employee
  const reportDate = new Date().toLocaleDateString('fr-FR')

  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPosition = 50

    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setFillColor(255, 193, 7)
    doc.rect(0, 0, pageWidth, 35, 'F')

    try {
      const logoImg = new Image()
      logoImg.src = require('@/assets/images/logo.png')
      doc.addImage(logoImg, 'PNG', margin, 5, 25, 25)
    } catch (e) { console.error('Logo not found') }

    doc.setTextColor(33, 33, 33)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('L.S.E.S', pageWidth - margin, 18, { align: 'right' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('LOS SANTOS EMERGENCY SERVICES', pageWidth - margin, 26, { align: 'right' })

    doc.setTextColor(33, 33, 33)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(name, margin, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`Tél : ${phone || 'N/A'}`, margin, yPosition + 7)

    const isDirection = data.signerService === 'direction'
    const serviceTitleTop = isDirection ? 'Direction du LSES' : 'Ressources Humaines'
    const serviceTitleSign = isDirection ? 'La Direction du LSES,' : 'Les Ressources Humaines,'

    doc.setFont('helvetica', 'normal')
    doc.text(serviceTitleTop, pageWidth - margin, yPosition, { align: 'right' })
    doc.text('Zip 8040', pageWidth - margin, yPosition + 7, { align: 'right' })
    doc.text('555-LSES', pageWidth - margin, yPosition + 14, { align: 'right' })

    yPosition += 35

    doc.setFont('helvetica', 'normal')
    doc.text(`Le ${reportDate}`, pageWidth - margin, yPosition, { align: 'right' })
    yPosition += 20

    const subjects = {
      'simple_fault': "Notification d'avertissement - Faute simple",
      'serious_fault': "Notification de rupture de contrat - Faute lourde",
      'summons': "Convocation à un entretien",
      'suspension': "Notification de mise à pied disciplinaire",
      'abandonment': "Notification de rupture de contrat - Abandon de poste",
      'custom': "Notification de rupture de contrat"
    }
    const subject = `Objet : ${subjects[type] || subjects['custom']}`

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(subject, margin, yPosition)
    yPosition += 15

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    let leadText = ''
    let secondPara = ''
    let thirdPara = "Nous te souhaitons une bonne continuation sûr et en dehors de l’île !"

    if (type === 'simple_fault') {
      leadText = `Suite à ${reason || 'un manquement à tes obligations'}, nous te signifions par la présente un avertissement pour faute simple.`
      secondPara = "Nous te rappelons qu'un second avertissement de ce type entraînera un licenciement immédiat pour faute lourde. Cet avertissement sera retiré de ton dossier dans un délai de 30 jours."
      thirdPara = "En espérant que cette situation ne se reproduise pas."
    } else if (type === 'serious_fault') {
      leadText = `Suite à ${reason || 'un manquement grave à tes obligations'}, nous te signifions par la présente la rupture de ton contrat au LSES pour faute lourde à effet immédiat.`
      secondPara = "Nous te demandons de nous remettre ton défibrillateur et outil de désincarcération dès que possible sous peine de poursuites pénales."
    } else if (type === 'summons') {
      leadText = `Par la présente, nous te convoquons à un entretien avec la direction du LSES suite à : ${reason || 'un point sur ton activité professionnelle'}.`
      secondPara = "Cet entretien est obligatoire. Nous te demandons de bien vouloir nous transmettre tes disponibilités dès que possible afin de convenir d'une date et d'une heure pour cet échange."
      thirdPara = "Dans l'attente de cet échange."
    } else if (type === 'suspension') {
      const duration = data.suspensionDuration || 1
      const start = data.suspensionStartDate ? new Date(data.suspensionStartDate) : new Date()
      const end = new Date(start)
      end.setDate(start.getDate() + parseInt(duration))

      const fmt = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
      const formattedStart = fmt(start)
      const formattedEnd = fmt(end)

      leadText = `Par la présente, nous te signifions une mise à pied disciplinaire de ${duration} jours, du ${formattedStart} au ${formattedEnd} inclus, suite à : ${reason || 'un manquement à tes obligations'}.`
      secondPara = "Pendant cette période, nous te signifions que tu ne fais plus partie des effectifs du LSES. Tu es donc déchargé de tes fonctions jusqu'au terme de cette sanction."
      thirdPara = "Dans l'attente de ton retour au terme de cette période."
    } else if (type === 'abandonment') {
      leadText = "Suite pour cause d’absence prolongée, nous te signifions par la présente la rupture de ton contrat au LSES à effet immédiat."
      secondPara = "Dans le cas où tu ne souhaiterais pas revenir au LSES, nous te demandons de nous remettre ton défibrillateur et outil de désincarcération dès que possible sous peine de poursuites pénales."
    } else {
      leadText = `Suite à ${reason || 'un manquement à tes obligations'}, nous te signifions par la présente la rupture de ton contrat au LSES à effet immédiat.`
      secondPara = "Nous te demandons de nous remettre ton défibrillateur et outil de désincarcération dès que possible sous peine de poursuites pénales."
    }

    const splitLead = doc.splitTextToSize(leadText, pageWidth - 2 * margin)
    doc.text(splitLead, margin, yPosition)
    yPosition += (splitLead.length * 7) + 10

    const splitSecond = doc.splitTextToSize(secondPara, pageWidth - 2 * margin)
    doc.text(splitSecond, margin, yPosition)
    yPosition += (splitSecond.length * 7) + 10

    doc.text(thirdPara, margin, yPosition)
    yPosition += 30

    doc.setFont('helvetica', 'normal')
    doc.text('Cordialement,', margin, yPosition)
    yPosition += 7
    doc.text(serviceTitleSign, margin, yPosition)

    const stampX = margin + 10
    const stampY = yPosition + 5

    if (customSignature) {
      try {
        const sigImg = new Image()
        sigImg.src = customSignature
        await new Promise((resolve) => {
          sigImg.onload = resolve
          sigImg.onerror = resolve
        })

        const maxWidth = 70
        const maxHeight = 45
        let finalWidth = sigImg.width || 100
        let finalHeight = sigImg.height || 100

        const ratio = Math.min(maxWidth / finalWidth, maxHeight / finalHeight)
        finalWidth *= ratio
        finalHeight *= ratio

        const centeredX = stampX + (45 - finalWidth) / 2
        const centeredY = stampY + (45 - finalHeight) / 2

        doc.addImage(customSignature, 'PNG', centeredX, centeredY, finalWidth, finalHeight, undefined, undefined, -5)
      } catch (e) {
        console.error('Custom signature rendering failed:', e)
      }
    } else {
      try {
        const stampImg = new Image()
        stampImg.src = require('@/assets/images/stamp_black.png')
        doc.saveGraphicsState()
        doc.setGState(new doc.GState({ opacity: 0.8 }))
        doc.addImage(stampImg, 'PNG', stampX, stampY, 45, 45, undefined, undefined, -10)
        doc.restoreGraphicsState()
      } catch (e) { console.error('Stamp not found') }
    }

    if (preview) {
      window.open(doc.output('bloburl'), '_blank')
    } else {
      const fileNames = {
        'simple_fault': "Avertissement",
        'serious_fault': "Rupture de contrat - Faute lourde",
        'summons': "Convocation",
        'suspension': "Mise a pied",
        'abandonment': "Rupture de contrat - Abandon de poste",
        'custom': "Rupture de contrat"
      }
      const typeLabel = fileNames[type] || fileNames['custom']
      const fileName = `LSES - ${typeLabel} - ${name}.pdf`
      doc.save(fileName)
    }

  } catch (error) {
    console.error('Erreur PDF:', error)
    Swal.fire('Erreur', 'Une erreur est survenue lors de la génération du PDF.', 'error')
  }
}
