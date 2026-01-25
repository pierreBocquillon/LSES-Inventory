import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore"
import { v4 as uuidv4 } from 'uuid'

const db = getFirestore()
const COLLECTION = "settings"

class SharedChecklist {
    constructor(docId) {
        this.docId = docId
    }

    listen(callback) {
        return onSnapshot(doc(db, COLLECTION, this.docId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                callback({
                    tasks: data.tasks || [],
                    lastReset: data.lastReset || null
                })
            } else {
                // Initialize
                const initial = { tasks: [], lastReset: null }
                setDoc(doc(db, COLLECTION, this.docId), initial)
                callback(initial)
            }
        })
    }

    async saveState(data) {
        // Deep clone to remove Vue Proxies
        const sanitized = JSON.parse(JSON.stringify(data))
        await setDoc(doc(db, COLLECTION, this.docId), sanitized, { merge: true })
    }

    async addTask(currentTasks, currentLastReset, text, link = null) {
        const newTask = {
            id: uuidv4(),
            text: text,
            link: link || null,
            done: false,
            doneAt: null
        }
        await this.saveState({
            tasks: [...currentTasks, newTask],
            lastReset: currentLastReset
        })
    }

    async removeTask(currentTasks, currentLastReset, taskId) {
        await this.saveState({
            tasks: currentTasks.filter(t => t.id !== taskId),
            lastReset: currentLastReset
        })
    }

    async toggleTask(currentTasks, currentLastReset, taskId) {
        const updated = currentTasks.map(t => {
            if (t.id === taskId) {
                const isDone = !t.done
                return {
                    ...t,
                    done: isDone,
                    doneAt: isDone ? Date.now() : null
                }
            }
            return t
        })
        await this.saveState({ tasks: updated, lastReset: currentLastReset })
    }

    async reset(currentTasks) {
        const updated = currentTasks.map(t => ({
            ...t,
            done: false,
            doneAt: null
        }))
        await this.saveState({
            tasks: updated,
            lastReset: Date.now()
        })
    }

    async updateTaskDate(currentTasks, currentLastReset, taskId) {
        const updated = currentTasks.map(t => {
            if (t.id === taskId) {
                return { ...t, done: true, doneAt: Date.now() }
            }
            return t
        })
        await this.saveState({ tasks: updated, lastReset: currentLastReset })
    }
}

export default SharedChecklist
