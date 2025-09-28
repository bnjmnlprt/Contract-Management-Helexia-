# Helexia | Outil de Contract Management

Cet outil, développé pour Helexia, a pour but de faciliter la gestion de contrats. Il permet de suivre des projets, d'analyser des contrats, de gérer les risques associés, et de calculer des pénalités de retard.

## Fonctionnalités principales

- **Tableau de bord des projets** : Vue d'ensemble de tous les projets avec des indicateurs clés de performance (KPIs).
- **Gestion de projet détaillée** : Suivi des risques, des échéances, et des changements pour chaque projet.
- **Calculateur de pénalités** : Outil pour calculer les pénalités de retard selon deux modes (Forfaitaire PV, Pourcentage SEED).
- **Analyse de contrat par IA** : Compare un contrat fournisseur aux documents de référence Helexia pour identifier les points de friction.
- **Modules Achats et Litiges** : Espaces dédiés pour le suivi des actions d'achat et la gestion des litiges.

## Prérequis

- Node.js (version 18.x ou supérieure recommandée)
- npm ou yarn

## Installation

1.  Clonez le dépôt sur votre machine locale :
    ```bash
    git clone https://github.com/votre-organisation/helexia-contract-management.git
    cd helexia-contract-management
    ```

2.  Installez les dépendances du projet (si un `package.json` est fourni) :
    ```bash
    npm install
    ```

3.  Créez un fichier d'environnement `.env` à la racine du projet en copiant le fichier d'exemple :
    ```bash
    cp .env.example .env
    ```

4.  Remplissez les variables d'environnement dans le fichier `.env` avec vos propres clés API et configurations.

## Lancement en Développement

Pour lancer l'application localement, vous aurez besoin d'un serveur de développement. Si vous utilisez un outil comme Vite ou Create React App, la commande est généralement :

```bash
npm start
```

Ouvrez [http://localhost:3000](http://localhost:3000) pour la voir dans votre navigateur.

## Déploiement sur Vercel

Ce projet est configuré pour un déploiement simple et rapide sur [Vercel](https://vercel.com/).

1.  Poussez votre code sur un dépôt GitHub.
2.  Importez le projet sur Vercel depuis votre dépôt GitHub.
3.  Configurez les variables d'environnement (celles présentes dans `.env.example`) dans les paramètres de votre projet Vercel.
4.  Lancez le déploiement. Le fichier `vercel.json` inclus assurera que le routage de l'application fonctionne correctement.
