# Implémentation de l'Affichage des Encodeurs Rotatifs

## Vue d'ensemble

Cette documentation décrit les modifications apportées pour implémenter un système complet de gestion de l'affichage des encodeurs rotatifs, conforme aux spécifications Elgato Stream Deck SDK pour la commande `setFeedback`.

## Modifications Backend (C++)

### 1. EncoderDisplayMonitor.h

**Localisation**: `Sources/backend-cpp/StreamdeckContext/ExportMonitors/EncoderDisplayMonitor.h`

**Structure de données étendue** :
```cpp
struct EncoderDisplayData {
    std::optional<std::string> value;        // Texte affiché (valeur brute ou mappée)
    std::optional<int> indicator;            // Jauge/indicateur (0-100)
    std::optional<std::string> icon;         // Chemin vers l'icône/image
    std::optional<std::string> title;        // Texte du titre (quand icône présente)
    std::optional<std::string> background;   // Chemin image ou couleur hex
    std::optional<std::string> text_color;   // Couleur du texte (#RRGGBB)
    std::optional<std::string> bg_color;     // Couleur de fond (#RRGGBB)
    std::optional<std::string> alignment;    // left, center, right
    std::optional<int> font_size;            // Taille de police (8-48)
    std::optional<int> font_weight;          // Poids de police (300, 400, 600, 700)
    std::optional<double> opacity;           // Opacité (0.0-1.0)
};
```

### 2. EncoderDisplayMonitor.cpp

**Localisation**: `Sources/backend-cpp/StreamdeckContext/ExportMonitors/EncoderDisplayMonitor.cpp`

#### Format de sérialisation des mappings

**Format étendu** (v5 - actuel) :
```
value:text:image:textColor:bgColor
```

**Formats supportés** (compatibilité arrière) :
- **v4** : `value:text:image` (sans couleurs)
- **v3** : `value:type:content` (type = "text" ou "image")
- **v2** : `value:text` (simple texte)

**Exemples** :
```
1:ON:images/on.png:#00FF00:#000000
0:OFF:images/off.png:#FF0000:#000000
0.5:HALF:::#FFFF00
```

#### Fonction parseValueMapping()

Parse le format étendu avec gestion des couleurs :
```cpp
std::optional<ValueMapping> parseValueMapping(const std::string& entry) {
    // Parse "value:text:image:textColor:bgColor"
    // Supporte tous les formats legacy
    // Retourne ValueMapping avec tous les champs optionnels
}
```

#### Fonction determineEncoderDisplay()

Logique de détermination de l'affichage :

1. **Récupération de la valeur courante** depuis EncoderAction
2. **Recherche du mapping** correspondant à la valeur
3. **Application des couleurs par valeur** (si définies)
4. **Application des paramètres globaux** (si pas de override)
5. **Calcul de l'indicateur** (gauge) basé sur min/max
6. **Priorisation** :
   - Si `image` défini → icon + title (texte comme titre)
   - Sinon si `text` défini → value avec styling
   - Sinon → valeur brute

### 3. StreamdeckContext.cpp

**Localisation**: `Sources/backend-cpp/StreamdeckContext/StreamdeckContext.cpp`

#### Construction du JSON setFeedback

Implémentation conforme aux specs Elgato avec objets imbriqués :

