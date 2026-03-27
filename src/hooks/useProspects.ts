import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  getDocFromServer,
  arrayUnion
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Prospect, ActivityLogEntry } from '../types';

export const useProspects = (user: User | null) => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'info' }[]>([]);

  const addNotification = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);

    // Browser notification if permitted
    if (Notification.permission === "granted") {
      new Notification("ProspectRadar AI", {
        body: message,
        icon: "/favicon.ico"
      });
    }
  };

  useEffect(() => {
    if (!user) {
      setProspects([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, `users/${user.uid}/prospects`),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Prospect[];
      setProspects(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error: ", error);
      addNotification("Erreur de synchronisation Firestore", "info");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { 
        status,
        activity_log: arrayUnion({
          id: Math.random().toString(36).substring(7),
          type: 'status_change',
          content: `Statut changé en : ${status}`,
          timestamp: new Date().toISOString()
        })
      });
      addNotification(`Statut mis à jour : ${status}`, 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la mise à jour du statut", 'info');
    }
  };

  const updateFollowUpDate = async (id: string, date: string) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { follow_up_date: date });
      if (date) {
        addNotification(`Rappel défini pour le ${new Date(date).toLocaleDateString()}`, 'success');
      } else {
        addNotification(`Rappel supprimé`, 'info');
      }
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la définition du rappel", 'info');
    }
  };

  const updateEmail = async (id: string, email: string) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { email });
      addNotification('Email mis à jour !', 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la mise à jour de l'email", 'info');
    }
  };

  const updateTags = async (id: string, tags: string[]) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { tags });
      addNotification('Tags mis à jour !', 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la mise à jour des tags", 'info');
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, { notes });
      addNotification('Notes mises à jour !', 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la mise à jour des notes", 'info');
    }
  };

  const addActivity = async (id: string, activity: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    if (!user) return;
    try {
      const prospectRef = doc(db, `users/${user.uid}/prospects`, id);
      await updateDoc(prospectRef, {
        activity_log: arrayUnion({
          ...activity,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString()
        })
      });
      addNotification('Activité ajoutée !', 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de l'ajout de l'activité", 'info');
    }
  };

  const deleteProspect = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/prospects`, id));
      addNotification('Prospect supprimé', 'success');
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la suppression", 'info');
    }
  };

  return {
    prospects,
    loading,
    notifications,
    addNotification,
    updateStatus,
    updateFollowUpDate,
    updateEmail,
    updateTags,
    updateNotes,
    addActivity,
    deleteProspect
  };
};
