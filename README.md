# Cinematic Scroll Site — Template Restaurant Premium

Mini site "cinematic scroll" 100 % HTML/CSS/JS vanilla, prêt à déployer pour un restaurant.

## 1. Images

Placez **3 images** dans le dossier `images/` :

```
images/
  scene-01.jpg   ← Façade / ambiance extérieure
  scene-02.jpg   ← Salle / intérieur
  scene-03.jpg   ← Plat signature / détail
```

**Format recommandé** : JPEG, 1920×1080 px minimum, optimisé web (< 500 Ko chacune).

> Si les images sont absentes, le site affiche des placeholders et un warning dans la console.

---

## 2. Lancer localement

### Option A — VS Code Live Server
1. Ouvrir le dossier `cinematic-scroll-site` dans VS Code
2. Installer l'extension **Live Server** (Ritwick Dey)
3. Clic droit sur `index.html` → **Open with Live Server**

### Option B — Python
```bash
cd cinematic-scroll-site
python3 -m http.server 8080
```
Puis ouvrir `http://localhost:8080`

### Option C — Node.js
```bash
npx serve .
```

---

## 3. Personnalisation

### Textes
Ouvrir `index.html` et modifier :
- Le **kicker** : `<span class="overlay__kicker">Experience</span>`
- Le **titre** : `<h1 class="overlay__title">Maison Lumière</h1>`
- Le **paragraphe** et le **CTA**
- La section `#reserve` (menus, prix, descriptions)

### Couleurs
Ouvrir `styles.css`, modifier les variables CSS dans `:root` :
```css
--color-accent:       #c9a96e;   /* Or — couleur principale */
--color-accent-hover: #dfc089;   /* Or clair au hover */
--color-bg:           #0a0a0a;   /* Fond principal */
--color-surface:      #141414;   /* Fond section réservation */
```

### Hauteur de la zone scroll
```css
--scene-height: 350vh;  /* Plus grand = scroll plus lent */
```

---

## 4. Dupliquer pour un autre client

1. Copier tout le dossier
2. Remplacer les 3 images dans `images/`
3. Modifier les textes dans `index.html`
4. Ajuster les couleurs si besoin dans `styles.css`

C'est tout. Aucune dépendance, aucun build, aucun framework.

---

## Stack technique

| Composant | Détail |
|-----------|--------|
| HTML      | Sémantique, accessible |
| CSS       | Custom properties, mobile-first, glassmorphism |
| JS        | Canvas 2D, rAF, scroll passif, zero dependencies |
| Accessibilité | Contrastes WCAG, focus visible, `prefers-reduced-motion` |
| Fallback  | Image statique si canvas indisponible ou mouvement réduit |