```cpp
nlohmann::json feedback;

// Structure value (texte principal)
if (display_data.value.has_value()) {
    nlohmann::json value_obj;
    value_obj["value"] = display_data.value.value();
    if (display_data.text_color.has_value()) {
        value_obj["color"] = display_data.text_color.value();
    }
    if (display_data.alignment.has_value()) {
        value_obj["alignment"] = display_data.alignment.value();
    }
    if (display_data.font_size.has_value() || display_data.font_weight.has_value()) {
        nlohmann::json font_obj;
        if (display_data.font_size.has_value()) {
            font_obj["size"] = display_data.font_size.value();
        }
        if (display_data.font_weight.has_value()) {
            font_obj["weight"] = display_data.font_weight.value();
        }
        value_obj["font"] = font_obj;
    }
    if (display_data.opacity.has_value()) {
        value_obj["opacity"] = display_data.opacity.value();
    }
    feedback["value"] = value_obj;
}

// Structure icon
if (display_data.icon.has_value()) {
    nlohmann::json icon_obj;
    icon_obj["value"] = display_data.icon.value();
    if (display_data.opacity.has_value()) {
        icon_obj["opacity"] = display_data.opacity.value();
    }
    feedback["icon"] = icon_obj;
}

// Structure title
if (display_data.title.has_value()) {
    nlohmann::json title_obj;
    title_obj["value"] = display_data.title.value();
    if (display_data.text_color.has_value()) {
        title_obj["color"] = display_data.text_color.value();
    }
    feedback["title"] = title_obj;
}

// Indicator (gauge)
if (display_data.indicator.has_value()) {
    feedback["indicator"] = display_data.indicator.value();
}

// Background (image path ou couleur hex)
if (display_data.background.has_value()) {
    feedback["background"] = display_data.background.value();
}

SetFeedback(feedback, context_);
```

## Modifications Frontend (HTML/JavaScript)

### encoder_prop_inspector.html

**Localisation**: `Sources/com.ctytler.dcs.sdPlugin/propertyinspector/encoder_prop_inspector.html`

#### Interface utilisateur

