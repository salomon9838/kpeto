import { useState } from "react";

export default function Login() {
    const [creds, setCreds] = useState({ username: "", password: "" });

    const handleLogin = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(creds)
            });
            const data = await response.json();
            
            if (response.ok) {
                // CRUCIAL : On enregistre le jeton ici pour que ExamForm puisse le lire
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                alert("Connexion réussie !");
                window.location.href = "/examen"; // Redirige vers ton formulaire
            } else {
                alert("Identifiants incorrects");
            }
        } catch (error) {
            alert("Erreur de connexion au serveur");
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
            <h2>Connexion MediTrack Pro</h2>
            <input type="text" placeholder="Nom d'utilisateur" 
                   onChange={e => setCreds({...creds, username: e.target.value})} />
            <input type="password" placeholder="Mot de passe" 
                   onChange={e => setCreds({...creds, password: e.target.value})} />
            <button onClick={handleLogin}>Se connecter</button>
        </div>
    );
}