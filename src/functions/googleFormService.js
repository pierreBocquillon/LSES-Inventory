const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcOpU_adYSja6z6ioF4o-1qxwhepArMQavbtsa3NN_-_hHfLqWa1TB3Ww1gSkw4Mbo/exec'

export async function fetchFormResponses() {
    const response = await fetch(SCRIPT_URL)
    if (!response.ok) throw new Error('Erreur lors de la récupération des réponses Google Forms')

    const data = await response.json()
    const recentData = data.slice(-15)

    return recentData.map((row, index) => {
        const horodateur = row['Horodateur']
        const createdAt = horodateur ? new Date(horodateur).getTime() : Date.now()

        const rawSpecialty = row['Vous avez besoin de quel spécialiste ?'] || ''

        return {
            _rowIndex: index,
            createdAt,
            horodateur: horodateur || '',
            patientName: (row['Votre nom et prénom'] || '').trim(),
            patientPhone: String(row['Votre n° de téléphone'] || '').trim(),
            specialty: rawSpecialty.trim(),
            availability: (row['Quelles sont vos disponibilités pour le RDV ?\nPréciser créneaux horaires et jours.'] || '').trim(),
            notes: (row['Divers (préférence, information complémentaire, ...)'] || '').trim(),
            reason: (row['Pourquoi demandez-vous une consultation ?'] || '').trim(),
            sheetComment: (row['sans couleur - Rendez-vous à effectuer\nJaune - Rendez-vous planifié\nVert - Rendez-vous effectué\nRouge - Rendez-vous annulé\n\n✏️ - Commentaire'] || '').trim()
        }
    })
}