**Section "DCS Display Settings"** :
- Bouton "+ Add" pour ajouter des mappings
- Liste dynamique de rangées de mapping
- Chaque rangée contient :
  - **Value** : Valeur DCS à mapper
  - **Text** : Texte à afficher (fallback si pas d'image)
  - **Image** : Chemin vers image/icône (priorité sur texte)
  - **Bouton ⚙** : Ouvre les paramètres avancés
    - Text Color : Override de couleur de texte
    - BG Color : Override de couleur de fond
  - **Bouton ✓** : Sauvegarde les modifications
  - **Bouton ✕** : Supprime le mapping

#### Fonctions JavaScript

**addValueMapping(dcsValue, displayText, displayImage, textColor, bgColor)** :
- Crée dynamiquement une rangée HTML avec tous les champs
- Supporte les paramètres avancés (couleurs) cachés par défaut
- Incrémente un compteur unique pour les IDs de rangées

**toggleAdvanced(rowId)** :
- Affiche/masque les paramètres avancés (couleurs)

**serializeMappings()** :
- Parcourt toutes les rangées
- Extrait les valeurs des champs
- Format : `value:text:image:textColor:bgColor`
- Joint avec `;` comme séparateur
- Sauvegarde dans `encoder_value_text_mapping`
- Envoie au plugin via Stream Deck API

**deserializeMappings(mappingString)** :
- Parse la chaîne sérialisée
- Détecte automatiquement le format (v2, v3, v4, v5)
- Crée les rangées correspondantes
- **Compatibilité ascendante** avec tous les formats legacy

**Format de sérialisation exemple** :
```javascript
"1:ON:images/on.png:#00FF00:#000000;0:OFF:images/off.png:#FF0000:#000000;0.5:HALF:::#FFFF00"
```

## Hiérarchie de Priorité

### 1. Affichage (image vs texte)
- **Image présente** → icon + title (texte comme titre)
- **Texte seul** → value avec styling complet
- **Aucun mapping** → valeur brute DCS

### 2. Couleurs
- **Par valeur** (via ⚙ bouton avancé) → Override global
- **Global** (via settings Stream Deck) → Appliqué si pas d'override
- **Défaut SDK** → Si rien défini

### 3. Styling
- Font size, weight, opacity : Priorité aux settings globaux
- Alignment : Priorité aux settings globaux
- Background : Peut être image ou couleur

## Conformité Elgato SDK

### Structure JSON envoyée

```json
{
  "value": {
    "value": "ON",
    "color": "#00FF00",
    "alignment": "center",
    "font": {
      "size": 14,
      "weight": 700
    },
    "opacity": 1.0
  },
  "icon": {
    "value": "images/on.png",
    "opacity": 1.0
  },
  "title": {
    "value": "ON",
    "color": "#00FF00"
  },
  "indicator": 100,
  "background": "#000000"
}
```

### Commande WebSocket

```cpp
ESDConnectionManager::SetFeedback(const nlohmann::json& payload, const std::string& context)
```

Envoie via WebSocket au Stream Deck avec la structure imbriquée requise.

## Compatibilité et Migration

### Formats supportés

| Version | Format | Exemple |
|---------|--------|---------|
| v5 (actuel) | `value:text:image:textColor:bgColor` | `1:ON:on.png:#00FF00:#000000` |
| v4 | `value:text:image` | `1:ON:on.png` |
| v3 | `value:type:content` | `1:text:ON` ou `1:image:on.png` |
| v2 | `value:text` | `1:ON` |

### Migration automatique

Le parser détecte automatiquement l'ancien format et le convertit en interne. Pas de perte de données.

## Tests et Validation

### À tester

1. **Mappings basiques** :
   - Texte seul
   - Image seule
   - Texte + image

2. **Couleurs** :
   - Couleurs par valeur (override)
   - Couleurs globales
   - Mix des deux

3. **Indicateur** :
   - Calcul correct avec min/max
   - Affichage de la gauge

4. **Compatibilité** :
   - Import de profils legacy
   - Conservation des anciens formats

5. **Edge cases** :
   - Valeurs non mappées (fallback)
   - Champs vides
   - Couleurs hex invalides

## Limitations connues

1. **Global layout settings supprimés** : Les paramètres de layout global (background, alignment, font) ont été supprimés car déjà gérés nativement par Stream Deck dans l'interface de configuration de l'encodeur.

2. **Pas de validation côté client** : Les couleurs hex et les chemins d'images ne sont pas validés avant envoi.

3. **Performance** : Le parsing des mappings est fait à chaque update. Pourrait être optimisé avec un cache.

## Prochaines Étapes

1. **Testing complet** avec hardware Stream Deck
2. **Documentation utilisateur** pour la fonctionnalité
3. **Migration vers React** (voir section Architecture Frontend)
4. **Validation des inputs** côté frontend
5. **Optimisation du parsing** avec cache

---

## Notes sur l'Architecture Frontend

### État actuel : Double Frontend

Le plugin utilise actuellement deux approches frontend distinctes :

1. **HTML/JavaScript vanilla** (`propertyinspector/*.html`) :
   - Property Inspectors pour les actions Stream Deck
   - `index.html` : Boutons standards
   - `encoder_prop_inspector.html` : Encodeurs rotatifs
   - `dcs_bios_prop_inspector.html` : DCS-BIOS
   - Communication directe avec Stream Deck SDK

2. **React/TypeScript** (`frontend-react-js/`) :
   - Interface de configuration DCS-BIOS avancée
   - Build séparé copié dans `settingsUI/`
   - Architecture moderne avec composants réutilisables

### Problématique

- **Complexité croissante** : Le HTML vanilla devient difficile à maintenir avec les mappings dynamiques
- **Duplication de code** : Logique similaire dans les deux systèmes
- **Maintenabilité** : React offre meilleure structure et testabilité
- **API moderne** : Stream Deck SDK v6+ supporte mieux les frameworks modernes

### Migration vers React : Recommandation

**Avantages** :
- ✅ Composants réutilisables (AddValueMapping, ColorPicker, etc.)
- ✅ State management avec hooks (useState, useReducer)
- ✅ Validation intégrée avec TypeScript
- ✅ Tests unitaires plus faciles
- ✅ Performance avec Virtual DOM
- ✅ Conforme API Stream Deck moderne

**Stratégie de migration** :
1. Créer des composants React pour chaque Property Inspector
2. Utiliser le Stream Deck SDK v6 avec support React
3. Réutiliser la logique backend (pas de changement C++)
4. Migration progressive (un PI à la fois)
5. Conserver compatibilité avec profils existants

Cette migration sera abordée dans une phase ultérieure du projet.
