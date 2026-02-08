import { auth } from '../config/firebase-config.js';
import { store } from '../state/store.js';

export const loginWithEmail = async (email, password) => {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        let message = 'Error al iniciar sesión';
        if (error.code === 'auth/user-not-found') message = 'Usuario no encontrado';
        if (error.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
        if (error.code === 'auth/invalid-email') message = 'Email inválido';
        return { success: false, error: message };
    }
};

export const registerWithEmail = async (email, password) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        let message = 'Error al registrarse';
        if (error.code === 'auth/email-already-in-use') message = 'El email ya está en uso';
        if (error.code === 'auth/weak-password') message = 'La contraseña debe tener al menos 6 caracteres';
        return { success: false, error: message };
    }
};

export const logout = async () => {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Initialize Auth Listener
export const initAuthListener = () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            store.setAuthUser({
                isAuthenticated: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0]
                },
                token: 'firebase-token' // Simplified
            });
        } else {
            // User is signed out
            store.setAuthUser({
                isAuthenticated: false,
                user: null,
                token: null
            });
        }
    });
};
