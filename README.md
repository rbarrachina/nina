# Expedient 23

PWA estatica per a una ruta de 10 proves pel barri de Font de la Guatlla.

## Provar en local

```bash
python3 -m http.server 4173
```

Obre:

```text
http://localhost:4173/
```

Per provar les respostes sense GPS ni coordenades:

```text
http://localhost:4173/?test=1
```

## Que falta abans del dia del joc

Les proves son a `app.js`, dins de l'array `scenes`.

Per cada prova cal completar:

```js
lat: 41.xxxxx,
lng: 2.xxxxx,
```

El radi de desbloqueig esta definit a:

```js
const RADIUS_METERS = 40;
```

També falta afegir:

- la resposta exacta de l'escola;
- les 3 proves pendents;
- coordenades reals de les 10 escenes;
- revisar l'ordre i les lletres si vols canviar com apareixen.

## Publicar a GitHub Pages

1. Crea un repositori a GitHub.
2. Puja aquests fitxers a la branca principal.
3. A GitHub, ves a `Settings > Pages`.
4. A `Build and deployment`, tria `Deploy from a branch`.
5. Selecciona la branca principal i carpeta `/root`.
6. Guarda.

GitHub et donara una URL amb HTTPS. Amb aquesta URL, Android permet afegir la web a la pantalla d'inici com una app.
