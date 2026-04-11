import { getFirestore, doc, onSnapshot, setDoc, collection } from "firebase/firestore"
import { v4 as uuidv4 } from 'uuid'

const db = getFirestore()
const COLLECTION = "training_objectives"
const DOC_ID = "weekly_goals"

class TrainingObjective {
    static listen(callback) {
        return onSnapshot(doc(db, COLLECTION, DOC_ID), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data()
                callback({
                    tasks: data.tasks || [],
                    lastReset: data.lastReset || null
                })
            } else {
                const initial = { tasks: [], lastReset: null }
                setDoc(doc(db, COLLECTION, DOC_ID), initial)
                callback(initial)
            }
        })
    }

    static async saveState(data) {
        const sanitized = JSON.parse(JSON.stringify(data))
        await setDoc(doc(db, COLLECTION, DOC_ID), sanitized, { merge: true })
    }

    static async addTask(currentTasks, currentLastReset, text, traineeId = null, traineeName = null) {
        const newTask = {
            id: uuidv4(),
            text: text,
            traineeId: traineeId || null,
            traineeName: traineeName || null,
            done: false,
            doneAt: null,
            doneBy: null
        }
        await this.saveState({
            tasks: [...currentTasks, newTask],
            lastReset: currentLastReset
        })
    }

    static async removeTask(currentTasks, currentLastReset, taskId) {
        await this.saveState({
            tasks: currentTasks.filter(t => t.id !== taskId),
            lastReset: currentLastReset
        })
    }

    static async toggleTask(currentTasks, currentLastReset, taskId, userName = null) {
        const updated = currentTasks.map(t => {
            if (t.id === taskId) {
                const isDone = !t.done
                return {
                    ...t,
                    done: isDone,
                    doneAt: isDone ? Date.now() : null,
                    doneBy: isDone ? userName : null
                }
            }
            return t
        })
        await this.saveState({ tasks: updated, lastReset: currentLastReset })
    }

    static async reset(currentTasks) {
        const updated = currentTasks.map(t => ({
            ...t,
            done: false,
            doneAt: null,
            doneBy: null
        }))
        await this.saveState({
            tasks: updated,
            lastReset: Date.now()
        })
    }
}

export default TrainingObjective
